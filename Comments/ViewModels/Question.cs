using System;
using System.Collections.Generic;
using System.Linq;

namespace Comments.ViewModels
{
    public class Question : Location
    {
        public Question() { } //only here for model binding. don't use it in code.
        public Question(Models.Location location, Models.Question question) : base(location.LocationId, location.SourceURI, location.HtmlElementID,
            location.RangeStart, location.RangeStartOffset, location.RangeEnd, location.RangeEndOffset, location.Quote, location.Order, show: true, section: location.Section)
        {
            QuestionId = question.QuestionId;
            QuestionText = question.QuestionText;
            QuestionTypeId = question.QuestionTypeId;
            LastModifiedByUserId = question.LastModifiedByUserId;
            LastModifiedDate = question.LastModifiedDate;

            QuestionType = new QuestionType(question.QuestionType);
            if (!(question.Answer is null))
                Answers = question.Answer.Select(answer => new Answer(answer)).ToList();
        }

        public int QuestionId { get; set; }
        public string QuestionText { get; set; }
        public int QuestionTypeId { get; set; }
        public Guid LastModifiedByUserId { get; set; }
        public DateTime LastModifiedDate { get; set; }

        public ViewModels.QuestionType QuestionType { get; set; }
        public IList<ViewModels.Answer> Answers { get; set; }
        public bool IsSubmissionQuestion => this.SourceURI.EndsWith("/submission"); 
    }

    public class QuestionType
    {
        public QuestionType() { } //only here for model binding. don't use it in code.
        public QuestionType(Models.QuestionType questionType)
        {
	        QuestionTypeId = questionType.QuestionTypeId;
			Description = questionType.Description;
            HasTextAnswer = questionType.HasTextAnswer;
            HasBooleanAnswer = questionType.HasBooleanAnswer;
        }
	    public int QuestionTypeId { get; set; }
		public string Description { get; set; }
        public bool HasTextAnswer { get; set; }
        public bool HasBooleanAnswer { get; set; }
    }
}
