using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;

namespace Comments.ViewModels
{
	[Flags]
	public enum QuestionsOrComments
	{
		Questions = 1,
		Comments = 2
	}

	public enum ReviewSortOrder
	{
		DocumentAsc,
		DateDesc
	}

	public class ReviewPageViewModel
    {
	    
	    public CommentsAndQuestions CommentsAndQuestions { get; set; }

		/// <summary>
		/// This property is initialised from appsettings.json, then it gets updated in CommentService with documents and the counts are updated.
		/// </summary>
	    public IEnumerable<OptionFilterGroup> Filters { get; set; }

		/// <summary>
		/// This is the organisation name from nice accounts. it's going to prepopulate the organisation name on the review page, but will be overwritable. it won't change the field in nice accounts.
		/// </summary>
	    public string OrganisationName { get; set; }

		public bool? IsLead { get; set; }

		#region Filter options from the check boxes

		
	    [JsonProperty(ItemConverterType = typeof(StringEnumConverter))]
	    public IEnumerable<QuestionsOrComments> Type
	    {
		    get;
		    set;
	    }

	    public IEnumerable<int> Document { get; set; }

		public IEnumerable<string> Commenter { get; set; }

	    [JsonConverter(typeof(StringEnumConverter))]
	    public ReviewSortOrder Sort { get; set; } = ReviewSortOrder.DocumentAsc;

		#endregion Filter options
	}
}
