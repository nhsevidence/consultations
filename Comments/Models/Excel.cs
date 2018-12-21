namespace Comments.Models
{
    public class Excel
    {
	    public string ConsultationName { get; set; }
	    public string DocumentName { get; set; }
	    public string ChapterTitle { get; set; }
	    public string Section { get; set; }
	    public string Quote { get; set; }
	    public string UserName { get; set; }
		public string Email { get; set; }
	    public int? QuestionId { get; set; }
	    public string Question { get; set; }
		public int? CommentId { get; set; }
	    public string Comment { get; set; }
	    public int? AnswerId { get; set; }
	    public string Answer { get; set; }
		public bool? RepresentsOrganisation { get; set; }
	    public string OrganisationName { get; set; }
	    public bool? HasTobaccoLinks { get; set; }
	    public string TobaccoIndustryDetails { get; set; }
		public string Order { get; set; }

	}
}
