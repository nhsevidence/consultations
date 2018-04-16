﻿using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Comments.Models;
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
            const int locationId = 1;
            const string sourceURI = "/consultations/1/1/introduction";
            await Create_Comment(locationId, sourceURI);
            await Create_Comment(locationId, sourceURI); //duplicate comment. totally valid.
            await Create_Comment(2, sourceURI); //different location id, this should be in the result set
            //await Create_Comment(locationId, sourceURI); //different consultation id, this shouldn't be in the result set
            //await Create_Comment(locationId, sourceURI); //different document id, this shouldn't be in the result set

            // Act
            var response = await _client.GetAsync($"/consultations/api/Comments?sourceURI={WebUtility.UrlEncode(sourceURI)}");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            responseString.ShouldMatchApproved();
            var deserialisedResponse = JsonConvert.DeserializeObject<CommentsAndQuestions>(responseString);
            deserialisedResponse.Comments.Count().ShouldBe(3);
        }

        [Fact]
        public async Task Get_Comments_Feed_Returns_Populated_Feed()
        {
            // Arrange
            ResetDatabase();
            const string sourceURI = "/consultations/1/1/introduction";
            var consultationId = 1;
            var documentId = 2;
            var commentText = Guid.NewGuid().ToString();
            var questionText = Guid.NewGuid().ToString();
            var answerText = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var userService = FakeUserService.Get(isAuthenticated: true, displayName: "Benjamin Button", userId: userId);
            var context = new ConsultationsContext(_options, userService);

            AddCommentsAndQuestionsAndAnswers(sourceURI, commentText, questionText, answerText, userId, context);

            // Act
            var response = await _client.GetAsync($"/consultations/api/Comments?sourceURI={WebUtility.UrlEncode(sourceURI)}");
            //var response = await _client.GetAsync($"/consultations/api/Comments?consultationId={consultationId}&documentId={documentId}&chapterSlug=introduction");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            // Assert
            //responseString.ShouldMatchApproved();
            //    //todo: get the below all working:

            //    //var deserialisedResponse = JsonConvert.DeserializeObject<CommentsAndQuestions>(responseString);
            //    //deserialisedResponse.Comments.Single().CommentText.ShouldBe(commentText);
            //    //deserialisedResponse.Questions.Single().QuestionText.ShouldBe(questionText);
            //    //deserialisedResponse.Questions.Single().Answers.Single().AnswerText.ShouldBe(answerText);
        }
    }
}
