using System;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Comments.Controllers.Web
{
    /// <summary>
    /// This controller maps to the root of the app, i.e. "/".
    /// it will only get hit on local dev machines. On the server, the root of the app is served by orchard via varnish.
    ///
    /// this controller is important for local dev, as without it nice accounts won't work.
    ///
    /// the reason for that is that nice accounts posts to the root of the website after logging in, then redirects after that.
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("")]
    public class RootController : Controller
    {
        private readonly ILogger<RootController> _logger;

        public RootController(ILogger<RootController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index(string wctx)
        {
            _logger.LogWarning("Hitting the root controller. this should only occur locally.");
	        if (!string.IsNullOrEmpty(wctx))
	        {
		        try
		        {
			        //don't judge this too harshly. this pretty nasty code is here for dev purposes only. it's not production code.
			        const string returnName = "ru=";
			        var parts = wctx.Split('&');
			        var returnPart = parts.FirstOrDefault(p => p.StartsWith(returnName));
			        if (returnPart != null)
			        {
				        var url = returnPart.Substring(returnName.Length);
				        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase))
				        {
					        var uri = new Uri(WebUtility.UrlDecode(url));
					        url = uri.AbsolutePath;
				        }
				        return Redirect(url);
			        }
		        }
		        catch (Exception ex)
		        {
			        _logger.LogError(ex, "Error when hitting the root controller. this should only occur locally.");
		        }
	        }
	        //return Content("root controller hit");
			return Redirect("/consultations/22/1/guidance");
        }
    }
}
