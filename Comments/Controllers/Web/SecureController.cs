using Comments.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NICE.Auth.NetCore.Helpers;
using NICE.Auth.NetCore.Services;
using System;
using Comments.Common;

namespace Comments.Controllers.Web
{
    /// <summary>
    /// This controller is just here for test purposes
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("secure")]
    [Authorize]
    public class SecureController : Controller
    {
        private readonly ILogger<RootController> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAuthenticateService _authenticateService;

        public SecureController(ILogger<RootController> logger, IHttpContextAccessor httpContextAccessor, IAuthenticateService authenticateService)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _authenticateService = authenticateService;
        }

        public IActionResult Index()
        {
            _logger.LogWarning("Hitting the secure controller. this should only occur locally.");
            var pageDescription = "Hitting the secure controller";

            var user = _httpContextAccessor.HttpContext.User;
            var isLoggedOn = (user != null && user.Identity.IsAuthenticated);
           // var xReferer = Request.GetUri().GetComponents(UriComponents.Scheme | UriComponents.Host, UriFormat.UriEscaped);
            var signInUrl = _authenticateService.GetLoginURL(Request.GetUri().PathAndQuery);
            var signOutUrl = _authenticateService.GetLogoutURL(Request.GetUri().PathAndQuery);

            SecureTestViewModel model;

            if (isLoggedOn)
            {

              model = new SecureTestViewModel(signInUrl, signOutUrl, isLoggedOn,
                    userId: user.Id(), displayName: user.DisplayName(), givenName: user.GivenName(), surname: user.LastName(),
                    email: user.Email(), organisation: user.Organisation(), pageDescription: pageDescription);
            }
            else
            {
                model = new SecureTestViewModel(signInUrl, signOutUrl, isLoggedOn, userId: null, displayName: null, givenName: null,
                    surname: null, email: null, organisation: null, pageDescription: pageDescription);
            }

            return View(model);
        }
    }
}
