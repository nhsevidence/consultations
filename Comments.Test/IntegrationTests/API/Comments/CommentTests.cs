﻿using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Comments.Models;
using Comments.Services;
using Comments.Test.Infrastructure;
using Comments.ViewModels;
using Newtonsoft.Json;
using Shouldly;
using Xunit;
using Microsoft.AspNetCore.WebUtilities;

namespace Comments.Test.IntegrationTests.API.Comments
{
    public class CommentTests : TestBase
    {
        [Fact]
        public async Task Get_Comments_Feed_ReturnsEmptyFeed()
        {
            //Arrange (in the base constructor for this one.)

            // Act
            var response = await _client.GetAsync("/consultations/api/Comments?sourceURI=a-url-with-no-comments-associated");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            responseString.ShouldMatchApproved();
        }

        [Theory]
        [InlineData(1, null)]
        [InlineData(1, "/some-url")]
        [InlineData(int.MaxValue, null)]
        [InlineData(int.MaxValue, "/some-url")]
        public async Task Create_Comment(int locationId, string sourceURI)
        {
            //Arrange
            var comment = new ViewModels.Comment(locationId, sourceURI, null, null, null, null, null, null, 0, DateTime.Now, Guid.Empty, "comment text");
            var content = new StringContent(JsonConvert.SerializeObject(comment), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/consultations/api/Comment", content);
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.ShouldBe(HttpStatusCode.Created);
            var deserialisedComment = JsonConvert.DeserializeObject<ViewModels.Comment>(responseString);
            deserialisedComment.CommentId.ShouldBeGreaterThan(0);
        }

        [Fact]
        public async Task Insert_Multiple_Comments_And_Read_Them()
        {
            //Arrange
            ResetDatabase();
            string sourceURI = "/consultations/1/1/introduction";

            var locationId = AddLocation(sourceURI);
            AddComment(locationId, "comment text", false, Guid.Empty);
            AddComment(locationId, "comment text", false, Guid.Empty); //duplicate comment. totally valid.

            locationId = AddLocation(sourceURI);
            AddComment(locationId, "comment text", false, Guid.Empty); //different location id, same sourceURI, this should be in the result set
            
            locationId = AddLocation("/consultations/2/1/introduction");
            AddComment(locationId, "comment text", false, Guid.Empty); //different consultation id, this shouldn't be in the result set
            
            locationId = AddLocation("/consultations/1/2/introduction");
            AddComment(locationId, "comment text", false, Guid.Empty); //different document id, this shouldn't be in the result set
            
            // Act
            var response = await _client.GetAsync($"/consultations/api/Comments?sourceURI={WebUtility.UrlEncode(sourceURI)}");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            responseString.ShouldMatchApproved(new Func<string, string>[]{Scrubbers.ScrubLastModifiedDate});
            var deserialisedResponse = JsonConvert.DeserializeObject<CommentsAndQuestions>(responseString);
            deserialisedResponse.Comments.Count().ShouldBe(3);
        }

        [Fact]
        public async Task Get_Comments_Feed_Returns_Populated_Feed()
        {
            // Arrange
            ResetDatabase();
            const string sourceURI = "/consultations/1/2/introduction";
            var commentText = Guid.NewGuid().ToString();
            var questionText = Guid.NewGuid().ToString();
            var answerText = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();
           
            AddCommentsAndQuestionsAndAnswers(sourceURI, commentText, questionText, answerText, userId, _context);

            // Act
            var response = await _client.GetAsync($"/consultations/api/Comments?sourceURI={WebUtility.UrlEncode(sourceURI)}");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            var deserialisedResponse = JsonConvert.DeserializeObject<CommentsAndQuestions>(responseString);
            deserialisedResponse.Comments.Single().CommentText.ShouldBe(commentText);
            deserialisedResponse.Questions.Single().QuestionText.ShouldBe(questionText);
            deserialisedResponse.Questions.Single().Answers.Single().AnswerText.ShouldBe(answerText);
        }

        [Fact]
        public async Task Delete_Comment()
        {
            //Arrange
            ResetDatabase();
            const string sourceURI = "/consultations/1/1/introduction";
            var commentText = Guid.NewGuid().ToString();
            var userId = Guid.Empty;
            var locationId = AddLocation(sourceURI);
            var commentId = AddComment(locationId, commentText, false, userId);

            var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
            var commentService = new CommentService(new ConsultationsContext(_options, userService), userService);

            //Act
            var response = await _client.DeleteAsync($"consultations/api/Comment/{commentId}");
            response.EnsureSuccessStatusCode();

            var result = commentService.GetComment(commentId);

            //Assert
            result.validate.NotFound.ShouldBeTrue();
        }

        [Fact]
        public async Task Edit_Comment()
        {
            //Arrange
            ResetDatabase();
            const string sourceURI = "/consultations/1/1/introduction";
            var commentText = Guid.NewGuid().ToString();
            var userId = Guid.Empty;
            var locationId = AddLocation(sourceURI, _context);
            var commentId = AddComment(locationId, commentText, false, userId, _context);

            var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
            var commentService = new CommentService(_context, userService);

            var viewModel = commentService.GetComment(commentId);

            var updatedCommentText = Guid.NewGuid().ToString();
            viewModel.comment.CommentText = updatedCommentText;

            var content = new StringContent(JsonConvert.SerializeObject(viewModel.comment), Encoding.UTF8, "application/json");

            //Act
            var response = await _client.PutAsync($"consultations/api/Comment/{commentId}", content);
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var result = commentService.GetComment(commentId);

            //Assert
            result.comment.CommentText.ShouldBe(updatedCommentText);
        }
    }
}
