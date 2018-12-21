using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Comments.Models;
using Comments.Services;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.Extensions.Logging;

namespace Comments.Export
{
	public interface IExportToExcel
	{
		Stream ToSpreadsheet(IEnumerable<Models.Comment> comments, IEnumerable<Models.Answer> answers, IEnumerable<Models.Question> questions);
	}

	public class ExportToExcel : IExportToExcel
	{
		private readonly IUserService _userService;
		private readonly IExportService _exportService;
		private readonly ILogger<ExportToExcel> _logger;

		public ExportToExcel(IUserService userService, IExportService exportService, ILogger<ExportToExcel> logger)
		{
			_userService = userService;
			_exportService = exportService;
			_logger = logger;
		}
		public Stream ToSpreadsheet(IEnumerable<Models.Comment> comments, IEnumerable<Models.Answer> answers, IEnumerable<Models.Question> questions)
		{
			//SpreadsheetDocument spreadsheetDocument = SpreadsheetDocument.Create("C:/Test/TestExcel" + DateTime.Now.Hour + DateTime.Now.Minute + DateTime.Now.Second + ".xlsx", SpreadsheetDocumentType.Workbook);

			var stream = new MemoryStream();
			using (var workbook = SpreadsheetDocument.Create(stream, SpreadsheetDocumentType.Workbook))
			{
				CreateSheet(workbook, comments, answers, questions);
			}

			stream.Position = 0;

			return stream;
		}

		private Columns SetUpColumns()
		{
			Columns columns = new Columns(
				new Column // User
				{
					Min = 1,
					Max = 14,
					Width = 25,
					CustomWidth = true
				},
				new Column // Email Address
				{
					Min = 2,
					Max = 2,
					Width = 25,
					CustomWidth = true
				},
				new Column // Consultation Name
				{
					Min = 3,
					Max = 3,
					Width = 25,
					CustomWidth = true
				},
				new Column // Document Name
				{
					Min = 4,
					Max = 4,
					Width = 25,
					CustomWidth = true
				},
				new Column // Chapter Name
				{
					Min = 5,
					Max = 5,
					Width = 25,
					CustomWidth = true
				},
				new Column // Section
				{
					Min = 6,
					Max = 6,
					Width = 25,
					CustomWidth = true
				},
				new Column // Selected text
				{
					Min = 7,
					Max = 7,
					Width = 25,
					CustomWidth = true
				},
				new Column // Comment
				{
					Min = 8,
					Max = 8,
					Width = 50,
					CustomWidth = true
				},
				new Column // Question Text
				{
					Min = 9,
					Max = 9,
					Width = 25,
					CustomWidth = true
				},
				new Column // Answer Text
				{
					Min = 10,
					Max = 10,
					Width = 50,
					CustomWidth = true
				},
				new Column // Represent An Organisation
				{
					Min = 11,
					Max = 11,
					Width = 20,
					CustomWidth = true
				},
				new Column // Organisation Name
				{
					Min = 12,
					Max = 12,
					Width = 25,
					CustomWidth = true
				},
				new Column // Has Tobacco Links
				{
					Min = 13,
					Max = 13,
					Width = 20,
					CustomWidth = true
				},
				new Column // Tobacco Link Details
				{
					Min = 14,
					Max = 14,
					Width = 25,
					CustomWidth = true
				});

			return columns;
		}

