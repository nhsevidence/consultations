using Comments.Services;
using Comments.ViewModels;
using System;
using System.Collections.Generic;
using NICE.Feeds;
using NICE.Feeds.Models.Indev.Detail;
using NICE.Feeds.Models.Indev.List;
using Location = Comments.Models.Location;

namespace Comments.Test.Infrastructure
{
	public class FakeConsultationService : IConsultationService
    {
	    private readonly bool _consultationIsOpen;
	    public FakeConsultationService(bool consultationIsOpen = true)
	    {
		    _consultationIsOpen = consultationIsOpen;
	    }

	    public bool ConsultationIsOpen(string sourceURI)
	    {
		    return _consultationIsOpen;
	    }

	    public bool HasSubmittedCommentsOrQuestions(string consultationSourceURI, Guid userId)
	    {
		    return false;
	    }


	    public ChapterContent GetPreviewChapterContent(int consultationId, int documentId, string chapterSlug, string reference)
	    {
		    throw new NotImplementedException();
	    }

	    public ConsultationState GetConsultationState(string sourceURI, PreviewState previewState, IEnumerable<Location> locations = null,
		    ConsultationBase consultation = null)
	    {
			return new ConsultationState(DateTime.MinValue, _consultationIsOpen ? DateTime.MaxValue : DateTime.MinValue, true, true, true, false, true, null, null);
		}
	    public ConsultationState GetConsultationState(int consultationId, int? documentId, string reference, PreviewState previewState, IEnumerable<Location> locations = null,
		    ConsultationBase consultation = null)
	    {
		    return new ConsultationState(DateTime.MinValue, _consultationIsOpen ? DateTime.MaxValue : DateTime.MinValue, true, true, true, false, true, null, null);
	    }

	    public (int? documentId, string chapterSlug) GetFirstConvertedDocumentAndChapterSlug(int consultationId)
	    {
		    return (documentId: 1, chapterSlug: "my-chapter-slug");
	    }

		#region Not Implemented Members
		public IEnumerable<BreadcrumbLink> GetBreadcrumbs(ConsultationDetail consultation, bool isReview)
	    {
		    throw new NotImplementedException();
	    }

	    public string GetFirstChapterSlug(int consultationId, int documentId)
	    {
		    throw new NotImplementedException();
	    }

	    public string GetFirstChapterSlugFromPreviewDocument(string reference, int consultationId, int documentId)
	    {
		    throw new NotImplementedException();
	    }

	    public (int rowsUpdated, Validate validate) SubmitCommentsAndAnswers(ViewModels.Submission submission)
		{
			throw new NotImplementedException();
		}

		public ChapterContent GetChapterContent(int consultationId, int documentId, string chapterSlug)
	    {
		    throw new NotImplementedException();
	    }

	    public IEnumerable<Document> GetDocuments(int consultationId)
	    {
		    return new List<Document>()
		    {
			    new Document(1, 1, true, "doc 1", new List<Chapter>()
			    {
				    new Chapter("chapter-slug", "title"),
				    new Chapter("chapter-slug2", "title2")
				}, true, true)
		    };
	    }

	    public IEnumerable<Document> GetPreviewDraftDocuments(int consultationId, int documentId, string reference)
	    {
		    throw new NotImplementedException();
	    }

	    public IEnumerable<Document> GetPreviewPublishedDocuments(int consultationId, int documentId)
	    {
		    throw new NotImplementedException();
	    }

	    public Consultation GetConsultation(int consultationId, bool isReview)
	    {
			var userService = FakeUserService.Get(true, "Benjamin Button", Guid.NewGuid());
			var consultationBase = new ConsultationBase()
		    {
			    ConsultationId = 1,
			    ConsultationName = "ConsultationName"
		    };

		    return new Consultation(consultationBase, userService.GetCurrentUser());
	    }

	    public Consultation GetDraftConsultation(int consultationId, int documentId, string reference, bool isReview)
	    {
		    throw new NotImplementedException();
	    }

		public IEnumerable<Consultation> GetConsultations()
	    {
		    throw new NotImplementedException();
	    }

	    #endregion Not Implemented Members
	}
}
