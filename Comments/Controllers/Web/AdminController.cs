using Comments.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Comments.Controllers.Web
{
	[Authorize(Roles="Administrator")]
	
	public class AdminController : Controller
    {
	    private readonly IUserService _userService;
	    private readonly IAdminService _adminService;

	    public AdminController(IUserService userService, IAdminService adminService)
	    {
		    _userService = userService;
		    _adminService = adminService;
	    }

		/// <summary>
		/// /consultations/admin/DeleteAllSubmissionsFromUser?userId={some guid}
		/// </summary>
		/// <param name="userId"></param>
		/// <returns></returns>
		[Route("consultations/admin/DeleteAllSubmissionsFromUser")]
		public ActionResult DeleteAllSubmissionsFromUser(string userId)
	    {
		    if (string.IsNullOrWhiteSpace(userId))
			    throw new ArgumentNullException(nameof(userId));

		    if (!Guid.TryParse(userId, out Guid parsedGuid))
			    throw new ArgumentException("Cannot parse guid", nameof(userId));


		    var rowCount = _adminService.DeleteAllSubmissionsFromUser(parsedGuid);

		    return Content($"Row count deleted/updated: {rowCount}");
	    }

		/// <summary>
		/// /consultations/admin/DeleteAllSubmissionsFromSelf
		/// </summary>
		/// <returns></returns>
		[Route("consultations/admin/DeleteAllSubmissionsFromSelf")]
	    public ActionResult DeleteAllSubmissionsFromSelf()
		{
			var user = _userService.GetCurrentUser();
			if (!user.IsAuthorised || !user.UserId.HasValue)
				throw new Exception("Cannot get logged on user id");

			var rowCount = _adminService.DeleteAllSubmissionsFromUser(user.UserId.Value);

		    return Content($"Row count deleted/updated: {rowCount}");
	    }

		/// <summary>
		/// /consultations/admin/InsertQuestionsForDocument1And2InConsultation?consultationId=1
		/// </summary>
		/// <param name="consultationId"></param>
		/// <returns></returns>
		[Route("consultations/admin/InsertQuestionsForDocument1And2InConsultation")]
	    public ActionResult InsertQuestionsForDocument1And2InThisConsultation(int consultationId)
	    {
		    if (consultationId < 1)
			    throw new ArgumentException("invalid consultation id", nameof(consultationId));

		    var rowCount = _adminService.InsertQuestionsForAdmin(consultationId);

			return Content($"Row count deleted/updated: {rowCount}");
	    }

		/// <summary>
		/// /consultations/admin/DeleteAllData
		/// </summary>
		/// <returns></returns>
		[Route("consultations/admin/DeleteAllData")]
	    public ActionResult DeleteAllData()
	    {
		    var rowCount = _adminService.DeleteAllData();

		    return Content($"Row count deleted/updated: {rowCount}");
	    }
	}
}
