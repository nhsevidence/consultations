using System;
using Comments.Models;
using Comments.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Comments.Common;
using Comments.Configuration;
using Microsoft.AspNetCore.Http;
using NICE.Feeds;
using NICE.Identity.Authentication.Sdk.API;
using Constants = Comments.Common.Constants;
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
        Task<QuestionAdmin> GetQuestionAdmin(int consultationId, bool draft, string reference);

		IEnumerable<QuestionType> GetQuestionTypes();
    }
    public class QuestionService : IQuestionService
    {
        private readonly ConsultationsContext _context;
        private readonly IUserService _userService;
	    private readonly IConsultationService _consultationService;
	    private readonly IHttpContextAccessor _httpContextAccessor;
	    private readonly IAPIService _apiService;
	    private readonly User _currentUser;

        public QuestionService(ConsultationsContext consultationsContext, IUserService userService, IConsultationService consultationService,
	        IHttpContextAccessor httpContextAccessor, IAPIService apiService)
        {
            _context = consultationsContext;
            _userService = userService;
	        _consultationService = consultationService;
	        _httpContextAccessor = httpContextAccessor;
	        _apiService = apiService;
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
            if (!_currentUser.IsAuthenticated)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in editing question id:{questionId}"));

            var questionInDatabase = _context.GetQuestion(questionId);

            if (questionInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Question id:{questionId} not found trying to edit question for user id: {_currentUser.UserId} display name: {_currentUser.DisplayName}"));

	        question.LastModifiedByUserId = _currentUser.UserId;
	        question.LastModifiedDate = DateTime.UtcNow;
            questionInDatabase.UpdateFromViewModel(question);
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

        public (int rowsUpdated, Validate validate) DeleteQuestion(int questionId)
        {
            if (!_currentUser.IsAuthenticated)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in deleting question id:{questionId}"));

            var questionInDatabase = _context.GetQuestion(questionId);

            if (questionInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Question id:{questionId} not found trying to delete question"));

            questionInDatabase.IsDeleted = true;
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

        public (ViewModels.Question question, Validate validate) CreateQuestion(ViewModels.Question question)
        {
            if (!_currentUser.IsAuthenticated)
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

			questionToSave.CreatedByUserId = _currentUser.UserId;
			questionToSave.CreatedDate = DateTime.UtcNow;
			questionToSave.LastModifiedByUserId = _currentUser.UserId;
	        questionToSave.LastModifiedDate = DateTime.UtcNow;
	        questionToSave.Location.Order = $"{orderConsultation}.{orderDocument}.{orderQuestion}";

	        _context.Location.Add(locationToSave);
            _context.Question.Add(questionToSave);
            _context.SaveChanges();

            return (question: new ViewModels.Question(locationToSave, questionToSave), validate: null);
        }

	    public async Task<QuestionAdmin> GetQuestionAdmin(int consultationId, bool draft, string reference)
	    {
		    var consultationSourceURI = ConsultationsUri.CreateConsultationURI(consultationId);

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
						document.Title,
						listOfQuestions
					)
				);
			}

		    var consultationQuestions = locationsWithQuestions
			    .Where(l => l.SourceURI.Equals(consultationSourceURI, StringComparison.OrdinalIgnoreCase))
			    .SelectMany(l => l.Question, (location, question) => new ViewModels.Question(location, question))
			    .ToList();

		    var questionTypes = GetQuestionTypes();

		    var previewState = draft ? PreviewState.Preview : PreviewState.NonPreview;
		    var documentId = draft ? Constants.DummyDocumentNumberForPreviewProject : (int?)null;
			var consultationState = _consultationService.GetConsultationState(consultationId, documentId, reference, previewState);

			var previousQuestions = _context.GetAllPreviousUniqueQuestions();

			var previousQuestionsWithRoles = await GetRoles(previousQuestions);

			var currentUserRoles = _userService.GetUserRoles(); 

			return new QuestionAdmin(documentsAndConsultationTitle.consultationTitle, consultationQuestions,
				questionAdminDocuments, questionTypes, consultationState, previousQuestionsWithRoles, currentUserRoles);
	    }

	    private async Task<IEnumerable<QuestionWithRoles>> GetRoles(IEnumerable<Models.Question> previousQuestions)
		{
			var distinctUserIds =   previousQuestions.Select(question => question.CreatedByUserId)
							.Concat(previousQuestions.Select(question => question.LastModifiedByUserId))
							.Distinct();

			var usersWithRoles = await _apiService.FindRoles(distinctUserIds, _httpContextAccessor.HttpContext.Request.Host.Host); //send the distinctUserIds to nice accounts and get back all the groups.

			//accounts only returns the users that match. non-matching users are silently discarded from the result. 
			var questionWithRoles = new List<QuestionWithRoles>();
			foreach (var question in previousQuestions)
			{
				var createdByRoles = usersWithRoles != null && usersWithRoles.ContainsKey(question.CreatedByUserId) ? usersWithRoles[question.CreatedByUserId] : new List<string>();
				var lastModifiedByRoles = usersWithRoles != null && usersWithRoles.ContainsKey(question.LastModifiedByUserId) ? usersWithRoles[question.LastModifiedByUserId] : new List<string>();
				
				questionWithRoles.Add(new QuestionWithRoles(question.Location, question, createdByRoles, lastModifiedByRoles));
			}

			return questionWithRoles;
		}
		
	    public IEnumerable<QuestionType> GetQuestionTypes()
	    {
		    return _context.GetQuestionTypes().Select(modelQuestionType => new ViewModels.QuestionType(modelQuestionType));
	    }
    }
}
