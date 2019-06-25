using Comments.Services;
using Comments.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace Comments.Controllers.Api
{
    [Produces("application/json")]
    [Route("consultations/api/[controller]")]
    public class ConsultationController : Controller
    {
        private readonly IConsultationService _consultationService;
        private readonly ILogger<ConsultationController> _logger;

        public ConsultationController(IConsultationService consultationService, ILogger<ConsultationController> logger)
        {
            _consultationService = consultationService;
            _logger = logger;
        }

		/// <summary>
		/// GET: eg. consultations/api/Consultation?consultationId=1
		/// </summary>
		/// <param name="consultationId"></param>
		/// <param name="isReview">boolean indicating if the feed isbeing accessed for reviewing purposes</param>
		/// <returns></returns>
		[HttpGet]
        public ViewModels.Consultation Get(int consultationId, bool isReview = false)
        {
            if (consultationId < 1)
                throw new ArgumentException(nameof(consultationId));

            return _consultationService.GetConsultation(consultationId, (isReview ? BreadcrumbType.Review : BreadcrumbType.DocumentPage), useFilters: isReview);
        }
    }

	[Produces("application/json")]
	[Route("consultations/api/[controller]")]
	[Authorize(Roles="IndevUser")]
	public class DraftConsultationController : Controller
	{
		private readonly IConsultationService _consultationService;
		private readonly ILogger<ConsultationController> _logger;

		public DraftConsultationController(IConsultationService consultationService, ILogger<ConsultationController> logger)
		{
			_consultationService = consultationService;
			_logger = logger;
		}

		/// <summary>
		/// GET: eg. consultations/api/DraftConsultation?consultationId=1&documentId=1&reference=GID-TA1232
		/// </summary>
		/// <param name="consultationId"></param>
		/// <param name="documentId"></param>
		/// <param name="reference"></param>
		/// <param name="isReview">boolean indicating if the feed isbeing accessed for reviewing purposes</param>
		/// <returns></returns>
		[HttpGet]
		public ViewModels.Consultation Get(int consultationId, int documentId, string reference, bool isReview = false)
		{
			if (consultationId < 1)
				throw new ArgumentException(nameof(consultationId));

			return _consultationService.GetDraftConsultation(consultationId, documentId, reference, isReview);
		}
	}
}
