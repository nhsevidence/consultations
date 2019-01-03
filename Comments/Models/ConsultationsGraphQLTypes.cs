using System;
using System.Linq;
using Comments.Common;
using Comments.Services;
using Comments.ViewModels;
using GraphQL;
using GraphQL.Types;

namespace Comments.Models
{
	public class GraphQLQuestionType : ObjectGraphType<Comments.Models.Question>
	{
		public GraphQLQuestionType()
		{
			Name = "ConsultationsQuestion";
			Field(q => q.QuestionId).Description("Question Id");
			Field(q => q.QuestionText).Description("Question Text");
			Field(q => q.CreatedDate).Description("Creation Date");
			Field("LastModifiedByUserId",x => x.LastModifiedByUserId.ToString()).Description("User ID that last modified it");
			Field(q => q.LastModifiedDate).Description("Date of last modification");
			Field("QuestionType",x => x.QuestionType.Description).Description("Type of question");
			Field("Answers",x => x.Answer.First().AnswerId).Description("List of answers to the question");
			Field(q => q.Location.Order).Description("Location order");
			Field(q => q.Location.LocationId).Description("Location Id");
			Field(q => q.IsDeleted).Description("Is deleted status");
			Field(q => q.Location.SourceURI).Description("Is deleted status");
		}
	}
	public class GraphQLConsultationType : ObjectGraphType<ViewModels.Consultation>
	{
		public GraphQLConsultationType()
		{
			Name = "Consultation";
			Field(c => c.Title).Description("Consultation Title");
			Field(c => c.ConsultationId).Description("Consultation ID");
			Field(c => c.ConsultationName).Description("Consultation Name");
			Field(c => c.StartDate).Description("Start Date");
			Field(c => c.EndDate).Description("End Date");
			Field(c => c.ConsultationType).Description("Consultation Type");
			Field(c => c.ProjectType).Description("Project Type");
			Field(c => c.ProductTypeName).Description("Product Type");
			Field(c => c.DevelopedAs).Description("Developed As");
			Field(c => c.RelevantTo).Description("Relevant To");
			Field(c => c.HasDocumentsWhichAllowConsultationComments).Description("Has Documents Which Allow Consultation Comments");
			Field(c => c.HasDocumentsWhichAllowConsultationQuestions).Description("Has Documents Which Allow Consultation Questions");
			Field(c => c.SupportsQuestions).Description("Supports Questions");
			Field(c => c.SupportsComments).Description("Supports Comments");
		}
	}

	public class GraphQLDocumentType: ObjectGraphType<ViewModels.Document>
	{
		public GraphQLDocumentType()
		{
			Name = "Document";
			Field(d => d.DocumentId);
			Field(d => d.ConvertedDocument);
			Field(d => d.SupportsComments);
			Field(d => d.SupportsQuestions);
			Field(d => d.Title);
			//Field(d => d.Chapters.Select(c => c.Title).ToList());
			Field(d => d.Href);
			Field(d => d.SourceURI);
		}
	}
	public class GraphQLQuestionFilterType : EnumerationGraphType
	{
		public GraphQLQuestionFilterType()
		{
			Name = "QuestionFilter";
			Description = "Question Filter By Deletion Status";
			AddValue("All", "All questions", Extensions.QuestionFilter.All);
			AddValue("Deleted", "Deleted Questions", Extensions.QuestionFilter.Deleted);
			AddValue("NotDeleted", "Not Deleted Questions", Extensions.QuestionFilter.NotDeleted);
		}
	}
}

