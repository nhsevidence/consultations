using System;
using System.Collections.Generic;
using System.Linq;
using Comments.Common;
using Comments.Models;
using Comments.Services;
using Comments.Test.Infrastructure;
using Comments.ViewModels;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace Comments.Test.UnitTests
{
    public class SubmitServiceTests : Infrastructure.TestBase
	{
		[Fact]
		public void Update_Comment_When_Submitted()
		{
			//Arrange
			ResetDatabase();
			_context.Database.EnsureCreated();

			var userId = Guid.NewGuid();
			var sourceURI = "consultations://./consultation/1/document/1/chapter/introduction";

			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var authenticateService = new FakeAuthenticateService(authenticated: true);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);
			var submitService = new SubmitService(consultationContext, userService, _consultationService);
			var commentService = new CommentService(consultationContext, userService, authenticateService, _consultationService);

			var locationId = AddLocation(sourceURI, _context);
			var commentId = AddComment(locationId, "Comment text", false, userId, (int)StatusName.Draft, _context);

			//Act
			var commentsAndQuestions = commentService.GetCommentsAndQuestions(sourceURI, true);
			var result = submitService.SubmitCommentsAndAnswers(new CommentsAndAnswers(commentsAndQuestions.Comments, new List<ViewModels.Answer>()));

			var comment = commentService.GetComment(commentId);

			var commentsSubmissionData = _context.SubmissionComment.Where(s => s.CommentId == commentId)
				.Include(s => s.Submission).First();

			//Assert
			result.rowsUpdated.ShouldBe(3);
			comment.comment.StatusId.ShouldBe((int)StatusName.Submitted);
			comment.comment.Status.StatusId.ShouldBe((int)StatusName.Submitted);
			commentsSubmissionData.CommentId.ShouldBe(commentId);
			commentsSubmissionData.Submission.SubmissionByUserId.ShouldBe(userId);
		}

		[Fact]
		public void Update_Answer_When_Submitted()
		{
			//Arrange
			ResetDatabase();
			_context.Database.EnsureCreated();

			var userId = Guid.NewGuid();
			var sourceURI = "consultations://./consultation/1/document/1/chapter/introduction";

			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var authenticateService = new FakeAuthenticateService(authenticated: true);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);
			var submitService = new SubmitService(consultationContext, userService, _consultationService);
			var commentService = new CommentService(consultationContext, userService, authenticateService, _consultationService);
			var answerService = new AnswerService(consultationContext, userService);

			var locationId = AddLocation(sourceURI, _context);
			var questionTypeId = AddQuestionType("Question Type", false, true);
			var questionId = AddQuestion(locationId, questionTypeId, "Question Text");
			var answerId = AddAnswer(questionId, userId, "Answer Text");

			//Act
			var commentsAndQuestions = commentService.GetCommentsAndQuestions(sourceURI, true);
			var result = submitService.SubmitCommentsAndAnswers(new CommentsAndAnswers(new List<ViewModels.Comment>(), commentsAndQuestions.Questions.First().Answers));

			var answer = answerService.GetAnswer(answerId);

			var answerSubmissionData = _context.SubmissionAnswer.Where(s => s.AnswerId == answerId)
				.Include(s => s.Submission).First();

			//Assert
			result.rowsUpdated.ShouldBe(3);
			answer.answer.StatusId.ShouldBe((int)StatusName.Submitted);
			answer.answer.Status.StatusId.ShouldBe((int)StatusName.Submitted);
			answerSubmissionData.AnswerId.ShouldBe(answerId);
			answerSubmissionData.Submission.SubmissionByUserId.ShouldBe(userId);
		}

		[Fact]
		public void Get_Users_Submission()
		{
			//Arrange
			ResetDatabase();
			_context.Database.EnsureCreated();
			var sourceURI = "consultations://./consultation/1/document/1/chapter/introduction";
			var userId = Guid.NewGuid();
			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);

			AddSubmittedCommentsAndAnswers(sourceURI, "Comment Text", "Question Text", "Answer Text", userId, consultationContext);

			var sourceURIs = new List<string>
			{
				ConsultationsUri.ConvertToConsultationsUri("/1/0/Review", CommentOn.Consultation)
			};

			//Act
			var results = consultationContext.GetAllCommentsAndQuestionsForDocument(sourceURIs, true);

			//Assert
			results.First().Comment.First().SubmissionComment.Count.ShouldBe(1);
			results.First().Comment.First().Status.ShouldNotBeNull();
		}

		[Theory]
		[InlineData(null, false)]
		[InlineData("", false)]
		[InlineData("  ", false)]
		[InlineData("consultations://./consultation/1/document/1/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/2/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/1/chapter/anotherchaptertitle", true)]
		[InlineData("consultations://./consultation/1/document/1", true)]
		[InlineData("consultations://./consultation/1", true)]
		[InlineData("consultations://./consultation/2", false)]
		public void Has_Submitted_Comments_Or_Answers_For_Chapter_SourceURI(string consultationSourceURI, bool expectedResult)
		{
			//Arrange
			var userId = Guid.NewGuid();
			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);
			var consultationService = new ConsultationService(consultationContext, null, null, userService);
			//var submitService = new SubmitService(consultationContext, userService, _consultationService);
			AddSubmittedCommentsAndAnswers("consultations://./consultation/1/document/1/chapter/introduction", "Comment Text", "Question Text", "Answer Text", userId, consultationContext);

			//Act
			var actualResult = consultationService.HasSubmittedCommentsOrQuestions(consultationSourceURI, userId);
			
			//Assert
			actualResult.ShouldBe(expectedResult);
		}

		[Theory]
		[InlineData(null, false)]
		[InlineData("", false)]
		[InlineData("  ", false)]
		[InlineData("consultations://./consultation/1/document/1/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/2/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/1/chapter/anotherchaptertitle", true)]
		[InlineData("consultations://./consultation/1/document/1", true)]
		[InlineData("consultations://./consultation/1", true)]
		[InlineData("consultations://./consultation/2", false)]
		public void Has_Submitted_Comments_Or_Answers_For_Document_SourceURI(string consultationSourceURI, bool expectedResult)
		{
			//Arrange
			var userId = Guid.NewGuid();
			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);
			//var submitService = new SubmitService(consultationContext, userService, _consultationService);
			var consultationService = new ConsultationService(consultationContext, null, null, userService);
			AddSubmittedCommentsAndAnswers("consultations://./consultation/1/document/1", "Comment Text", "Question Text", "Answer Text", userId, consultationContext);

			//Act
			var actualResult = consultationService.HasSubmittedCommentsOrQuestions(consultationSourceURI, userId);

			//Assert
			actualResult.ShouldBe(expectedResult);
		}

		[Theory]
		[InlineData(null, false)]
		[InlineData("", false)]
		[InlineData("  ", false)]
		[InlineData("consultations://./consultation/1/document/1/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/2/chapter/introduction", true)]
		[InlineData("consultations://./consultation/1/document/1/chapter/anotherchaptertitle", true)]
		[InlineData("consultations://./consultation/1/document/1", true)]
		[InlineData("consultations://./consultation/1", true)]
		[InlineData("consultations://./consultation/2", false)]
		public void Has_Submitted_Comments_Or_Answers_For_Consultation_SourceURI(string consultationSourceURI, bool expectedResult)
		{
			//Arrange
			var userId = Guid.NewGuid();
			var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
			var consultationContext = new ConsultationsContext(_options, userService, _fakeEncryption);
			var consultationService = new ConsultationService(consultationContext, null, null, userService);
			//var submitService = new SubmitService(consultationContext, userService, _consultationService);
			AddSubmittedCommentsAndAnswers("consultations://./consultation/1", "Comment Text", "Question Text", "Answer Text", userId, consultationContext);

			//Act
			var actualResult = consultationService.HasSubmittedCommentsOrQuestions(consultationSourceURI, userId);

			//Assert
			actualResult.ShouldBe(expectedResult);
		}
	}
}
