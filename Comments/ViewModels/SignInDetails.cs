using System;

namespace Comments.ViewModels
{
    public class SignInDetails : User
    {
	    public SignInDetails(User user, string signInURL, string registerURL)
		    : base(user.IsAuthenticated, user.DisplayName, user.UserId, user.OrganisationName)
	    {
		    SignInURL = signInURL;
		    RegisterURL = registerURL;
	    }

		public string SignInURL { get; private set; }

	    public string RegisterURL { get; private set; }
	}
}
