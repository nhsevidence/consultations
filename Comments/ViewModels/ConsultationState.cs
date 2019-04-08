using System;
using System.Collections.Generic;
using System.Linq;

namespace Comments.ViewModels
{
	public class ConsultationState
	{
		public ConsultationState(bool externalResource, DateTime startDate, DateTime endDate, bool hasQuestions, bool hasUserSuppliedAnswers, bool hasUserSuppliedComments,
			bool userHasSubmitted, IEnumerable<int> documentIdsWhichSupportComments)
		{
			ExternalResource = externalResource;
			StartDate = startDate;
			EndDate = endDate;
			HasQuestions = hasQuestions;
			HasUserSuppliedAnswers = hasUserSuppliedAnswers;
			HasUserSuppliedComments = hasUserSuppliedComments;
			UserHasSubmitted = userHasSubmitted;
			//ConsultationSupportsQuestions = consultationSupportsQuestions;
			//_documentIdsWhichSupportQuestions = documentIdsWhichSupportQuestions;
			_documentIdsWhichSupportComments = documentIdsWhichSupportComments;
		}

		/// <summary>
		/// This overload is currently only used when commenting on other things (besides consultations).
		/// </summary>
		/// <param name="externalResource"></param>
		/// <param name="hasQuestions"></param>
		/// <param name="hasUserSuppliedAnswers"></param>
		/// <param name="hasUserSuppliedComments"></param>
		/// <param name="userHasSubmitted"></param>
		public ConsultationState(bool externalResource, bool hasQuestions, bool hasUserSuppliedAnswers, bool hasUserSuppliedComments, bool userHasSubmitted)
		{
			ExternalResource = externalResource;
			HasQuestions = hasQuestions;
			HasUserSuppliedAnswers = hasUserSuppliedAnswers;
			HasUserSuppliedComments = hasUserSuppliedComments;
			UserHasSubmitted = userHasSubmitted;

			StartDate = DateTime.MinValue;
			EndDate = DateTime.MaxValue;
		}

		public bool ExternalResource { get; private set; }

		public DateTime StartDate { get; private set; }
		public DateTime EndDate { get; private set; }

		public bool HasQuestions { get; private set; }
		public bool HasUserSuppliedAnswers { get; private set; }
		public bool HasUserSuppliedComments { get; private set; }
		public bool UserHasSubmitted { get; private set; }

		//public bool ConsultationSupportsQuestions { get; private set; }

		//private readonly IEnumerable<int> _documentIdsWhichSupportQuestions;
		//public IEnumerable<int> DocumentIdsWhichSupportQuestions => _documentIdsWhichSupportQuestions ?? new List<int>();

		private readonly IEnumerable<int> _documentIdsWhichSupportComments;
		public IEnumerable<int> DocumentIdsWhichSupportComments => _documentIdsWhichSupportComments ?? new List<int>();

		public bool HasAnyDocumentsSupportingComments => DocumentIdsWhichSupportComments.Any();

		public bool ConsultationIsOpen => DateTime.Now >= StartDate && DateTime.Now <= EndDate;
		public bool ConsultationHasNotStartedYet => DateTime.Now < StartDate;  //admin's in preview mode can see the consultation before the start date
		public bool ConsultationHasEnded => DateTime.Now > EndDate;

		public bool SupportsSubmission => (ConsultationIsOpen &&
		                                  !UserHasSubmitted &&
		                                  (HasUserSuppliedAnswers || HasUserSuppliedComments));

		public bool SupportsDownload => (HasUserSuppliedAnswers ||
		                                 HasUserSuppliedComments);

		public bool ShouldShowDrawer => ExternalResource || HasQuestions || DocumentIdsWhichSupportComments.Any() || 
		                                HasUserSuppliedAnswers || HasUserSuppliedComments;

		public bool ShouldShowCommentsTab => ExternalResource || DocumentIdsWhichSupportComments.Any() ||
		                                     HasUserSuppliedComments;

		public bool ShouldShowQuestionsTab => HasQuestions ||
		                                      HasUserSuppliedAnswers;
	}
}
