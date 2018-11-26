using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Comments.Common;
using Comments.ViewModels;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Comments.Controllers.Web
{
	/// <summary>
	/// This error controller is only shown if there's a problem showing the error using react..
	/// </summary>

	public class ErrorController : Controller
    {
	    private readonly ILogger _logger;

		public ErrorController(ILogger<ErrorController> logger)
	    {
			_logger = logger;
		}

	    [ApiExplorerSettings(IgnoreApi = true)]
	    [Route(Constants.ErrorPath)]
	    [Route(Constants.ErrorPath + "/{statusCode}")]
		public ActionResult Index(int statusCode)
        {
	        var reFeat = HttpContext.Features.Get<IStatusCodeReExecuteFeature>();
	        string requestedPath = null;
	        if (reFeat != null)
	        {
		        requestedPath = reFeat.OriginalPath;
	        }

	        if (statusCode == (int)HttpStatusCode.NotFound)
	        {
		        return View("NotFound");
	        }

			var ehFeat = HttpContext.Features.Get<IExceptionHandlerFeature>();
	        Exception exception = null;
	        if (ehFeat != null)
	        {
		        exception = ehFeat.Error;
	        }

	        _logger.LogError($"Exception for Url: {requestedPath}, Exception: {exception}");

			var viewModel = new Error(requestedPath, exception);
			return View(viewModel);
        }
    }
}
