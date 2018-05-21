using System.Collections.Generic;
using System.Linq;
using Comments.Common;
using Newtonsoft.Json;
using NICE.Feeds.Models.Indev;
using NICE.Feeds.Models.Indev.Detail;

namespace Comments.ViewModels
{
    public class Document
    {
        [JsonConstructor]
        public Document(int consultationId, int documentId, bool supportsComments, string title, IEnumerable<Chapter> chapters)
        {
	        ConsultationId = consultationId;
			DocumentId = documentId;
            SupportsComments = supportsComments;
            Title = title;
            Chapters = chapters;
        }
        public Document(int consultationId, Resource<DetailCommentDocument> resource)
        {
	        ConsultationId = consultationId;
			DocumentId = resource.ConsultationDocumentId;
            SupportsComments = resource.IsConsultationCommentsDocument;

            if (resource.Document != null)
            {
                Title = resource.Document.Title;
                if (resource.Document.Chapters != null)
                {
                    Chapters = resource.Document.Chapters.Select(c => new Chapter(c));
                }
            }
            else
            {
                Title = resource.Title ?? resource.File.FileName;
            }

            Href = resource.File.Href;
        }

		public int ConsultationId { get; private set; }
        public int DocumentId { get; private set; }
        public bool SupportsComments { get; private set; }
        public string Title { get; private set; }
        public IEnumerable<Chapter> Chapters { get; private set; }
        public string Href { get; private set; }
	    public string SourceURI => this.SupportsComments ? ConsultationsUri.CreateDocumentURI(ConsultationId, DocumentId) : null;
    }
}
