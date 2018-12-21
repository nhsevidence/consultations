using Comments.Common;
using Comments.ViewModels;
using Microsoft.AspNetCore.Http;
using NICE.Auth.NetCore.Helpers;
using NICE.Auth.NetCore.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Comments.Services
{
	public interface IUserService
    {
        User GetCurrentUser();
		SignInDetails GetCurrentUserSignInDetails(string returnURL);
	    string GetDisplayNameForUserId(Guid userId);
	    string GetEmailForUserId(Guid userId);
		IDictionary<Guid, string> GetDisplayNamesForMultipleUserIds(IEnumerable<Guid> userIds);
	    ICollection<string> GetUserRoles();
	    Validate IsAllowedAccess(ICollection<string> permittedRoles);
	}

    public class UserService : IUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
	    private readonly IAuthenticateService _authenticateService;

	    public UserService(IHttpContextAccessor httpContextAccessor, IAuthenticateService authenticateService)
	    {
		    _httpContextAccessor = httpContextAccessor;
		    _authenticateService = authenticateService;
	    }

        public User GetCurrentUser()
        {
            var contextUser = _httpContextAccessor.HttpContext?.User;

            return new User(contextUser?.Identity.IsAuthenticated ?? false, contextUser?.DisplayName(), contextUser?.Id(), contextUser?.Organisation());
        }

		public SignInDetails GetCurrentUserSignInDetails(string returnURL)
	    {
			var user = GetCurrentUser();

		    var signInURL = _authenticateService.GetLoginURL(returnURL.ToConsultationsRelativeUrl());
		    var registerURL = _authenticateService.GetRegisterURL(returnURL.ToConsultationsRelativeUrl());

			return new SignInDetails(user, signInURL, registerURL);
		}

	    public string GetDisplayNameForUserId(Guid userId)
	    {
		    return _authenticateService.FindUser(userId)?.DisplayName;
	    }

	    public string GetEmailForUserId(Guid userId)
	    {
		    return _authenticateService.FindUser(userId)?.EmailAddress;
	    }

		public IDictionary<Guid, string> GetDisplayNamesForMultipleUserIds(IEnumerable<Guid> userIds)
	    {
		    return userIds.Distinct().ToDictionary(userId => userId, GetDisplayNameForUserId);
	    }

	    public ICollection<string> GetUserRoles()
	    {
			var niceUser = _httpContextAccessor.HttpContext?.User;
		    return niceUser?.Roles().ToList() ?? new List<string>();
	    }

	    public Validate IsAllowedAccess(ICollection<string> permittedRoles)
	    {
		    if (!permittedRoles.Any())
		    {
			    throw new ArgumentException("There is expected to be at least one permitted role", nameof(permittedRoles));
		    }

		    var user = GetCurrentUser();
		    if (!user.IsAuthorised)
		    {
			    return new Validate(false, true, false, "User is not authorised");
		    }
		    var niceUser = _httpContextAccessor.HttpContext.User;
		    if (!niceUser.Identity.IsAuthenticated)
		    {
			    return new Validate(false, false, false, "Not authenticated");
		    }
		    var userRoles = niceUser.Roles();

		    if (!userRoles.Any(permittedRoles.Contains))
		    {
			    return new Validate(false, true, false, "NICE user is not permitted to download this file");
		    }
		    return new Validate(valid: true);
	    }
	}
}
