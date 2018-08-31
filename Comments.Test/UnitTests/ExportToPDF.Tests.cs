using System;
using System.IO;
using System.Text;
using Comments.Export;
using DocMonkey.Client;
using RestSharp;
using Xunit;
using TestBase = Comments.Test.Infrastructure.TestBase;

namespace Comments.Test.UnitTests
{
    public class ExportToPDFTests : TestBase
    {
		[Fact]
	    public void Create_PDF()
	    {
			//Arrange

			//Act
			var baseuri = "http://dev.nice.org.uk/";
		    string xhtml = File.ReadAllText(@"C:\_src\consultations\Comments.Test\Infrastructure\html-to-convert-2.html");

		    var pdfClient = new PdfClient("http://test.docgen.nice.org.uk/");
		    var output = pdfClient.XhtmlContentToPdf(xhtml.TrimStart(), baseuri);


		 //   var client = new RestClient("http://test.docgen.nice.org.uk");
		 //   var xhtml64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(xhtml));

			//var request = new RestRequest("process", Method.POST);
		 //   request.AddParameter("BaseUri", baseuri);
		 //   request.AddParameter("Xhtml", xhtml64);

		 //   IRestResponse response = client.Execute(request);
		 //   var content = response.Content;
			//Assert
		}
	}
}
