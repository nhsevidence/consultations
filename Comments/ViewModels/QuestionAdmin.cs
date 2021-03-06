using System.Collections.Generic;
using System.Linq;
using Comments.Common;

namespace Comments.ViewModels
{
	public class QuestionAdmin
	{
		public QuestionAdmin(string consultationTitle, IEnumerable<Question> consultationQuestions, IEnumerable<QuestionAdminDocument> documents,
			IEnumerable<QuestionType> questionTypes, ConsultationState consultationState, IEnumerable<QuestionWithRoles> previousQuestions,
			IEnumerable<string> currentUserRoles)
		{
			ConsultationTitle = consultationTitle;
			//ConsultationSupportsQuestions = consultationSupportsQuestions;
			ConsultationQuestions = consultationQuestions;
			Documents = documents;
			QuestionTypes = questionTypes;
			ConsultationState = consultationState;
			PreviousQuestions = previousQuestions;
			CurrentUserRoles = currentUserRoles.FilterRoles();
		}

		public string ConsultationTitle{ get; private set; }
		//public bool ConsultationSupportsQuestions { get; private set; }

		public IEnumerable<Question> ConsultationQuestions { get; private set; }
		public int ConsultationQuestionsCount => ConsultationQuestions.Count();

		//public IEnumerable<BreadcrumbLink> Breadcrumbs { get; private set; }
		public IEnumerable<QuestionAdminDocument> Documents { get; private set; }

		public IEnumerable<QuestionType> QuestionTypes { get; private set; }

		public ConsultationState ConsultationState { get; private set; }

		public IEnumerable<QuestionWithRoles> PreviousQuestions { get; private set; }

		public IEnumerable<string> CurrentUserRoles { get; private set; }
	}
}
