using System;
using System.Collections.Generic;

namespace Comments.Models
{
	public partial class Comment
	{
		public int CommentId { get; set; }
		public int LocationId { get; set; }
		public Guid CreatedByUserId { get; set; }
		public string CommentText { get; set; }
		public DateTime CreatedDate { get; set; }
		public DateTime LastModifiedDate { get; set; }
		public Guid LastModifiedByUserId { get; set; }
		public bool IsDeleted { get; set; }
		public int StatusId { get; set; }

		public Location Location { get; set; }
		public Status Status { get; set; }

		public ICollection<SubmissionComment> SubmissionComment { get; set; }
		public ICollection<CommentKeyPhrase> CommentKeyPhrase { get; set; }

		public string Sentiment { get; set; }
		public float SentimentScorePositive { get; set; }
		public float SentimentScoreNegative { get; set; }
		public float SentimentScoreNeutral { get; set; }
		public float SentimentScoreMixed { get; set; }
	}
}
