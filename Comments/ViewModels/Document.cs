﻿using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using NICE.Feeds.Models.Indev;

namespace Comments.ViewModels
{
    public class Document
    {
        [JsonConstructor]
        public Document(int documentId, bool supportsComments, string title, IEnumerable<Chapter> chapters)
        {
            DocumentId = documentId;
            SupportsComments = supportsComments;
            Title = title;
            Chapters = chapters;
        }
        public Document(Resource resource)
        {
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
        }

        public int DocumentId { get; private set; }
        public bool SupportsComments { get; private set; }
        public string Title { get; private set; }
        public IEnumerable<Chapter> Chapters { get; private set; }
    }
}