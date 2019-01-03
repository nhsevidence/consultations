using System.Linq;
using Comments.Common;
using Comments.Services;
using GraphQL.Types;

namespace Comments.Models
{
	public class ConsultationsGraphQLQuery : ObjectGraphType
	{
		public ConsultationsGraphQLQuery(ConsultationsContext consultationsContext, IConsultationService consultationService)
		{
			Name = "ConsultationsQuery";

			Field<GraphQLQuestionType>(
				"question",
				arguments: new QueryArguments(new QueryArgument<IntGraphType> { Name = "id" }),
				resolve: context =>  consultationsContext.GetQuestion(context.GetArgument<int>("id"))
				);

			Field<ListGraphType<GraphQLQuestionType>>(
				"questions",
				arguments: new QueryArguments(
					new QueryArgument<GraphQLQuestionFilterType> { Name = "filter" },
					new QueryArgument<IntGraphType> { Name = "consultationId", DefaultValue = -1},
					new QueryArgument<IntGraphType> { Name = "documentId", DefaultValue = -1}),
				resolve: context =>
				{
					var filter = context.GetArgument<Extensions.QuestionFilter>("filter");
					var consultationId = context.GetArgument<int>("consultationId");
					var documentId = context.GetArgument<int>("documentId");

					return consultationsContext.GetQuestions(filter, consultationId, documentId);
				});

			Field<GraphQLConsultationType>(
				"consultation",
				arguments: new QueryArguments(
					new QueryArgument<IntGraphType> { Name = "id" },
					new QueryArgument<BooleanGraphType> { Name = "isReview" }),
				resolve: context =>  consultationService.GetConsultation(
					context.GetArgument<int>("id"),
					context.GetArgument<bool>("isReview")));

			Field<ListGraphType<GraphQLConsultationType>>(
				"consultations",
				resolve: context =>  consultationService.GetConsultations());

			Field<GraphQLDocumentType>(
				"document",
				arguments: new QueryArguments(new QueryArgument<NonNullGraphType<IntGraphType>> { Name = "consultationId"},
					new QueryArgument<NonNullGraphType<IntGraphType>> { Name = "documentId"}),
				resolve: context =>  consultationService
					.GetDocuments(context.GetArgument<int>("consultationId"))
					.First(d => d.DocumentId == context.GetArgument<int>("documentId")));

			Field<ListGraphType<GraphQLDocumentType>>(
				"documents",
				arguments: new QueryArguments(new QueryArgument<NonNullGraphType<IntGraphType>> { Name = "consultationId"}),
				resolve: context =>  consultationService.GetDocuments(context.GetArgument<int>("consultationId")));
		}
	}
}
