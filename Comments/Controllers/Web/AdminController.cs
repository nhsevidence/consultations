using Comments.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Comments.Controllers.Web
{
	[Authorize(Policy = "Administrator")]
	
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


		    var rowCount = _adminService.DeleteAllSubmissionsFromUser(userId);

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
			if (!user.IsAuthenticated || string.IsNullOrEmpty(user.UserId))
				throw new Exception("Cannot get logged on user id");

			var rowCount = _adminService.DeleteAllSubmissionsFromUser(user.UserId);

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

		    var rowCount = _adminService.InsertQuestionsForDocument1And2InConsultation(consultationId);

			return Content($"Row count deleted/updated: {rowCount}");
	    }

	    /// <summary>
	    /// /consultations/admin/InsertQuestionsForConsultation?consultationId=1
	    /// </summary>
	    /// <param name="consultationId"></param>
	    /// <returns></returns>
	    [Route("consultations/admin/InsertQuestionsForConsultation")]
	    public ActionResult InsertQuestionsForConsultation(int consultationId)
	    {
		    if (consultationId < 1)
			    throw new ArgumentException("invalid consultation id", nameof(consultationId));

		    var rowCount = _adminService.InsertQuestionsForConsultation(consultationId);

		    return Content($"Row count deleted/updated: {rowCount}");
	    }

	    /// <summary>
	    /// /consultations/admin/InsertQuestionsForCfGConsultation?consultationId=1
	    /// </summary>
	    /// <param name="consultationId"></param>
	    /// <returns></returns>
	    [Route("consultations/admin/InsertQuestionsForCfGConsultation")]
	    public ActionResult InsertQuestionsForCfGConsultation(int consultationId)
	    {
		    if (consultationId < 1)
			    throw new ArgumentException("invalid consultation id", nameof(consultationId));

		    var rowCount = _adminService.InsertQuestionsForCfGConsultation(consultationId);

		    return Content($"Row count deleted/updated: {rowCount}");
	    }

		/// <summary>
		/// /consultations/admin/InsertQuestionsForQSConsultation?consultationId=1
		/// </summary>
		/// <param name="consultationId"></param>
		/// <returns></returns>
		[Route("consultations/admin/InsertQuestionsForQSConsultation")]
	    public ActionResult InsertQuestionsForQSConsultation(int consultationId)
	    {
		    if (consultationId < 1)
			    throw new ArgumentException("invalid consultation id", nameof(consultationId));

		    var rowCount = _adminService.InsertQuestionsForQSConsultation(consultationId);

		    return Content($"Row count deleted/updated: {rowCount}");
	    }

		///// <summary>
		///// /consultations/admin/DeleteAllData
		///// </summary>
		///// <returns></returns>
		//[Route("consultations/admin/DeleteAllData")]
	 //   public ActionResult DeleteAllData()
	 //   {
		//    var rowCount = _adminService.DeleteAllData();

		//    return Content($"Row count deleted/updated: {rowCount}");
	 //   }


		/// <summary>
		/// /consultations/admin/GetData?table=Comment
		/// </summary>
		/// <returns></returns>
		[Route("consultations/admin/GetData")]
	    public JsonResult GetData(string table)
		{
			var allData = _adminService.GetData(table);

			return Json(allData);
		}

		/// <summary>
		/// /consultations/admin/GetUniqueUsers
		/// </summary>
		/// <returns></returns>
		[Route("consultations/admin/GetUniqueUsers")]
		public JsonResult GetUniqueUsers()
		{
			var allData = _adminService.GetUniqueUsers();

			return Json(allData);
		}
	}
}
