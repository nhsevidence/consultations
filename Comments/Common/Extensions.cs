using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Comments.Common
{
    public static class Extensions
    {
        /// <summary>
        /// This isn't a consultations uri. this is the relative url, shown in the address bar.
        /// This function converts a relative url like "/1/1/introduction" into "/consultations/1/1/introduction".
        /// If the latter is passed in, then it returns it straight.
        /// </summary>
        /// <param name="relativeURL"></param>
        /// <returns></returns>
        public static string ToConsultationsRelativeUrl(this string relativeURL)
        {
            relativeURL = relativeURL.ToLower();

            if (relativeURL.StartsWith(Constants.ConsultationsBasePath))
                return relativeURL;

            var combinedPath = UrlCombine(Constants.ConsultationsBasePath, relativeURL);

            return combinedPath;
        }

        private static string UrlCombine(string url1, string url2)
        {
            if (url1.Length == 0)
            {
                return url2;
            }
            if (url2.Length == 0)
            {
                return url1;
            }
            url1 = url1.TrimEnd('/', '\\');
            url2 = url2.TrimStart('/', '\\');

            return string.Format("{0}/{1}", url1, url2);
        }

        /// <summary>
        /// Swaps out http:// for https:// in a url string.
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public static string ToHTTPS(this string url)
        {
            return (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
                ? url.Replace("http://", "https://", StringComparison.OrdinalIgnoreCase)
                : url;
        }

		public static void Clear<T>(this DbSet<T> dbSet) where T : class
		{
			dbSet.RemoveRange(dbSet);
		}

	    private const string UnknownHostName = "UNKNOWN-HOST";
		public static Uri GetUri(this HttpRequest request)
	    {
		    if (null == request)
		    {
			    throw new ArgumentNullException("request");
		    }

		    if (true == string.IsNullOrWhiteSpace(request.Scheme))
		    {
			    throw new ArgumentException("Http request Scheme is not specified");
		    }

		    string hostName = request.Host.HasValue ? request.Host.ToString() : UnknownHostName;

		    var builder = new StringBuilder();

		    builder.Append(request.Scheme)
			    .Append("://")
			    .Append(hostName);

		    if (true == request.Path.HasValue)
		    {
			    builder.Append(request.Path.Value);
		    }

		    if (true == request.QueryString.HasValue)
		    {
			    builder.Append(request.QueryString);
		    }

		    return new Uri(builder.ToString());
	    }

	    public static bool IsIntegrationTest(this IHostingEnvironment hostingEnvironment)
	    {
		    return hostingEnvironment.ContentRootPath.IndexOf(".Test", StringComparison.OrdinalIgnoreCase) != -1;
	    }

		public enum QuestionFilter
		{
			All = 0,
			NotDeleted = 1,
			Deleted = 2
		}
	}
}
