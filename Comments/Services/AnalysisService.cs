using System;
using Comments.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.Comprehend;
using Amazon.Comprehend.Model;
using Answer = Comments.ViewModels.Answer;
using Comment = Comments.ViewModels.Comment;
using CommentKeyPhrase = Comments.Models.CommentKeyPhrase;

namespace Comments.Services
{
	public interface IAnalysisService
	{
		Task AnalyseAndUpdateDatabase(ConsultationsContext context, IList<Comment> submissionComments, IList<Answer> submissionAnswers);
	}

	public class AnalysisService : IAnalysisService
	{
		private const string LanguageCode = "en";
		private const int MaximumBatchSize = 25;
		private readonly IAmazonComprehend _amazonComprehend;

		#region Batching - this is here since AWS can analyse 25 blocks of text at a time.

		private enum CommentOrAnswer
		{
			Comment,
			Answer
		}

		private class Batches
		{
			public Batches(IEnumerable<Batch> allBatches)
			{
				AllBatches = allBatches;
			}

			public IEnumerable<Batch> AllBatches { get; private set; } 
		}

		private class Batch
		{
			public Batch(IList<ItemForAnalysis> itemsInBatch)
			{
				ItemsInBatch = itemsInBatch;
			}

			public IList<ItemForAnalysis> ItemsInBatch { get; private set; }
		}

		private class ItemForAnalysis 
		{
			public ItemForAnalysis(CommentOrAnswer type, int id, string text)
			{
				Type = type;
				Id = id;
				Text = text;
			}

			public CommentOrAnswer Type { get; }
			public int Id { get; }
			public string Text { get;  }
		}

		private static Batches BatchUp(IList<Comment> submissionComments, IList<Answer> submissionAnswers)
		{
			var allItems = new List<ItemForAnalysis>();

			if (submissionComments != null && submissionComments.Any())
			{
				allItems.AddRange(submissionComments.Select(comment => new ItemForAnalysis(CommentOrAnswer.Comment, comment.CommentId, comment.CommentText)));
			}
			if (submissionAnswers != null && submissionAnswers.Any())
			{
				allItems.AddRange(submissionAnswers.Select(answer => new ItemForAnalysis(CommentOrAnswer.Answer, answer.AnswerId, answer.AnswerText)));
			}

			var batchedUpItems = SplitList<ItemForAnalysis>(allItems, MaximumBatchSize);

			return new Batches(batchedUpItems.Select(batch => new Batch(batch)));
		}

		private static IEnumerable<List<T>> SplitList<T>(List<T> locations, int nSize = 30)
		{
			for (var i = 0; i < locations.Count; i += nSize)
			{
				yield return locations.GetRange(i, Math.Min(nSize, locations.Count - i));
			}
		}

		private (List<String> textList, List<Models.Comment> comments, List<Models.Answer> answers) GetTextCommentsAndAnswersInBatch(ConsultationsContext context,
			Batch batch)
		{
			var commentIds = batch.ItemsInBatch.Where(item => item.Type == CommentOrAnswer.Comment).Select(item => item.Id).ToList();
			var commentsToUpdate = context.Comment.Where(comment => commentIds.Contains(comment.CommentId)).ToList();

			var answerIds = batch.ItemsInBatch.Where(item => item.Type == CommentOrAnswer.Answer).Select(item => item.Id).ToList();
			var answersToUpdate = context.Answer.Where(answer => answerIds.Contains(answer.AnswerId)).ToList();

			return (batch.ItemsInBatch.Select(item => item.Text).ToList(), commentsToUpdate, answersToUpdate);
		}

		#endregion Batching

		public AnalysisService(IAmazonComprehend amazonComprehend)
		{
			_amazonComprehend = amazonComprehend;
		}

		public async Task AnalyseAndUpdateDatabase(ConsultationsContext context, IList<Comment> submissionComments,
			IList<Answer> submissionAnswers)
		{
			var batchedUpCommentsAndAnswers = BatchUp(submissionComments, submissionAnswers);

			await SentimentAnalysis(context, batchedUpCommentsAndAnswers);

			await KeyPhraseAnalysis(context, batchedUpCommentsAndAnswers);
		}

