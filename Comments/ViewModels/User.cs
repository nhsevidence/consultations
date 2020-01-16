using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Comments.ViewModels
{
    public class User
    {
        public User(bool isAuthenticated, string displayName, string userId, string organisationName = null)
        {
	        IsAuthenticated = isAuthenticated;
            DisplayName = displayName;
            UserId = userId;
	        OrganisationName = organisationName;
        }

        public bool IsAuthenticated { get; private set; }
        public string DisplayName { get; private set; }
        public string UserId { get; private set; }
		public string OrganisationName { get; private set; }
    }
}
