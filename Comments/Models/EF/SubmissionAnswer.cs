namespace Comments.Models.EF
{
    public partial class SubmissionAnswer
    {
		public int SubmissionAnswerId { get; set; }
		public int SubmissionId { get; set; }
		public int CommentId { get; set; }
    }
}
