using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Comments.ViewModels;

namespace Comments.Controllers.Api
{
    public class ControllerBase : Controller
    {
        protected IActionResult Validate<T>(Validate validate, ILogger<T> logger)
        {
            if (validate == null || validate.Valid)
                return null;

            logger.LogWarning(validate.Message);

            if (validate.Unauthenticated) // || validate.Unauthorised) //todo: remove
                return Unauthorized();

            if (validate.Unauthorised)
	            return Forbid();

            if (validate.NotFound)
                return NotFound();

            return BadRequest();
        }
    }
}