		/// <summary>
		/// SentimentAnalysis - calls BatchDetectSentimentAsync which returns the Sentiment (positive, negative, neutral or mixed) along with a
		/// SentimentScore - which contains the score of each sentiment as a float.
		///
		/// Then the database is updated. the sentiments are stored in the Comment and Answer tables.
		/// </summary>
		/// <param name="context"></param>
		/// <param name="batches"></param>
		/// <returns></returns>
		private async Task SentimentAnalysis(ConsultationsContext context, Batches batches)
		{
			foreach (var batch in batches.AllBatches)
			{
				var itemsInBatch = GetTextCommentsAndAnswersInBatch(context, batch);

				var batchDetectSentimentRequest = new BatchDetectSentimentRequest()
				{
					LanguageCode = LanguageCode,
					TextList = itemsInBatch.textList
				};

				var batchDetectSentimentResponse = await _amazonComprehend.BatchDetectSentimentAsync(batchDetectSentimentRequest);

				foreach (var result in batchDetectSentimentResponse.ResultList)
				{
					var id = batch.ItemsInBatch[result.Index].Id;

					if (batch.ItemsInBatch[result.Index].Type == CommentOrAnswer.Comment)
					{
						var commentToUpdate = itemsInBatch.comments.Single(comment => comment.CommentId == id);

						commentToUpdate.Sentiment = result.Sentiment.Value;
						commentToUpdate.SentimentScorePositive = result.SentimentScore.Positive;
						commentToUpdate.SentimentScoreNegative = result.SentimentScore.Negative;
						commentToUpdate.SentimentScoreNeutral = result.SentimentScore.Neutral;
						commentToUpdate.SentimentScoreMixed = result.SentimentScore.Mixed;
					}
					else
					{
						var answerToUpdate = itemsInBatch.answers.Single(answer => answer.AnswerId == id);

						answerToUpdate.Sentiment = result.Sentiment.Value;
						answerToUpdate.SentimentScorePositive = result.SentimentScore.Positive;
						answerToUpdate.SentimentScoreNegative = result.SentimentScore.Negative;
						answerToUpdate.SentimentScoreNeutral = result.SentimentScore.Neutral;
						answerToUpdate.SentimentScoreMixed = result.SentimentScore.Mixed;
					}
				}
				context.Comment.UpdateRange(itemsInBatch.comments);
				context.Answer.UpdateRange(itemsInBatch.answers);
				await context.SaveChangesAsync();
			}
		}

		/// <summary>
		/// KeyPhraseAnalysis - calls BatchDetectKeyPhrasesAsync to pull out all the keyphrases from each comment and answer.
		///
		/// note that it might pull out duplicate keyphrases from each comment. in that case we ignore the duplicates.
		///
		/// the DB is then updated, that's the KeyPhrase, CommentKeyPhrase and AnswerKeyPhrase tables.
		/// </summary>
		/// <param name="context"></param>
		/// <param name="batches"></param>
		/// <returns></returns>
		private async Task KeyPhraseAnalysis(ConsultationsContext context, Batches batches)
		{
			foreach (var batch in batches.AllBatches)
			{
				var itemsInBatch = GetTextCommentsAndAnswersInBatch(context, batch);

				var request = new BatchDetectKeyPhrasesRequest()
				{
					LanguageCode = LanguageCode,
					TextList = itemsInBatch.textList
				};

				var allKeyPhrases = context.KeyPhrase.ToList();
				var commentKeyPhrasesToAdd = new List<CommentKeyPhrase>();
				var answerKeyPhrasesToAdd = new List<AnswerKeyPhrase>();

				var batchDetectKeyPhrasesResponse = _amazonComprehend.BatchDetectKeyPhrasesAsync(request);

				foreach (var result in batchDetectKeyPhrasesResponse.Result.ResultList) //foreach comment or answer
				{
					var id = batch.ItemsInBatch[result.Index].Id;

					foreach (var keyPhrase in result.KeyPhrases) //for each keyphrase found in each comment or answer
					{
						var keyPhraseId = allKeyPhrases.FirstOrDefault(existingKeyPhrase => existingKeyPhrase.Text.Equals(keyPhrase.Text, StringComparison.OrdinalIgnoreCase))?.KeyPhraseId;
						if (keyPhraseId == null)
						{
							var savedKeyPhrase = context.KeyPhrase.Add(new Models.KeyPhrase(keyPhrase.Text));
							await context.SaveChangesAsync();
							keyPhraseId = savedKeyPhrase.Entity.KeyPhraseId;
							allKeyPhrases = context.KeyPhrase.ToList(); 
						}

						if (batch.ItemsInBatch[result.Index].Type == CommentOrAnswer.Comment)
						{
							if (!commentKeyPhrasesToAdd.Any(commentKeyPhrase => commentKeyPhrase.KeyPhraseId == keyPhraseId && commentKeyPhrase.CommentId == id))
							{
								commentKeyPhrasesToAdd.Add(new CommentKeyPhrase(id, keyPhraseId.Value, keyPhrase.Score));
							}
						}
						else
						{
							if (!answerKeyPhrasesToAdd.Any(answerKeyPhrase => answerKeyPhrase.KeyPhraseId == keyPhraseId && answerKeyPhrase.AnswerId == id))
							{
								answerKeyPhrasesToAdd.Add(new AnswerKeyPhrase(id, keyPhraseId.Value, keyPhrase.Score));
							}
						}
					}
				}
				context.CommentKeyPhrase.AddRange(commentKeyPhrasesToAdd);
				context.AnswerKeyPhrase.AddRange(answerKeyPhrasesToAdd);
				await context.SaveChangesAsync();
			}
		}
	}
}
