using System;
using System.Collections.Generic;
using System.Text;
using Comments.Services;
using Comments.ViewModels;
using Location = Comments.Models.Location;

namespace Comments.Test.Infrastructure
{
    public class FakeSubmitService : ISubmitService
    {
	    public (int rowsUpdated, Validate validate) Submit(ViewModels.Submission submission)
	    {
		    throw new NotImplementedException();
	    }

	    public int DeleteAllSubmissionsFromUser(Guid usersSubmissionsToDelete)
	    {
		    throw new NotImplementedException();
	    }

	    public bool HasSubmittedCommentsOrQuestions(string consultationSourceURI, Guid userId)
	    {
		    throw new NotImplementedException();
	    }

	    public ConsultationState GetConsultationState(string sourceURI, IEnumerable<Location> locations = null)
	    {
		    return new ConsultationState(false, DateTime.MinValue, DateTime.MaxValue, true, true, true, true, true, true, null, null);
	    }
    }
}
