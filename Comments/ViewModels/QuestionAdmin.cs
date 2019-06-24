using System.Collections.Generic;
using System.Linq;

namespace Comments.ViewModels
{
	public class QuestionAdmin
	{
		public QuestionAdmin(string consultationTitle, IEnumerable<Question> consultationQuestions, IEnumerable<QuestionAdminDocument> documents,
			IEnumerable<QuestionType> questionTypes, ConsultationState consultationState, IEnumerable<Question> submissionQuestions)
		{
			ConsultationTitle = consultationTitle;
			//ConsultationSupportsQuestions = consultationSupportsQuestions;
			ConsultationQuestions = consultationQuestions;
			SubmissionQuestions = submissionQuestions;
			Documents = documents;
			QuestionTypes = questionTypes;
			ConsultationState = consultationState;
		}

		public string ConsultationTitle{ get; private set; }
		//public bool ConsultationSupportsQuestions { get; private set; }

		public IEnumerable<Question> ConsultationQuestions { get; private set; }
		public int ConsultationQuestionsCount => ConsultationQuestions.Count();

		public IEnumerable<Question> SubmissionQuestions { get; private set; }

		//public IEnumerable<BreadcrumbLink> Breadcrumbs { get; private set; }
		public IEnumerable<QuestionAdminDocument> Documents { get; private set; }

		public IEnumerable<QuestionType> QuestionTypes { get; private set; }

		public ConsultationState ConsultationState { get; private set; }
	}
}