		private void AppendHeaderRow(SheetData sheet)
		{
			var headerRow = new Row();

			DocumentFormat.OpenXml.Spreadsheet.Cell cell;

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("User");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Email Address");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Consultation Name");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Document Name");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Chapter Name");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Section");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Selected Text");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Comment");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Question Text");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Answer Text");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Represents An Organisation");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue(" Organisation");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Has Tobacco Links");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue("Tobacco Link Details");
			cell.StyleIndex = 2;
			headerRow.AppendChild(cell);

			sheet.AppendChild(headerRow);
		}

		private void AppendDataRow(SheetData sheet, IEnumerable<Models.Comment> comments, IEnumerable<Models.Answer> answers, IEnumerable<Models.Question> questions)
		{
			var data = CollateData(comments, answers, questions);

			foreach (var row in data)
			{
				var dataRow = new Row();

				Cell cell;

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.UserName);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Email);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.ConsultationName);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.DocumentName);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.ChapterTitle);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Section);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Quote);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Comment);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);
				
				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Question);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.Answer);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.RepresentsOrganisation == true ? "Yes" : row.RepresentsOrganisation == false ? "No" : null);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.OrganisationName);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.HasTobaccoLinks == true ? "Yes" : row.HasTobaccoLinks == false ? "No" : null);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				cell = new Cell();
				cell.DataType = CellValues.String;
				cell.CellValue = new CellValue(row.TobaccoIndustryDetails);
				cell.StyleIndex = 1;
				dataRow.AppendChild(cell);

				sheet.AppendChild(dataRow);
			}
		}

		private List<Excel> CollateData(IEnumerable<Models.Comment> comments, IEnumerable<Models.Answer> answers, IEnumerable<Models.Question> questions)
		{
			List<Excel> excel = new List<Excel>();
			foreach (var comment in comments)
			{
				var locationDetails = _exportService.GetLocationData(comment.Location);
				var excelrow = new Excel()
				{
					ConsultationName = locationDetails.ConsultationName,
					DocumentName = locationDetails.DocumentName,
					ChapterTitle = locationDetails.ChapterName,
					Section = comment.Location.Section,
					Quote = comment.Location.RangeEnd != null && comment.Location.RangeStart != null ? comment.Location.Quote : null,
					UserName =  _userService.GetDisplayNameForUserId(comment.CreatedByUserId),
					Email = _userService.GetEmailForUserId(comment.CreatedByUserId),
					CommentId = comment.CommentId,
					Comment =  comment.CommentText,
					QuestionId = null,
					Question = null,
					AnswerId = null,
					Answer = null,
					RepresentsOrganisation = comment.SubmissionComment.Count > 0 ? comment.SubmissionComment?.First().Submission.RespondingAsOrganisation : null,
					OrganisationName =  comment.SubmissionComment.Count > 0 ? comment.SubmissionComment?.First().Submission.OrganisationName : null,
					HasTobaccoLinks =  comment.SubmissionComment.Count> 0 ? comment.SubmissionComment?.First().Submission.HasTobaccoLinks : null,
					TobaccoIndustryDetails = comment.SubmissionComment.Count > 0? comment.SubmissionComment?.First().Submission.TobaccoDisclosure : null,
					Order = comment.Location.Order
				};
				excel.Add(excelrow);
			}

			foreach (var answer in answers)
			{
				var locationDetails = _exportService.GetLocationData(answer.Question.Location);
				var excelrow = new Excel()
				{
					ConsultationName = locationDetails.ConsultationName,
					DocumentName = locationDetails.DocumentName,
					ChapterTitle = locationDetails.ChapterName,
					Section = answer.Question.Location.Section,
					Quote = answer.Question.Location.Quote,
					UserName = _userService.GetDisplayNameForUserId(answer.CreatedByUserId),
					Email = _userService.GetEmailForUserId(answer.CreatedByUserId),
					CommentId = null,
					Comment = null,
					QuestionId = answer.Question.QuestionId,
					Question = answer.Question.QuestionText,
					AnswerId = answer.AnswerId,
					Answer = answer.AnswerText,
					OrganisationName = answer.SubmissionAnswer.Count > 0 ? answer.SubmissionAnswer?.First().Submission.OrganisationName : null,
					RepresentsOrganisation = answer.SubmissionAnswer.Count > 0 ? answer.SubmissionAnswer?.First().Submission.RespondingAsOrganisation : null,
					HasTobaccoLinks = answer.SubmissionAnswer.Count > 0 ? answer.SubmissionAnswer?.First().Submission.HasTobaccoLinks : null,
					TobaccoIndustryDetails = answer.SubmissionAnswer.Count > 0 ? answer.SubmissionAnswer?.First().Submission.TobaccoDisclosure : null,
					Order = answer.Question.Location.Order
				};
				excel.Add(excelrow);
			}

			foreach (var question in questions)
			{
				var locationDetails = _exportService.GetLocationData(question.Location);
				var excelrow = new Excel()
				{
					ConsultationName = locationDetails.ConsultationName,
					DocumentName = locationDetails.DocumentName,
					ChapterTitle = locationDetails.ChapterName,
					Section = question.Location.Section,
					Quote = question.Location.Quote,
					UserName = null,
					Email = null,
					CommentId = null,
					Comment = null,
					QuestionId = question.QuestionId,
					Question = question.QuestionText,
					AnswerId = null,
					Answer = null,
					RepresentsOrganisation = null,
					OrganisationName = null,
					HasTobaccoLinks = null,
					TobaccoIndustryDetails = null,
					Order = question.Location.Order
				};
				excel.Add(excelrow);
			}

			var orderedData = excel.OrderBy(o => o.UserName).ThenBy(o => o.Order).ToList();

			return orderedData;
		}

		private Stylesheet CreateStyleSheet()
		{
			Stylesheet styleSheet = new Stylesheet();

			Fonts fonts = new Fonts(
				new Font( // Index 0 - default
					new FontSize() { Val = 10 }

				),
				new Font( // Index 1 - header
					new FontSize() { Val = 10 },
					new Bold(),
					new Color() { Rgb = "FFFFFF" }

				),
				new Font( // Index 1 - Title
					new FontSize() { Val = 16 },
					new Bold(),
					new Color() { Rgb = "000000" }

				));

			Fills fills = new Fills(
				new Fill(new PatternFill() { PatternType = PatternValues.None }), // Index 0 - default
				new Fill(new PatternFill() { PatternType = PatternValues.Gray125 }), // Index 1 - should be able to remove this as it isn't used, it breaks if I do though
				new Fill(new PatternFill(new ForegroundColor { Rgb = new HexBinaryValue() { Value = "66666666" } })
					{ PatternType = PatternValues.Solid }) // Index 2 - header
			);

			Borders borders = new Borders(
				new Border(), // index 0 default
				new Border( // index 1 black border
					new LeftBorder(new Color() { Auto = true }) { Style = BorderStyleValues.Thin },
					new RightBorder(new Color() { Auto = true }) { Style = BorderStyleValues.Thin },
					new TopBorder(new Color() { Auto = true }) { Style = BorderStyleValues.Thin },
					new BottomBorder(new Color() { Auto = true }) { Style = BorderStyleValues.Thin },
					new DiagonalBorder())
			);

			CellFormats cellFormats = new CellFormats(
				new CellFormat(), // default
				new CellFormat { FontId = 0, FillId = 0, BorderId = 1, ApplyBorder = true, Alignment = new Alignment() { WrapText = true } }, // body
				new CellFormat { FontId = 1, FillId = 2, BorderId = 1, ApplyFill = true, Alignment = new Alignment() { WrapText = true } }, // header
				new CellFormat { FontId = 2, FillId = 0, BorderId = 0, ApplyFill = true, Alignment = new Alignment() { WrapText = false } } // title
			);

			styleSheet = new Stylesheet(fonts, fills, borders, cellFormats);

			return styleSheet;
		}

		private void CreateSheet(SpreadsheetDocument spreadsheetDocument, IEnumerable<Models.Comment> comments, IEnumerable<Models.Answer> answers, IEnumerable<Models.Question> questions)
		{
			// Add a WorkbookPart to the document.
			WorkbookPart workbookpart = spreadsheetDocument.AddWorkbookPart();
			workbookpart.Workbook = new Workbook();

			// Add a WorksheetPart to the WorkbookPart.
			WorksheetPart worksheetPart = workbookpart.AddNewPart<WorksheetPart>();
			worksheetPart.Worksheet = new Worksheet();

			// Add a Style to the workbook part
			WorkbookStylesPart stylesPart = workbookpart.AddNewPart<WorkbookStylesPart>();
			stylesPart.Stylesheet = CreateStyleSheet();
			stylesPart.Stylesheet.Save();

			worksheetPart.Worksheet.AppendChild(SetUpColumns());

			// Add Sheets to the Workbook.
			Sheets sheets = spreadsheetDocument.WorkbookPart.Workbook.AppendChild(new Sheets());

			// Append a new worksheet and associate it with the spreadsheetDocument.
			Sheet sheet = new Sheet()
			{
				Id = spreadsheetDocument.WorkbookPart.GetIdOfPart(worksheetPart),
				SheetId = 1,
				Name = "Comments"
			};
			sheets.Append(sheet);
			
			workbookpart.Workbook.Save();

			// Add data to the worksheet
			SheetData sheetData = worksheetPart.Worksheet.AppendChild(new SheetData());

			var ConsultationTitle = GetConsultationTitle(comments, questions);
			AppendTitleRow(sheetData, ConsultationTitle);

			AppendHeaderRow(sheetData);

			AppendDataRow(sheetData, comments, answers, questions);

			worksheetPart.Worksheet.Save();

			// Close the document.
			spreadsheetDocument.Close();
		}

		private string GetConsultationTitle(IEnumerable<Models.Comment> comments, IEnumerable<Question> questions)
		{
			if (comments.Count() > 0)
				return _exportService.GetConsultationName(comments.First().Location);
				
			if (questions.Count() > 0)
				return _exportService.GetConsultationName(questions.First().Location);

			return "";
		}

		private void AppendTitleRow(SheetData sheet, string consultationTitle)
		{
			var titleRow = new Row();

			Cell cell = new Cell();
			cell.DataType = CellValues.String;
			cell.CellValue = new CellValue(consultationTitle + " consultation comments");
			cell.StyleIndex = 3;
			titleRow.AppendChild(cell);

			sheet.AppendChild(titleRow);

			var blankRow = new Row();
			sheet.AppendChild(blankRow);

		}
	}
}
