using Comments.Models;
using Comments.ViewModels;
using System;
using System.Text.RegularExpressions;

namespace Comments.Common
{
    public static class ConsultationsUri
    {
        public const string Scheme = "consultations:";
        public const string ConsultationUriFormat = Scheme + "//./consultation/{0}";
		public const string DocumentUriFormat = ConsultationUriFormat + "/document/{1}";
        public const string ChapterUriFormat = DocumentUriFormat + "/chapter/{2}";
        public const string SubmissionUriFormat = ConsultationUriFormat + "/submission";

		public const string ConsultationsUriRegEx =
			@"^consultations:\/\/.+\/consultation\/(?<consultationId>\d+)(\/document\/)?(?<documentId>\d*)(\/chapter\/)?(?<chapterSlug>.*)$";
//                "^consultations:\\/\\/.+\\/consultation\\/(?<consultationId>\\d+)(\\/document\\/)?(?<documentId>\\d?)(\\/chapter\\/)?(?<chapterSlug>.*)$"
            
	    public const string ConsultationsDocumentPageRelativeUrlRegEx =
			@"^\/(?<consultationId>\d+)\/(?<documentId>\d+)\/(?<chapterSlug>.+)$";
            //"^\\/(?<consultationId>\\d+)\\/(?<documentId>\\d+)\\/(?<chapterSlug>.+)$";


		public const string ConsultationsReviewPageRelativeUrlRegEx =
			@"^\/(?<consultationId>\d+)\/review$";

		public static ConsultationsUriElements ParseConsultationsUri(string consultationsURI)
        {
            var regex = new Regex(ConsultationsUriRegEx);
            var groups = regex.Match(consultationsURI).Groups;

            return GetElementsFromRegExGroups(groups);
        }

	    public static bool IsReviewPageRelativeUrl(string relativeURL)
	    {
			var regex = new Regex(ConsultationsReviewPageRelativeUrlRegEx, RegexOptions.IgnoreCase);
		    return regex.IsMatch(relativeURL);
		}

	    public static bool IsValidSourceURI(string uri)
	    {
		    if (string.IsNullOrWhiteSpace(uri)) return false;
		    var regex = new Regex(string.Format(ConsultationUriFormat, ".+"));
		    return regex.IsMatch(uri);
	    }

        public static ConsultationsUriElements ParseRelativeUrl(string relativeURL)
        {
			var regexString = IsReviewPageRelativeUrl(relativeURL) ? ConsultationsReviewPageRelativeUrlRegEx : ConsultationsDocumentPageRelativeUrlRegEx;
			var regex =  new Regex(regexString, RegexOptions.IgnoreCase);
	        var groups = regex.Match(relativeURL).Groups;

            return GetElementsFromRegExGroups(groups);
        }

		/// <summary>
		/// This takes the relativeURL formats like "1/1/introduction" or "/1/review".
		/// </summary>
		/// <param name="relativeURL"></param>
		/// <param name="commentOn"></param>
		/// <returns></returns>
		public static string ConvertToConsultationsUri(string relativeURL, CommentOn commentOn)
        {
            ConsultationsUriElements uriElements;
            if (relativeURL.StartsWith(Scheme))
            {
                uriElements = ParseConsultationsUri(relativeURL);
            }
            else if (relativeURL.StartsWith("/"))
            {
                uriElements = ParseRelativeUrl(relativeURL);
            }
            else
            {
                throw new Exception("Unknown uri format");
            }

            if (commentOn == CommentOn.Consultation)
                return string.Format(ConsultationUriFormat, uriElements.ConsultationId);

            if (commentOn == CommentOn.Document)
                return string.Format(DocumentUriFormat, uriElements.ConsultationId, uriElements.DocumentId);

            return string.Format(ChapterUriFormat, uriElements.ConsultationId, uriElements.DocumentId,
                uriElements.ChapterSlug);
        }

        private static ConsultationsUriElements GetElementsFromRegExGroups(GroupCollection groups)
        {
            var consultationId = int.Parse(groups["consultationId"].Value);
            var documentIdText = groups["documentId"].Value;
            var documentId = string.IsNullOrWhiteSpace(documentIdText) ? (int?) null : int.Parse(documentIdText);

            var chapterSlug = groups["chapterSlug"].Value;
            if (string.IsNullOrWhiteSpace(chapterSlug))
                chapterSlug = null;

            return new ConsultationsUriElements(consultationId, documentId, chapterSlug);
        }

	    public static string CreateConsultationURI(int consultationId)
	    {
			return string.Format(ConsultationUriFormat, consultationId);
		}

	    public static string CreateDocumentURI(int consultationId, int documentId)
	    {
		    return string.Format(DocumentUriFormat, consultationId, documentId);
	    }

	    public static string CreateSubmissionQuestionURI(int consultationId)
	    {
		    return string.Format(SubmissionUriFormat, consultationId);
	    }
	}
}
