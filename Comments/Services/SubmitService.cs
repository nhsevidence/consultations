using System;
using Comments.Models;
using Comments.ViewModels;
using System.Collections.Generic;
using System.Linq;
using NICE.Feeds;

namespace Comments.Services
{
	public interface ISubmitService
	{
		(int rowsUpdated, Validate validate) Submit(ViewModels.Submission submission);
	}

	public class SubmitService : ISubmitService
	{
		private readonly ConsultationsContext _context;
		private readonly IConsultationService _consultationService;
		private readonly User _currentUser;

		public SubmitService(ConsultationsContext context, IUserService userService, IConsultationService consultationService)
		{
			_context = context;
			_consultationService = consultationService;
			_currentUser = userService.GetCurrentUser();
		}

		public (int rowsUpdated, Validate validate) Submit(ViewModels.Submission submission)
		{
			if (!_currentUser.IsAuthenticated || string.IsNullOrEmpty(_currentUser.UserId))
				return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in submitting comments and answers"));

			//if a user is submitting a different users comment, the context will throw an exception.

			var anySourceURI = submission.SourceURIs.FirstOrDefault();
			if (anySourceURI == null)
				return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: false, message: "Could not find SourceURI"));

			var consultationState = _consultationService.GetConsultationState(anySourceURI, PreviewState.NonPreview);

			if (!consultationState.ConsultationIsOpen)
				return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: false, message: "Consultation is not open for submissions"));

			var hasSubmitted = _consultationService.GetSubmittedDate(anySourceURI);
			if (hasSubmitted !=null)
				return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: false, message: "User has already submitted."));

			var submissionToSave = _context.InsertSubmission(_currentUser.UserId, submission.RespondingAsOrganisation, submission.OrganisationName, submission.HasTobaccoLinks, submission.TobaccoDisclosure, submission.OrganisationExpressionOfInterest);

			var submittedStatus = _context.GetStatus(StatusName.Submitted);

			UpdateCommentsModel(submission.Comments, submissionToSave, submittedStatus);
			UpdateAnswersModel(submission.Answers, submissionToSave, submittedStatus);

			//now for analytics calculate the number of seconds between the user's first comment or answer and the submission date
			var earliestDate = submissionToSave.SubmissionComment.Any() ? submissionToSave.SubmissionComment.Min(sc => sc.Comment.CreatedDate) : DateTime.MaxValue;
			var earliestAnswer = submissionToSave.SubmissionAnswer.Any() ? submissionToSave.SubmissionAnswer.Min(sa => sa.Answer.CreatedDate) : DateTime.MaxValue;
			if (earliestAnswer < earliestDate)
			{
				earliestDate = earliestAnswer;
			}
			submission.DurationBetweenFirstCommentOrAnswerSavedAndSubmissionInSeconds = (submissionToSave.SubmissionDateTime - earliestDate).TotalSeconds;

			return (rowsUpdated: _context.SaveChanges(), validate: null);
		}

		private void UpdateCommentsModel(IList<ViewModels.Comment> comments, Models.Submission submission, Models.Status status)
		{
			var commentIds = comments.Select(c => c.CommentId).ToList();
			_context.UpdateCommentStatus(commentIds, status);

			foreach (var commentInViewModel in comments)
			{
				commentInViewModel.UpdateStatusFromDBModel(status);
			}
			_context.AddSubmissionComments(commentIds, submission.SubmissionId);
		}

		private void UpdateAnswersModel(IList<ViewModels.Answer> answers, Models.Submission submission, Models.Status status)
		{
			var answerIds = answers.Select(a => a.AnswerId).ToList();
			_context.UpdateAnswerStatus(answerIds, status);

			foreach (var answerInViewModel in answers)
			{
				answerInViewModel.UpdateStatusFromDBModel(status);
			}
			_context.AddSubmissionAnswers(answerIds, submission.SubmissionId);
		}	
	}
}
