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
					DownloadRoles = new RoleTypes {
						AdminRoles = new List<string> { TestUserType.Administrator.ToString()},
						TeamRoles = new List<string> { TestUserType.CustomFictionalRole.ToString(), TestUserType.ConsultationListTestRole.ToString() } }
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