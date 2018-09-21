using Comments.Common;
using Comments.Configuration;
using Comments.Models;
using Comments.ViewModels;
using Microsoft.Extensions.Logging;
using NICE.Feeds;
using NICE.Feeds.Models.Indev.Detail;
using NICE.Feeds.Models.Indev.List;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Comments.Services
{
	public interface IConsultationService
    {
        ChapterContent GetChapterContent(int consultationId, int documentId, string chapterSlug);
        IEnumerable<Document> GetDocuments(int consultationId);
	    IEnumerable<Document> GetPreviewDraftDocuments(int consultationId, int documentId, string reference);
	    IEnumerable<Document> GetPreviewPublishedDocuments(int consultationId, int documentId);
        ViewModels.Consultation GetConsultation(int consultationId, bool isReview);
	    ViewModels.Consultation GetDraftConsultation(int consultationId, int documentId, string reference, bool isReview);

		IEnumerable<ViewModels.Consultation> GetConsultations();

	    ChapterContent GetPreviewChapterContent(int consultationId, int documentId, string chapterSlug, string reference);
	    ConsultationState GetConsultationState(string sourceURI, PreviewState previewState, IEnumerable<Models.Location> locations = null, ConsultationBase consultation = null);
	    ConsultationState GetConsultationState(int consultationId, int? documentId, string chapterSlug, PreviewState previewState, IEnumerable<Models.Location> locations = null, ConsultationBase consultation = null);

		bool HasSubmittedCommentsOrQuestions(string consultationSourceURI, Guid userId);
	    IEnumerable<BreadcrumbLink> GetBreadcrumbs(ConsultationDetail consultation, bool isReview);

	    string GetFirstChapterSlug(int consultationId, int documentId);
    }

	public class ConsultationService : IConsultationService
    {
	    private readonly ConsultationsContext _context;
	    private readonly IFeedService _feedService;
        private readonly ILogger<ConsultationService> _logger;
        private readonly IUserService _userService;

		public ConsultationService(ConsultationsContext context, IFeedService feedService, ILogger<ConsultationService> logger, IUserService userService)
        {
	        _context = context;
	        _feedService = feedService;
            _logger = logger;
            _userService = userService;
		}

        public ChapterContent GetChapterContent(int consultationId, int documentId, string chapterSlug)
        {
            return new ViewModels.ChapterContent(
                _feedService.GetConsultationChapterForPublishedProject(consultationId, documentId, chapterSlug));
        }

	    public ChapterContent GetPreviewChapterContent(int consultationId, int documentId, string chapterSlug, string reference)
	    {
		    return new ViewModels.ChapterContent(
			    _feedService.GetIndevConsultationChapterForDraftProject(consultationId, documentId, chapterSlug, reference));
	    }

		public IEnumerable<Document> GetDocuments(int consultationId)
        {
            var consultationDetail = _feedService.GetIndevConsultationDetailForPublishedProject(consultationId, PreviewState.NonPreview);
            return consultationDetail.Resources.Select(r => new ViewModels.Document(consultationId, r)).ToList();
        }


	    public IEnumerable<Document> GetPreviewPublishedDocuments(int consultationId, int documentId)
	    {
		    var consultationDetail = _feedService.GetIndevConsultationDetailForPublishedProject(consultationId, PreviewState.Preview, documentId);
		    return consultationDetail.Resources.Select(r => new ViewModels.Document(consultationId, r)).ToList();
	    }

		public IEnumerable<Document> GetPreviewDraftDocuments(int consultationId, int documentId, string reference)
	    {
		    var consultationDetail = _feedService.GetIndevConsultationDetailForDraftProject(consultationId, documentId, reference);
		    return consultationDetail.Resources.Select(r => new ViewModels.Document(consultationId, r)).ToList();
	    }


        public ViewModels.Consultation GetConsultation(int consultationId, bool isReview)
        {
            var user = _userService.GetCurrentUser();
	        var consultationDetail = GetConsultationDetail(consultationId);
	        var consultationState = GetConsultationState(consultationId, null, null, PreviewState.NonPreview, null, consultationDetail);
	        var breadcrumbs = GetBreadcrumbs(consultationDetail, isReview);
	        var filters = isReview ? AppSettings.ReviewConfig.Filters : null;
            return new ViewModels.Consultation(consultationDetail, user, breadcrumbs, consultationState, filters);
        }

	    public ViewModels.Consultation GetDraftConsultation(int consultationId, int documentId, string reference, bool isReview)
	    {
		    var user = _userService.GetCurrentUser();
		    var draftConsultationDetail = GetDraftConsultationDetail(consultationId, documentId, reference);
		    var consultationState = GetConsultationState(consultationId, documentId, reference, PreviewState.Preview, null, draftConsultationDetail);
		    var filters = isReview ? AppSettings.ReviewConfig.Filters : null;
		    return new ViewModels.Consultation(draftConsultationDetail, user, null, consultationState, filters);
	    }

		public IEnumerable<BreadcrumbLink> GetBreadcrumbs(ConsultationDetail consultation, bool isReview)
	    {
			var breadcrumbs = new List<BreadcrumbLink>{
					new BreadcrumbLink("Home", ExternalRoutes.HomePage),
					new BreadcrumbLink(consultation.Title, ExternalRoutes.ConsultationUrl(consultation))
			};

		    if (isReview)
		    {
			    var firstDocument = GetDocuments(consultation.ConsultationId).FirstOrDefault(d => d.ConvertedDocument);
			    var firstChapter = firstDocument?.Chapters.FirstOrDefault();

			    if (firstChapter != null)
				    breadcrumbs.Add(new BreadcrumbLink("Consultation documents", $"/consultations/{consultation.ConsultationId}/{firstDocument.DocumentId}/{firstChapter.Slug}"));
		    }

		    return breadcrumbs;
	    }

	    public string GetFirstChapterSlug(int consultationId, int documentId)
	    {
		    return GetDocuments(consultationId).FirstOrDefault(d => d.DocumentId.Equals(documentId))?.Chapters.FirstOrDefault()?.Slug;
	    }

	    public IEnumerable<ViewModels.Consultation> GetConsultations()
        {
            var user = _userService.GetCurrentUser();
            var consultations = _feedService.GetConsultationList();
            return consultations.Select(c => new ViewModels.Consultation(c, user)).ToList();
        }

	    public ConsultationState GetConsultationState(string sourceURI, PreviewState previewState, IEnumerable<Models.Location> locations = null, ConsultationBase consultation = null)
	    {
		    var consultationsUriElements = ConsultationsUri.ParseConsultationsUri(sourceURI);
		    return GetConsultationState(consultationsUriElements.ConsultationId, consultationsUriElements.DocumentId, consultationsUriElements.ChapterSlug, previewState, locations, consultation);
	    }

	    public ConsultationState GetConsultationState(int consultationId, int? documentId, string reference, PreviewState previewState, IEnumerable<Models.Location> locations = null, ConsultationBase consultationDetail = null)
	    {
		    if (previewState == PreviewState.Preview)
		    {
			    if (documentId == null)
				    throw new ArgumentException(nameof(documentId));
				if (reference == null)
					throw new ArgumentException(nameof(reference));
			}

		    var sourceURI = ConsultationsUri.CreateConsultationURI(consultationId);
		    if (consultationDetail == null)
				if (previewState ==  PreviewState.NonPreview)
					consultationDetail = GetConsultationDetail(consultationId);
				else
					consultationDetail = GetDraftConsultationDetail(consultationId, (int)documentId, reference);

		    IEnumerable<Document> documents;
		    if (previewState == PreviewState.NonPreview)
			    documents = GetDocuments(consultationId).ToList();
			else
				documents = GetPreviewDraftDocuments(consultationId, (int)documentId, reference).ToList();

		    var documentsWhichSupportQuestions = documents.Where(d => d.SupportsQuestions).Select(d => d.DocumentId).ToList();
		    var documentsWhichSupportComments = documents.Where(d => d.SupportsComments).Select(d => d.DocumentId).ToList();

		    var currentUser = _userService.GetCurrentUser();

		    if (locations == null && currentUser.IsAuthorised && currentUser.UserId.HasValue)
		    {
			    locations = _context.GetAllCommentsAndQuestionsForDocument(new[] { sourceURI }, partialMatchSourceURI: true);
		    }
		    else
		    {
			    locations = new List<Models.Location>(0);
		    }

		    var hasSubmitted = currentUser != null && currentUser.IsAuthorised && currentUser.UserId.HasValue ? HasSubmittedCommentsOrQuestions(sourceURI, currentUser.UserId.Value) : false;

		    var data = ModelConverters.ConvertLocationsToCommentsAndQuestionsViewModels(locations);

		    var consultationState = new ConsultationState(consultationDetail.StartDate, consultationDetail.EndDate,
			    data.questions.Any(), data.questions.Any(q => q.Answers.Any()), data.comments.Any(), hasSubmitted,
			    false, false, documentsWhichSupportQuestions, documentsWhichSupportComments);

		    return consultationState;
	    }

		public bool HasSubmittedCommentsOrQuestions(string anySourceURI, Guid userId)
	    {
		    if (string.IsNullOrWhiteSpace(anySourceURI))
			    return false;

		    var consultationsUriElements = ConsultationsUri.ParseConsultationsUri(anySourceURI);

		    var consultationSourceURI = ConsultationsUri.CreateConsultationURI(consultationsUriElements.ConsultationId);

		    return _context.HasSubmitted(consultationSourceURI, userId);
	    }

	    /// <summary>
	    /// This is intentionally private as it gets the ConsultationDetail straight from the feed. not for external consumption outside of this class.
	    /// </summary>
	    /// <param name="consultationId"></param>
	    /// <returns></returns>
	    private ConsultationDetail GetConsultationDetail(int consultationId)
	    {
		    var consultationDetail = _feedService.GetIndevConsultationDetailForPublishedProject(consultationId, PreviewState.NonPreview);
		    return consultationDetail;
	    }

		/// <summary>
		/// This is intentionally private as it gets the ConsultationDetail straight from the feed. not for external consumption outside of this class.
		/// </summary>
		/// <param name="consultationId"></param>
		/// <param name="documentId"></param>
		/// <param name="reference"></param>
		/// <returns></returns>
		private ConsultationPublishedPreviewDetail GetDraftConsultationDetail(int consultationId, int documentId,  string reference)
	    {
		    var consultationDetail = _feedService.GetIndevConsultationDetailForDraftProject(consultationId, documentId, reference);
		    return consultationDetail;
	    }


	    //public ConsultationState GetDraftConsultationState(int consultationId, int documentId, string reference, IEnumerable<Models.Location> locations = null, ConsultationPublishedPreviewDetail consultationDetail = null)
	    //{
		   // var sourceURI = ConsultationsUri.CreateConsultationURI(consultationId);
		   // if (consultationDetail == null)
			  //  consultationDetail = GetDraftConsultationDetail(consultationId, documentId, reference);

		   // var documents = GetPreviewDraftDocuments(consultationId, documentId, reference).ToList();
		   // var documentsWhichSupportQuestions = documents.Where(d => d.SupportsQuestions).Select(d => d.DocumentId).ToList();
		   // var documentsWhichSupportComments = documents.Where(d => d.SupportsComments).Select(d => d.DocumentId).ToList();

		   // var currentUser = _userService.GetCurrentUser();

		   // if (locations == null && currentUser.IsAuthorised && currentUser.UserId.HasValue)
		   // {
			  //  locations = _context.GetAllCommentsAndQuestionsForDocument(new[] { sourceURI }, partialMatchSourceURI: true);
		   // }
		   // else
		   // {
			  //  locations = new List<Models.Location>(0);
		   // }

		   // var hasSubmitted = currentUser != null && currentUser.IsAuthorised && currentUser.UserId.HasValue ? HasSubmittedCommentsOrQuestions(sourceURI, currentUser.UserId.Value) : false;

		   // var data = ModelConverters.ConvertLocationsToCommentsAndQuestionsViewModels(locations);

		   // var consultationState = new ConsultationState(consultationDetail.StartDate, consultationDetail.EndDate,
			  //  data.questions.Any(), data.questions.Any(q => q.Answers.Any()), data.comments.Any(), hasSubmitted,
			  //  false, false, documentsWhichSupportQuestions, documentsWhichSupportComments);

		   // return consultationState;
	    //}
	}
}
