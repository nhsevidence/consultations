using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Comments.Configuration;
using Comments.Controllers.Api;
using Comments.Export;
using Comments.Models;
using Comments.Services;
using Comments.Test.Infrastructure;
using Comments.ViewModels;
using NICE.Feeds;
using NICE.Feeds.Models.Indev.List;
using NICE.Feeds.Tests.Infrastructure;
using Shouldly;
using Xunit;
using TestBase = Comments.Test.Infrastructure.TestBase;

namespace Comments.Test.UnitTests
{

	public class ExportBase : TestBase
	{
		protected readonly IFeedService FeedService;
		public ExportBase(TestUserType testUserType) : base(testUserType, Feed.ConsultationCommentsListMultiple)
		{
			var consultationList = new List<ConsultationList>();
			consultationList.Add(new ConsultationList { ConsultationId = 1, AllowedRole = testUserType.ToString() });
			FeedService = new FakeFeedService(consultationList);
		}

		protected void CreateALotOfData(Guid userId)
		{
			int locationId, submissionId, commentId, answerId;

			locationId = AddLocation("consultations://./consultation/1", _context, "001.000.000.000");
			commentId = AddComment(locationId, "Submitted comment", false, userId, (int)StatusName.Submitted, _context);
			submissionId = AddSubmission(userId, _context);
			AddSubmissionComments(submissionId, commentId, _context);

			locationId = AddLocation("consultations://./consultation/1", _context, "001.000.000.000");
			commentId = AddComment(locationId, "Deleted comment", true, userId, (int)StatusName.Submitted, _context);
			submissionId = AddSubmission(userId, _context);
			AddSubmissionComments(submissionId, commentId, _context);

			locationId = AddLocation("consultations://./consultation/1/document/2/chapter/introduction", _context, "001.002.002.000");
			commentId = AddComment(locationId, "Draft comment", false, userId, (int)StatusName.Draft, _context);
			AddSubmissionComments(submissionId, commentId, _context);

			locationId = AddLocation("consultations://./consultation/1/document/1/chapter/chapter-slug", _context, "001.002.000.000");
			commentId = AddComment(locationId, "Another Users Submitted comment", false, Guid.NewGuid(), (int)StatusName.Submitted, _context);
			AddSubmissionComments(submissionId, commentId, _context);

			var questionTypeId = AddQuestionType("My Question Type", false, true, 1, _context);
			locationId = AddLocation("consultations://./consultation/1/document/2/chapter/guidance", _context, "001.002.001.000");
			var questionId = AddQuestion(locationId, questionTypeId, "Question 1", _context);
			answerId = AddAnswer(questionId, userId, "This is a submitted answer", (int)StatusName.Submitted, _context);
			submissionId = AddSubmission(userId, _context);
			AddSubmissionAnswers(submissionId, answerId, _context);
			answerId = AddAnswer(questionId, Guid.NewGuid(), "An answer to the same question by another user", (int)StatusName.Submitted, _context);
			AddSubmissionAnswers(submissionId, answerId, _context);
			answerId = AddAnswer(questionId, userId, "This is a draft answer", (int)StatusName.Draft, _context);
			AddSubmissionAnswers(submissionId, answerId, _context);

			questionTypeId = AddQuestionType("Question Type", false, true, 1, _context);
			locationId = AddLocation("consultations://./consultation/1/document/2/chapter/guidance", _context, "001.002.001.000");
			questionId = AddQuestion(locationId, questionTypeId, "Question 2", _context);
			answerId = AddAnswer(questionId, Guid.NewGuid(), "Another Users answer", (int)StatusName.Draft, _context);
			AddSubmissionAnswers(submissionId, answerId, _context);

			locationId = AddLocation("consultations://./consultation/1/document/2", _context, "001.002.000.000");
			questionTypeId = AddQuestionType("another Question Type", false, true, 1, _context);
			AddQuestion(locationId, questionTypeId, "Without an answer", _context);
		}
	}

	public class ExportToExcelTests : ExportBase
	{
		
	    public ExportToExcelTests() : base(TestUserType.CustomFictionalRole)
	    {
	    }

	    [Fact]
	    public async Task Get_All_Data_For_Consultation()
	    {
		    // Arrange
		    ResetDatabase();
		    AppSettings.ConsultationListConfig = TestAppSettings.GetConsultationListConfig();
			_context.Database.EnsureCreated();
		    var userId = Guid.NewGuid();
		    CreateALotOfData(userId);
			
			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
		    var context = new ConsultationsContext(_options, userService, _fakeEncryption);
			
			var consultationService = new ConsultationService(_context, new FakeFeedService(), new FakeLogger<ConsultationService>(), _fakeUserService);
			var export = new ExportService(context, _fakeUserService, consultationService, _fakeHttpContextAccessor, FeedService);

			//Act
		    var resultTuple = export.GetAllDataForConsulation(1);

			//Assert
			resultTuple.comment.Count().ShouldBe(2);
		    resultTuple.answer.Count().ShouldBe(2);
		    resultTuple.question.Count().ShouldBe(1);
		}

