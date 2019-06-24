using System;
using Comments.Models;
using Comments.ViewModels;
using System.Collections.Generic;
using System.Linq;
using Comments.Common;
using NICE.Feeds;
using Location = Comments.Models.Location;
using Question = Comments.ViewModels.Question;
using QuestionType = Comments.ViewModels.QuestionType;

namespace Comments.Services
{
	public interface IQuestionService
    {
        (ViewModels.Question question, Validate validate) GetQuestion(int questionId);
        (int rowsUpdated, Validate validate) EditQuestion(int questionId, ViewModels.Question question);
        (int rowsUpdated, Validate validate) DeleteQuestion(int questionId);
        (ViewModels.Question question, Validate validate) CreateQuestion(ViewModels.Question question);
	    QuestionAdmin GetQuestionAdmin(int consultationId, bool draft, string reference);

		IEnumerable<QuestionType> GetQuestionTypes();
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

	        question.LastModifiedByUserId = _currentUser.UserId.Value;
	        question.LastModifiedDate = DateTime.UtcNow;
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

	        var questionType = _context.GetQuestionTypes().SingleOrDefault(qt => qt.QuestionTypeId.Equals(question.QuestionTypeId));
			if (questionType == null)
				return (question: null, validate: new Validate(valid: false, unauthorised: false, message: "Question type not found"));

			var locationToSave = new Models.Location(question as ViewModels.Location);
            var questionToSave = new Models.Question(question.LocationId, question.QuestionText, question.QuestionTypeId, locationToSave, questionType, answer: null);

	        var consultationsUri = ConsultationsUri.ParseConsultationsUri(questionToSave.Location.SourceURI);
	        var locationQuestions = _context.GetQuestionsForURI(questionToSave.Location.SourceURI).ToList();

	        var orderConsultation = consultationsUri.ConsultationId.ToString("D3");
	        var orderDocument = !consultationsUri.DocumentId.HasValue ? "000" : consultationsUri.DocumentId.Value.ToString("D3");
	        var orderQuestion = locationQuestions.Count.Equals(0) ? "000": locationQuestions.Count.ToString("D3");

	        questionToSave.LastModifiedByUserId = _currentUser.UserId.Value;
	        questionToSave.LastModifiedDate = DateTime.UtcNow;
	        questionToSave.Location.Order = $"{orderConsultation}.{orderDocument}.{orderQuestion}";

	        _context.Location.Add(locationToSave);
            _context.Question.Add(questionToSave);
            _context.SaveChanges();

            return (question: new ViewModels.Question(locationToSave, questionToSave), validate: null);
        }

	    public QuestionAdmin GetQuestionAdmin(int consultationId, bool draft, string reference)
	    {

		    /*var consultation = _consultationService.GetConsultation(consultationId, BreadcrumbType.None, useFilters:false);*/

		    var consultationSourceURI = ConsultationsUri.CreateConsultationURI(consultationId);
		    var submissionQuestionSourceURI = ConsultationsUri.CreateSubmissionQuestionURI(consultationId);

			var locationsWithQuestions = _context.GetQuestionsForDocument(new List<string>{ consultationSourceURI }, partialMatchSourceURI: true).ToList();

			var allTheQuestions = new List<Question>();
		    foreach (var location in locationsWithQuestions)
		    {
			    allTheQuestions.AddRange(location.Question.Select(question => new Question(location, question)));
		    }

		    var documentsAndConsultationTitle = _consultationService.GetDocuments(consultationId, reference, draft);
		    var questionAdminDocuments = new List<QuestionAdminDocument>();
			foreach (var document in documentsAndConsultationTitle.documents)
			{
				var questionIdsForThisDocument = locationsWithQuestions.Where(l =>
					l.SourceURI.Contains(ConsultationsUri.CreateDocumentURI(consultationId, document.DocumentId),
						StringComparison.OrdinalIgnoreCase))
						.SelectMany(l => l.Question, (location, question) => question.QuestionId).ToList();

				var listOfQuestions = locationsWithQuestions.SelectMany(l => l.Question, (location, question) => new ViewModels.Question(location, question))
										.Where(q => questionIdsForThisDocument.Contains(q.QuestionId)).ToList();

				questionAdminDocuments.Add(
					new QuestionAdminDocument(document.DocumentId,
						//document.SupportsQuestions,
						document.Title,
						listOfQuestions
					)
				);
			}

		    var consultationQuestions = locationsWithQuestions
			    .Where(l => l.SourceURI.Equals(consultationSourceURI, StringComparison.OrdinalIgnoreCase))
			    .SelectMany(l => l.Question, (location, question) => new ViewModels.Question(location, question))
			    .ToList();

			var submissionQuestions = locationsWithQuestions
				.Where(l => l.SourceURI.Equals(submissionQuestionSourceURI, StringComparison.OrdinalIgnoreCase))
				.SelectMany(l => l.Question, (location, question) => new ViewModels.Question(location, question))
				.ToList();

			var questionTypes = GetQuestionTypes();

		    var previewState = draft ? PreviewState.Preview : PreviewState.NonPreview;
		    var documentId = draft ? Constants.DummyDocumentNumberForPreviewProject : (int?)null;
			var consultationState = _consultationService.GetConsultationState(consultationId, documentId, reference, previewState);

			return new QuestionAdmin(documentsAndConsultationTitle.consultationTitle, consultationQuestions, questionAdminDocuments, questionTypes, consultationState, submissionQuestions);
	    }

	    public IEnumerable<QuestionType> GetQuestionTypes()
	    {
		    return _context.GetQuestionTypes().Select(modelQuestionType => new ViewModels.QuestionType(modelQuestionType));
	    }
    }
}
