using System;
using Comments.Models;
using Comments.ViewModels;
using System.Collections.Generic;
using System.Linq;
using Comments.Common;
using Location = Comments.Models.Location;
using Question = Comments.ViewModels.Question;

namespace Comments.Services
{
	public interface IQuestionService
    {
        (ViewModels.Question question, Validate validate) GetQuestion(int questionId);
        (int rowsUpdated, Validate validate) EditQuestion(int questionId, ViewModels.Question question);
        (int rowsUpdated, Validate validate) DeleteQuestion(int questionId);
        (ViewModels.Question question, Validate validate) CreateQuestion(ViewModels.Question question);
	    QuestionAdmin GetQuestionAdmin(int consultationId);
    }
    public class QuestionService : IQuestionService
    {
        private readonly ConsultationsContext _context;
        private readonly IUserService _userService;
	    private readonly IConsultationService _consultationService;
	    private readonly User _currentUser;

        public QuestionService(ConsultationsContext consultationsContext, IUserService userService, IConsultationService consultationService)
        {
            _context = consultationsContext;
            _userService = userService;
	        _consultationService = consultationService;
	        _currentUser = _userService.GetCurrentUser();
        }

        public (ViewModels.Question question, Validate validate) GetQuestion(int questionId)
        {
            var questionInDatabase = _context.GetQuestion(questionId);

            if (questionInDatabase == null)
                return (question: null, validate: new Validate(valid: false, notFound: true, message: $"Question id:{questionId} not found trying to get question"));

            return (question: (questionInDatabase == null) ? null : new ViewModels.Question(questionInDatabase.Location, questionInDatabase), validate: null);
        }

        public (int rowsUpdated, Validate validate) EditQuestion(int questionId, ViewModels.Question question)
        {
            if (!_currentUser.IsAuthorised)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in editing question id:{questionId}"));

            var questionInDatabase = _context.GetQuestion(questionId);

            if (questionInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Question id:{questionId} not found trying to edit question for user id: {_currentUser.UserId} display name: {_currentUser.DisplayName}"));

            questionInDatabase.UpdateFromViewModel(question);
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

        public (int rowsUpdated, Validate validate) DeleteQuestion(int questionId)
        {
            if (!_currentUser.IsAuthorised)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in deleting question id:{questionId}"));

            var questionInDatabase = _context.GetQuestion(questionId);

            if (questionInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Question id:{questionId} not found trying to delete question"));
            
            questionInDatabase.IsDeleted = true;
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

        public (ViewModels.Question question, Validate validate) CreateQuestion(ViewModels.Question question) 
        {
            if (!_currentUser.IsAuthorised)
                return (question: null, validate: new Validate(valid: false, unauthorised: true, message: "Not logged in creating question"));

            var locationToSave = new Models.Location(question as ViewModels.Location);
            _context.Location.Add(locationToSave);

            var questionTypeToSave = new Models.QuestionType(question.QuestionType.Description, question.QuestionType.HasTextAnswer, question.QuestionType.HasBooleanAnswer, null);
            var questionToSave = new Models.Question(question.LocationId, question.QuestionText, question.QuestionTypeId, locationToSave, questionTypeToSave, null);

            _context.Question.Add(questionToSave);
            _context.SaveChanges();
            
            return (question: new ViewModels.Question(locationToSave, questionToSave), validate: null);
        }

	    public QuestionAdmin GetQuestionAdmin(int consultationId)
	    {

		    var consultation = _consultationService.GetConsultation(consultationId, BreadcrumbType.None, useFilters:false);

		    var locationsWithQuestions = _context.GetQuestionsForDocument(new List<string>{ConsultationsUri.CreateConsultationURI(consultationId)}, partialMatchSourceURI: true).ToList();

			var allTheQuestions = new List<Question>();
		    foreach (var location in locationsWithQuestions)
		    {
			    allTheQuestions.AddRange(location.Question.Select(question => new Question(location, question)));
		    }

		    var documents = _consultationService.GetDocuments(consultationId);
		    var questionAdminDocuments = new List<QuestionAdminDocument>();

			foreach (var document in documents)
			{
				var questionIdsForThisDocument = locationsWithQuestions.Where(l =>
					l.SourceURI.Contains(ConsultationsUri.CreateDocumentURI(consultationId, document.DocumentId),
						StringComparison.OrdinalIgnoreCase))
						.SelectMany(l => l.Question, (location, question) => question.QuestionId).ToList();
				
				var listOfQuestions = locationsWithQuestions.SelectMany(l => l.Question, (location, question) => question)
										.Where(q => questionIdsForThisDocument.Contains(q.QuestionId)).ToList();

				questionAdminDocuments.Add(
					new QuestionAdminDocument(document.DocumentId,
						document.SupportsQuestions,
						document.Title,
						null //need to convert listOfQuestions to view model
					)
				);
			}
			

			//new QuestionAdminDocument(  doc.DocumentId,
			//							doc.SupportsQuestions,
			//							doc.Title,
			//							allTheQuestions.Where(q =>

			//								locations.Where(l => l.SourceURI.Contains(ConsultationsUri.CreateDocumentURI(consultationId, doc.DocumentId), StringComparison.OrdinalIgnoreCase)))

			//								q.QuestionId 
			//								q. 

			//								.Select(l => new Question(l, l.Question))

			//   var sourceURIs = new List<string>();
			//   var partialMatch = false;
			//   if (documentId.HasValue)
			//   {
			//    partialMatch = true;
			//    sourceURIs.Add(ConsultationsUri.CreateDocumentURI(consultationId, documentId.Value));
			//   }
			//   else
			//   {
			//	sourceURIs.Add(ConsultationsUri.CreateConsultationURI(consultationId));
			//}
			//   var locations = _context.GetQuestionsForDocument(sourceURIs, partialMatch);
			//   var questionViewModels = new List<ViewModels.Question>();

			//   foreach (var location in locations)
			//   {
			//    foreach (var question in location.Question)
			//    {
			//		questionViewModels.Add(new Question(location, question));
			//	}
			//   }
			return new QuestionAdmin(consultation.Title, null, null);
	    }
    }
}
