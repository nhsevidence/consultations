using Microsoft.AspNetCore.Mvc;

namespace Comments.ViewModels
{
    public class Validate
    {
        public Validate(bool valid, bool unauthenticated = false, bool unauthorised = false, bool notFound = false, string message = null)
        {
            Valid = valid;
            Unauthenticated = unauthenticated;
            Unauthorised = unauthorised;
            NotFound = notFound;
            Message = message;
        }

        public bool Valid { get; private set; }
        public bool Unauthenticated { get; private set; }
		public bool Unauthorised { get; private set; }
        public bool NotFound { get; private set; }
        public string Message { get; private set; }
    }
}
