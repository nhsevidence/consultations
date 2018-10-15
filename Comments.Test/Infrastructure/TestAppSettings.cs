using Comments.Configuration;
using Comments.ViewModels;
using System.Collections.Generic;
using Comments.Common;
using System;

namespace Comments.Test.Infrastructure
{
	public static class TestAppSettings
	{
		public static ConsultationListConfig GetConsultationListConfig()
		{
			return new ConsultationListConfig()
			{
				OptionFilters = new List<OptionFilterGroup>
				{
					new OptionFilterGroup{ Id = "Status", Title = "Status", Options = new List<FilterOption>()
					{
						new FilterOption("Open", "Open"),
						new FilterOption("Closed", "Closed"),
						new FilterOption("Upcoming", "Upcoming"),
					}}
				},
				TextFilters = new TextFilterGroup {  Id = Constants.AppSettings.Keyword, Title = Constants.AppSettings.Keyword  },
				DownloadRolesCSV = "Administrator,CustomFictionalRole"
			};
		}

		internal static FeedConfig GetFeedConfig()
		{
			return new FeedConfig()
			{
				IndevBasePath = new Uri("https://indevnice.org")
			};
		}
	}
}