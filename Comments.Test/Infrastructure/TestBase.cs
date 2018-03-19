﻿using Comments.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Net.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using NICE.Feeds;
using NICE.Feeds.Configuration;
using NICE.Feeds.Tests.Infrastructure;

namespace Comments.Test.Infrastructure
{
    public class TestBase
    {
        protected const string DatabaseName = "testDB";
        protected readonly DbContextOptions<ConsultationsContext> _options;

        protected readonly TestServer _server;
        protected readonly HttpClient _client;
        protected IFeedConfig _feedConfig;

        protected readonly Feed FeedToUse = Feed.ConsultationCommentsListDetailMulitpleDoc;
        public TestBase(Feed feed) : this()
        {
            FeedToUse = feed;
        }


        public TestBase()
        {
            // Arrange
            _options = new DbContextOptionsBuilder<ConsultationsContext>()
                    .UseInMemoryDatabase(databaseName: DatabaseName)
                    .Options;

            var builder = new WebHostBuilder()
                .UseContentRoot("../../../../Comments")
                .ConfigureServices(services =>
                {
                    services.AddEntityFrameworkSqlite();
                    services.AddDbContext<ConsultationsContext>(options => 
                        options.UseInMemoryDatabase(DatabaseName
                            //, optionsBuilder => { optionsBuilder.use }
                            ));
                    services.TryAddSingleton<ISeriLogger, FakeSerilogger>();
                    //services.TryAddTransient<IFeedReaderService, FeedReader>();
                   services.TryAddTransient<IFeedReaderService>(provider => new FeedReader(FeedToUse));;
                })
                .Configure(app =>
                {
                    app.UseStaticFiles();

                    app.Use((context, next) =>
                    {
                        var httpRequestFeature = context.Features.Get<IHttpRequestFeature>();

                        if (httpRequestFeature != null && string.IsNullOrEmpty(httpRequestFeature.RawTarget))
                            httpRequestFeature.RawTarget = httpRequestFeature.Path;

                        return next();
                    });

                })
                .UseEnvironment("Production")
                .UseStartup(typeof(Startup));
            _server = new TestServer(builder);
            _client = _server.CreateClient();

            _feedConfig = new FeedConfig()
            {
                AppCacheTimeSeconds = 30,
                ApiKey = "api key goes here",
                BasePath = new Uri("http://test-indev.nice.org.uk"),
                Chapter = "consultation-comments/{0}/document/{1}/chapter-slug/{2}",
                Detail = "consultation-comments/{0}",
                List = "consultation-comments-list"
            };
        }

        #region database stuff

        protected void ResetDatabase()
        {
            using (var context = new ConsultationsContext(_options))
            {
                context.Database.EnsureDeleted();
            }
        }
        protected int AddLocation(string sourceURI)
        {
            var location = new Location(sourceURI, null, null, null, null, null, null, null, null);
            using (var context = new ConsultationsContext(_options))
            {
                context.Location.Add(location);
                context.SaveChanges();
            }
            return location.LocationId;
        }
        protected int AddComment(int locationId, string commentText, bool isDeleted)
        {
            var comment = new Comment(locationId, Guid.Empty, commentText, Guid.Empty, location: null);
            comment.IsDeleted = isDeleted;
            using (var context = new ConsultationsContext(_options))
            {
                context.Comment.Add(comment);
                context.SaveChanges();
            }
            return comment.CommentId;
        }
        protected int AddQuestionType(string description, bool hasBooleanAnswer, bool hasTextAnswer, int questionTypeId = 1)
        {
            var questionType = new QuestionType(description, hasTextAnswer, hasBooleanAnswer, null);
            using (var context = new ConsultationsContext(_options))
            {
                context.QuestionType.Add(questionType);
                context.SaveChanges();
            }
            return questionType.QuestionTypeId;
        }
        protected int AddQuestion(int locationId, int questionTypeId, string questionText, int questionId = 1)
        {
            var question = new Question(locationId, questionText, questionTypeId, null, null, null, null);
            using (var context = new ConsultationsContext(_options))
            {
                context.Question.Add(question);
                context.SaveChanges();
            }
            return question.QuestionId;
        }
        protected int AddAnswer(int questionId, Guid userId, string answerText)
        {
            var answer = new Answer(questionId, userId, answerText, null, null);
            using (var context = new ConsultationsContext(_options))
            {
                answer.LastModifiedDate = DateTime.Now;
                context.Answer.Add(answer);
                context.SaveChanges();
            }
            return answer.AnswerId;
        }
        protected void AddCommentsAndQuestionsAndAnswers(string sourceURI, string commentText, string questionText, string answerText)
        {
            var locationId = AddLocation(sourceURI);
            AddComment(locationId, commentText, isDeleted: false);
            var questionTypeId = AddQuestionType(description: "text", hasBooleanAnswer: false, hasTextAnswer: true);
            var questionId = AddQuestion(locationId, questionTypeId, questionText);
            AddAnswer(questionId, Guid.Empty, answerText);
        }

        #endregion database stuff

        #region Helpers

        protected int RandomNumber()
        {
            var rnd = new Random();
            return rnd.Next(1, int.MaxValue);
        }

        #endregion Helpers
    }

    internal class FakeSerilogger : ISeriLogger
    {
        public void Configure(ILoggerFactory loggerFactory, IConfiguration configuration, IApplicationLifetime appLifetime,
            IHostingEnvironment env)
        {}
    }
}
