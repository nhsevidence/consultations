using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using NICE.Auth.NetCore.Models;
using NICE.Auth.NetCore.Services;

namespace Comments.Test.Infrastructure
{
    public class FakeAuthenticateService : IAuthenticateService
    {
	    private readonly Dictionary<Guid, UserInfo> _userDictionary = null;
	    private readonly bool _authenticated;
        private readonly string _redirectURL;
        private readonly string _loginURL;
        private readonly string _logoutURL;
	    private readonly string _registerURL;
	    private readonly string _errorMessage;

	    public FakeAuthenticateService(bool authenticated = true, string redirectURL = "consultations://./consultation/1/document/1/chapter/introduction", 
            string loginURL = "/signin?returnURL=/", string logoutURL = "/signout?returnURL=/", string registerURL = "/register?returnURL=/", string errorMessage = "")
        {
            _authenticated = authenticated;
            _redirectURL = redirectURL;
            _loginURL = loginURL;
            _logoutURL = logoutURL;
	        _registerURL = registerURL;
	        _errorMessage = errorMessage;
        }

	    //public FakeAuthenticateService(Dictionary<Guid, string> userDictionary)
	    //{
		   // _userDictionary = userDictionary.ToDictionary(u => u.Key, u => new UserInfo {DisplayName = u.Value });
	    //}

	    public FakeAuthenticateService(Dictionary<Guid, UserInfo> userDictionary)
	    {
		    _userDictionary = userDictionary.ToDictionary(u => u.Key, u => new UserInfo { DisplayName = u.Value.DisplayName, EmailAddress = u.Value.EmailAddress });
	    }

		public bool Authenticate(HttpContext httpContext, out string redirectURL, out string errorMessage)
	    {
			redirectURL = _redirectURL;
		    errorMessage = _errorMessage;
		    return _authenticated;
		}

	    public string GetLoginURL(string returnURL = null)
        {
            return _loginURL;
        }

        public string GetLogoutURL(string returnURL = null)
        {
            return _logoutURL;
        }

	    public string GetRegisterURL(string returnURL = null)
	    {
		    return _registerURL;
	    }

	    public UserInfo FindUser(Guid userId)
	    {
		    if (_userDictionary == null || !_userDictionary.ContainsKey(userId))
		    {
			    return null;
		    }
		    return _userDictionary[userId];
	    }
    }
}
