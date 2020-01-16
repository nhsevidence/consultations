using Comments.Common;
using Comments.Configuration;
using Comments.Models;
using Comments.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NICE.Feeds;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Comments.Services
{
	public interface ICommentService
    {
	    CommentsAndQuestions GetCommentsAndQuestions(string relativeURL, IUrlHelper urlHelper);
	    ReviewPageViewModel GetCommentsAndQuestionsForReview(string relativeURL, IUrlHelper urlHelper, ReviewPageViewModel model);
		(ViewModels.Comment comment, Validate validate) GetComment(int commentId);
        (int rowsUpdated, Validate validate) EditComment(int commentId, ViewModels.Comment comment);
        (ViewModels.Comment comment, Validate validate) CreateComment(ViewModels.Comment comment);
        (int rowsUpdated, Validate validate) DeleteComment(int commentId);
	}

    public class CommentService : ICommentService
    {
        private readonly ConsultationsContext _context;
        private readonly IUserService _userService;
	    private readonly IConsultationService _consultationService;
	    private readonly IHttpContextAccessor _httpContextAccessor;
	    private readonly User _currentUser;

        public CommentService(ConsultationsContext context, IUserService userService, IConsultationService consultationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _userService = userService;
	        _consultationService = consultationService;
	        _httpContextAccessor = httpContextAccessor;
	        _currentUser = _userService.GetCurrentUser();
        }

	    public (ViewModels.Comment comment, Validate validate) GetComment(int commentId)
        {
            if (!_currentUser.IsAuthenticated)
                return (comment: null, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in accessing comment id:{commentId}"));

            var commentInDatabase = _context.GetComment(commentId);

            if (commentInDatabase == null)
                return (comment: null, validate: new Validate(valid: false, notFound: true, message: $"Comment id:{commentId} not found trying to get comment for user id: {_currentUser.UserId} display name: {_currentUser.DisplayName}"));

            if (!commentInDatabase.CreatedByUserId.Equals(_currentUser.UserId, StringComparison.OrdinalIgnoreCase))
                return (comment: null, validate: new Validate(valid: false, unauthorised: true, message: $"User id: {_currentUser.UserId} display name: {_currentUser.DisplayName} tried to access comment id: {commentId}, but it's not their comment"));

            return (comment: new ViewModels.Comment(commentInDatabase.Location, commentInDatabase), validate: null); 
        }

        public (int rowsUpdated, Validate validate) EditComment(int commentId, ViewModels.Comment comment)
        {
            if (!_currentUser.IsAuthenticated)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in editing comment id:{commentId}"));

            var commentInDatabase = _context.GetComment(commentId);

            if (commentInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Comment id:{commentId} not found trying to edit comment for user id: {_currentUser.UserId} display name: {_currentUser.DisplayName}"));

            if (!commentInDatabase.CreatedByUserId.Equals(_currentUser.UserId, StringComparison.OrdinalIgnoreCase))
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"User id: {_currentUser.UserId} display name: {_currentUser.DisplayName} tried to edit comment id: {commentId}, but it's not their comment"));

            comment.LastModifiedByUserId = _currentUser.UserId;
            comment.LastModifiedDate = DateTime.UtcNow;
            commentInDatabase.UpdateFromViewModel(comment);
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

        public (ViewModels.Comment comment, Validate validate) CreateComment(ViewModels.Comment comment)
        {
            if (!_currentUser.IsAuthenticated)
                return (comment: null, validate: new Validate(valid: false, unauthorised: true, message: "Not logged in creating comment"));


			var sourceURI = ConsultationsUri.ConvertToConsultationsUri(comment.SourceURI, CommentOnHelpers.GetCommentOn(comment.CommentOn));
	        comment.Order = UpdateOrderWithSourceURI(comment.Order, sourceURI);
	        var locationToSave = new Models.Location(comment as ViewModels.Location)
	        {
		        SourceURI = sourceURI
	        };
			_context.Location.Add(locationToSave);

	        var status = _context.GetStatus(StatusName.Draft);
			var commentToSave = new Models.Comment(comment.LocationId, _currentUser.UserId, comment.CommentText, _currentUser.UserId, locationToSave, status.StatusId, null);
            _context.Comment.Add(commentToSave);
            _context.SaveChanges();

            return (comment: new ViewModels.Comment(locationToSave, commentToSave), validate: null);
        }

        public (int rowsUpdated, Validate validate) DeleteComment(int commentId)
        {
            if (!_currentUser.IsAuthenticated)
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"Not logged in deleting comment id:{commentId}"));

            var commentInDatabase = _context.GetComment(commentId);

            if (commentInDatabase == null)
                return (rowsUpdated: 0, validate: new Validate(valid: false, notFound: true, message: $"Comment id:{commentId} not found trying to delete comment for user id: {_currentUser.UserId} display name: {_currentUser.DisplayName}"));

            if (!commentInDatabase.CreatedByUserId.Equals(_currentUser.UserId))
                return (rowsUpdated: 0, validate: new Validate(valid: false, unauthorised: true, message: $"User id: {_currentUser.UserId} display name: {_currentUser.DisplayName} tried to delete comment id: {commentId}, but it's not their comment"));

            commentInDatabase.IsDeleted = true;
            commentInDatabase.LastModifiedDate = DateTime.UtcNow;
            commentInDatabase.LastModifiedByUserId = _currentUser.UserId;
            return (rowsUpdated: _context.SaveChanges(), validate: null);
        }

	    public CommentsAndQuestions GetCommentsAndQuestions(string relativeURL, IUrlHelper urlHelper)
	    {
		    var user = _userService.GetCurrentUser();

			var signInURL = urlHelper.Action(Constants.Auth.LoginAction, Constants.Auth.ControllerName, new {returnUrl = relativeURL.ToConsultationsRelativeUrl() });

			var isReview = ConsultationsUri.IsReviewPageRelativeUrl(relativeURL);
			var consultationSourceURI = ConsultationsUri.ConvertToConsultationsUri(relativeURL, CommentOn.Consultation);
		    ConsultationState consultationState;
		    var sourceURIs = new List<string> { consultationSourceURI };
		    if (!isReview)
		    {
			    sourceURIs.Add(ConsultationsUri.ConvertToConsultationsUri(relativeURL, CommentOn.Document));
			    sourceURIs.Add(ConsultationsUri.ConvertToConsultationsUri(relativeURL, CommentOn.Chapter));
		    }

			if (!user.IsAuthenticated)
		    {
			    consultationState = _consultationService.GetConsultationState(consultationSourceURI, PreviewState.NonPreview);
			    var locationsQuestionsOnly = _context.GetQuestionsForDocument(sourceURIs, isReview);
			    var questions = ModelConverters.ConvertLocationsToCommentsAndQuestionsViewModels(locationsQuestionsOnly).questions.ToList();
				return new CommentsAndQuestions(new List<ViewModels.Comment>(), questions,
				    user.IsAuthenticated, signInURL, consultationState);
		    }

			var locations = _context.GetAllCommentsAndQuestionsForDocument(sourceURIs, isReview).ToList();
		    consultationState = _consultationService.GetConsultationState(consultationSourceURI, PreviewState.NonPreview, locations);

			var data = ModelConverters.ConvertLocationsToCommentsAndQuestionsViewModels(locations);
		    var resortedComments = data.comments.OrderByDescending(c => c.LastModifiedDate).ToList(); //comments should be sorted in date by default, questions by document order.
			
			return new CommentsAndQuestions(resortedComments, data.questions.ToList(), user.IsAuthenticated, signInURL, consultationState);
	    }

		public ReviewPageViewModel GetCommentsAndQuestionsForReview(string relativeURL, IUrlHelper urlHelper, ReviewPageViewModel model)
		{
			var commentsAndQuestions = GetCommentsAndQuestions(relativeURL, urlHelper);

			if (model.Sort == ReviewSortOrder.DocumentAsc)
			{
				commentsAndQuestions.Comments = commentsAndQuestions.Comments.OrderBy(c => c.Order).ToList();
			}

			model.CommentsAndQuestions = FilterCommentsAndQuestions(commentsAndQuestions, model.Type, model.Document);
			model.OrganisationName = _currentUser.OrganisationName;

			var consultationId = ConsultationsUri.ParseRelativeUrl(relativeURL).ConsultationId;
			model.Filters = GetFilterGroups(consultationId, commentsAndQuestions, model.Type, model.Document);
			return model;
		}

		/// <summary>
		/// Filtering is just setting a Show property on the comments and questions to false.
		/// </summary>
		/// <param name="commentsAndQuestions"></param>
		/// <param name="questionsOrComments"></param>
		/// <param name="documentIdsToFilter"></param>
		/// <returns></returns>
		public CommentsAndQuestions FilterCommentsAndQuestions(CommentsAndQuestions commentsAndQuestions, IEnumerable<QuestionsOrComments> type, IEnumerable<int> documentIdsToFilter)
		{
			var types = type?.ToList() ?? new List<QuestionsOrComments>(0);
		    commentsAndQuestions.Questions.ForEach(q => q.Show = !types.Any() ||  types.Contains(QuestionsOrComments.Questions));
			commentsAndQuestions.Comments.ForEach(q => q.Show = !types.Any() || types.Contains(QuestionsOrComments.Comments));

			var documentIds = documentIdsToFilter?.ToList() ?? new List<int>(0);
			if (documentIds.Any())
		    {
			    commentsAndQuestions.Questions.ForEach(q => q.Show = (!q.Show || !q.DocumentId.HasValue) ? false : documentIds.Contains(q.DocumentId.Value));
			    commentsAndQuestions.Comments.ForEach(c => c.Show = (!c.Show || !c.DocumentId.HasValue) ? false : documentIds.Contains(c.DocumentId.Value));
			}
		    return commentsAndQuestions;
	    }

	    private IEnumerable<OptionFilterGroup> GetFilterGroups(int consultationId, CommentsAndQuestions commentsAndQuestions, IEnumerable<QuestionsOrComments> type, IEnumerable<int> documentIdsToFilter)
	    {
		    var filters = AppSettings.ReviewConfig.Filters.ToList();

		    var questionsAndCommentsFilter = filters.Single(f => f.Id.Equals("Type", StringComparison.OrdinalIgnoreCase));
			var questionOption = questionsAndCommentsFilter.Options.Single(o => o.Id.Equals("Questions", StringComparison.OrdinalIgnoreCase));
		    var commentsOption = questionsAndCommentsFilter.Options.Single(o => o.Id.Equals("Comments", StringComparison.OrdinalIgnoreCase));
			
		    var documentsFilter = filters.Single(f => f.Id.Equals("Document", StringComparison.OrdinalIgnoreCase));

			//questions
		    questionOption.IsSelected = type != null && type.Contains(QuestionsOrComments.Questions);
		    questionOption.FilteredResultCount = commentsAndQuestions.Questions.Count(q => q.Show); 
			questionOption.UnfilteredResultCount = commentsAndQuestions.Questions.Count();

			//comments
			commentsOption.IsSelected = type != null && type.Contains(QuestionsOrComments.Comments);
			commentsOption.FilteredResultCount = commentsAndQuestions.Comments.Count(q => q.Show); 
			commentsOption.UnfilteredResultCount = commentsAndQuestions.Comments.Count(); 

			//populate documents
			var documents = _consultationService.GetDocuments(consultationId).documents.Where(d => d.ConvertedDocument).ToList();
		    documentsFilter.Options = new List<FilterOption>(documents.Count());

			foreach (var document in documents)
			{
				var isSelected = documentIdsToFilter != null && documentIdsToFilter.Contains(document.DocumentId);
				documentsFilter.Options.Add(
					new FilterOption(document.DocumentId.ToString(), document.Title, isSelected)
					{
						FilteredResultCount = commentsAndQuestions.Comments.Count(c => c.Show && c.DocumentId.HasValue && c.DocumentId.Equals(document.DocumentId)) +
						                      commentsAndQuestions.Questions.Count(q => q.Show && q.DocumentId.HasValue && q.DocumentId.Equals(document.DocumentId)),

						UnfilteredResultCount = commentsAndQuestions.Comments.Count(c => c.DocumentId.HasValue && c.DocumentId.Equals(document.DocumentId)) +
						                        commentsAndQuestions.Questions.Count(q => q.DocumentId.HasValue && q.DocumentId.Equals(document.DocumentId))
					}
				);
		    }
			return filters;
	    }

	    public const string OrderFormat = "{0}.{1}.{2}.{3}";
	    public string UpdateOrderWithSourceURI(string orderWithinChapter, string sourceURI)
	    {
		    var consultationsUriElements = ConsultationsUri.ParseConsultationsUri(sourceURI);

			var consultationId = consultationsUriElements.ConsultationId;
			var documentId = consultationsUriElements.DocumentId;
		    int? chapterIndex = null;
		    
			if (consultationsUriElements.IsChapterLevel())
			{
				var document = _consultationService.GetDocuments(consultationsUriElements.ConsultationId).documents.FirstOrDefault(d => d.DocumentId.Equals(documentId));
				var chapterSelected = document?.Chapters.FirstOrDefault(c => c.Slug.Equals(consultationsUriElements.ChapterSlug, StringComparison.OrdinalIgnoreCase));
				if (chapterSelected != null)
				{
					chapterIndex = document.Chapters.Select((chapter, index) => new {chapter, index}).FirstOrDefault(c => c.chapter.Slug.Equals(chapterSelected.Slug, StringComparison.OrdinalIgnoreCase))?.index;
				}
			}
			
		    return string.Format(OrderFormat, consultationId, documentId ?? 0, chapterIndex ?? 0, orderWithinChapter);
	    }
	}
}
