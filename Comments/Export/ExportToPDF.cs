using System.IO;
using DocMonkey.Client;

namespace Comments.Export
{
	public interface IExportToPDF
	{
		void CreatePDF();
	}
    public class ExportToPDF : IExportToPDF
	{
	    public void CreatePDF()
	    {
			var baseuri = "http://dev.nice.org.uk/";
		    string xhtml = File.ReadAllText(@"C:\_src\consultations\Comments.Test\Infrastructure\html-to-convert-2.html");

		    var pdfClient = new PdfClient("http://test.docgen.nice.org.uk/");
			var output = pdfClient.XhtmlContentToPdf(xhtml.TrimStart(), baseuri);
	    }
    }
}
