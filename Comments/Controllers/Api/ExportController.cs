using Comments.Export;
using Comments.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Comments.Controllers.Api
{

	public class ExportControllerBase : ControllerBase
	{
		protected readonly ILogger<ExportControllerBase> _logger;
		protected readonly IExportService _exportService;
		protected readonly IExportToExcel _exportToExcel;
		public ExportControllerBase(IExportService exportService, IExportToExcel exportToExcel, ILogger<ExportControllerBase> logger)
		{
			_exportService = exportService;
			_exportToExcel = exportToExcel;
			_logger = logger;
		}
	}

	//[Authorize(Roles = "Administrator")] - authorisation is in the service as the role list is configurable in appsettings.json
	[Route("consultations/api/[controller]")]
	public class ExportController: ExportControllerBase
	{
		public ExportController(IExportService exportService, IExportToExcel exportToExcel, ILogger<ExportController> logger) : base(exportService, exportToExcel, logger) {}

		//GET: consultations/api/Export/5 
		[HttpGet("{consultationId}")]
		public IActionResult Get([FromRoute] int consultationId)
		{
			var result = _exportService.GetAllDataForConsulation(consultationId);

			if (!result.valid.Valid)
			{
				return Validate(result.valid, _logger);
			}

			var stream = _exportToExcel.ToSpreadsheet(result.comment, result.answer, result.question);
			return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		}
	}

	[Route("consultations/api/[controller]")]
	public class ExportExternalController : ExportControllerBase
	{
		public ExportExternalController(IExportService exportService, IExportToExcel exportToExcel, ILogger<ExportExternalController> logger) : base(exportService, exportToExcel, logger) {}

		//GET: consultations/api/ExportExternal/5 
		[HttpGet("{consultationId}")]
		public IActionResult Get([FromRoute] int consultationId)
		{
			var result = _exportService.GetAllDataForConsulationForCurrentUser(consultationId);

			var stream = _exportToExcel.ToSpreadsheet(result.comment, result.answer, result.question);
			return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		}
	}
}
