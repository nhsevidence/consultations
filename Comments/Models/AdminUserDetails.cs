using System;
using System.Linq;

namespace Comments.Models
{
	/// <summary>
	/// This class is just here to support the data export for idam. it's to be removed after idam has been integrated.
	/// </summary>
	public class AdminUserDetails
	{
		public Guid UserId { get; }
		public string DisplayName { get; }
		public string EmailAddress { get; }
		public string FirstName { get; }
		public string LastName { get; }


		public AdminUserDetails(Guid userId, string displayName, string emailAddress)
		{
			UserId = userId;
			EmailAddress = emailAddress;

			if (string.IsNullOrEmpty(displayName))
			{
				DisplayName = "CHECK: Invalid?";
			}
			else
			{
				var parts = displayName.Split(' ');

				if (parts.Length < 2)
				{
					DisplayName = "CHECK:" + displayName;
					FirstName = displayName;
					LastName = string.Empty;
				}

				if (parts.Length == 2)
				{
					DisplayName = displayName;
					FirstName = parts[0];
					LastName = parts[1];
				}

				if (parts.Length > 2)
				{
					DisplayName = "CHECK:" + displayName;
					FirstName = parts[0];
					LastName = string.Join(' ', parts.Skip(1));
				}
			}
		}
	}
}