	    [Fact]
	    public async Task Get_Users_Data_For_Consultation()
	    {
		    // Arrange
		    ResetDatabase();
		    _context.Database.EnsureCreated();
		    var userId = Guid.NewGuid();
		    CreateALotOfData(userId);

		    var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
		    var context = new ConsultationsContext(_options, userService, _fakeEncryption);

		    var consultationService = new ConsultationService(_context, new FakeFeedService(), new FakeLogger<ConsultationService>(), _fakeUserService);
		    var export = new ExportService(context, _fakeUserService, consultationService, _fakeHttpContextAccessor, FeedService);

		    //Act
		    var resultTuple = export.GetAllDataForConsulationForCurrentUser(1);

		    //Assert
		    resultTuple.comment.Count().ShouldBe(2);
		    resultTuple.answer.Count().ShouldBe(2);
		    resultTuple.question.Count().ShouldBe(2);
	    }

		[Fact]
	    public void Get_All_Submitted_Comments_For_URI()
	    {
			//Arrange
		    CreateALotOfData(Guid.NewGuid());
			var sourceURI = "consultations://./consultation/1";

			//Act
		    var comments = _context.GetAllSubmittedCommentsForURI(sourceURI);

			//Assert
			comments.Count.ShouldBe(2);
	    }

	    [Fact]
	    public void Get_All_Submitted_Answers_For_URI()
	    {
		    //Arrange
		    CreateALotOfData(Guid.NewGuid());
		    var sourceURI = "consultations://./consultation/1";

		    //Act
		    var answers = _context.GetAllSubmittedAnswersForURI(sourceURI);

			//Assert
		    answers.Count.ShouldBe(2);
	    }

	    [Fact]
	    public void Get_Unanswered_Questions_For_URI()
	    {
		    //Arrange
		    CreateALotOfData(Guid.NewGuid());
		    var sourceURI = "consultations://./consultation/1";

		    //Act
		    var questions = _context.GetUnansweredQuestionsForURI(sourceURI);

			//Assert
		    questions.Count.ShouldBe(1);
	    }

	    [Fact]
	    public void Get_Location_Data()
	    {
		    // Arrange
		    ResetDatabase();
		    _context.Database.EnsureCreated();
			CreateALotOfData(Guid.NewGuid());

			var sourceURI = "consultations://./consultation/1/document/1/chapter/chapter-slug";
			var comments = _context.GetAllSubmittedCommentsForURI(sourceURI);
			var exportService = new ExportService(_context, _fakeUserService, _consultationService, _fakeHttpContextAccessor, FeedService);

			//Act
		    var locationDetails = exportService.GetLocationData(comments.First().Location);

			//Assert
			locationDetails.ConsultationName.ShouldBe("ConsultationName");
			locationDetails.DocumentName.ShouldBe("doc 1");
			locationDetails.ChapterName.ShouldBe("chapter-slug");
	    }

	    [Fact]
	    public void Get_Users_Comments_For_URI()
	    {
		    //Arrange
		    CreateALotOfData(Guid.Empty);
		    var sourceURI = "consultations://./consultation/1";

		    //Act
		    var comments = _context.GetUsersCommentsForURI(sourceURI);

		    //Assert
		    comments.Count.ShouldBe(2);
	    }

	    [Fact]
	    public void Get_Users_Answers_For_URI()
	    {
		    //Arrange
		    CreateALotOfData(Guid.Empty);
		    var sourceURI = "consultations://./consultation/1";

		    //Act
		    var answers = _context.GetUsersAnswersForURI(sourceURI);

		    //Assert
		    answers.Count.ShouldBe(2);
	    }

	    [Fact]
	    public void Get_Users_Unanswered_Questions_For_URI()
	    {
		    //Arrange
		    CreateALotOfData(Guid.Empty);
		    var sourceURI = "consultations://./consultation/1";

		    //Act
		    var questions = _context.GetUsersUnansweredQuestionsForURI(sourceURI);

		    //Assert
		    questions.Count.ShouldBe(2);
	    }		
	}

	public class ExportToExcelTestsForNonAdminUser : ExportBase
	{
		public ExportToExcelTestsForNonAdminUser() : base(TestUserType.Authenticated)
		{
			AppSettings.Feed = TestAppSettings.GetFeedConfig();
		}

		[Fact]
		public async Task None_Admin_Cannot_Create_Spreadsheet()
		{
			// Arrange
			ResetDatabase();
			AppSettings.ConsultationListConfig = TestAppSettings.GetConsultationListConfig();
			_context.Database.EnsureCreated();
			var userId = Guid.NewGuid();
			CreateALotOfData(userId);
			var consultationId = 1;

			// Act
			var response = await _client.GetAsync($"consultations/api/Export/{consultationId}");

			//Assert
			response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
		}
	}
}
