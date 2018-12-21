using Comments.Test.Infrastructure;
using Shouldly;
using System;
using System.Collections.Generic;
using Comments.Services;
using Xunit;
using UserInfo = NICE.Auth.NetCore.Models.UserInfo;

namespace Comments.Test.UnitTests
{
    public class UserServiceTests : TestBase
    {
        [Fact]
        public void User_Can_be_created_from_context_authenticated()
        {
            // Arrange          
            var displayName = "Benjamin Button";
            var userId = Guid.NewGuid();
            var userService = FakeUserService.Get(true, displayName, userId);

            // Act
            var currentUser = userService.GetCurrentUser();

            //Assert
            currentUser.IsAuthorised.ShouldBe(true);
            currentUser.DisplayName.ShouldBe(displayName);
            currentUser.UserId.ShouldBe(userId);
        }

        [Fact]
        public void User_returns_null_when_not_authenticated()
        {
            // Arrange          
            var userService = FakeUserService.Get(false, null, null);

            // Act
            var currentUser = userService.GetCurrentUser();

            //Assert
            currentUser.ShouldNotBeNull();
            currentUser.IsAuthorised.ShouldBe(false);
            currentUser.DisplayName.ShouldBeNull();
            currentUser.UserId.ShouldBeNull();
        }

	    [Theory]
		[InlineData("1594B24E-2672-4509-9037-831775D39DD9", "Tyler Durden", "1594B24E-2672-4509-9037-831775D39DD9", "Tyler Durden")]
	    [InlineData("1594B24E-2672-4509-9037-831775D39DD9", "Tyler Durden", "00000000-0000-0000-0000-000000000000", null)]
		public void GetDisplayNameForUserId_Returns_Correct_Display_Name(string userIdToInsert, string displayNameToInsert, string userIdToQueryBy, string expectedDisplayName)
	    {
			// Arrange
			var userService = new UserService(null, new FakeAuthenticateService(new Dictionary<Guid, UserInfo>{{ Guid.Parse(userIdToInsert), new UserInfo { DisplayName = displayNameToInsert } } }));

			// Act
		    var actualDisplayName = userService.GetDisplayNameForUserId(Guid.Parse(userIdToQueryBy));

			// Assert
			actualDisplayName.ShouldBe(expectedDisplayName);
	    }

	    [Fact]
	    public void GetDisplayNamesForMultipleUserIds_Returns_Multiple_Display_Names()
	    {
		    // Arrange
		    var tylersUserId = Guid.Parse("1594B24E-2672-4509-9037-831775D39DD9");
		    var marlasUserId = Guid.Parse("13FED6F9-83A0-469E-BAA6-3CFC67A0713F");
			var userService = new UserService(null, new FakeAuthenticateService(new Dictionary<Guid, UserInfo>
		    {
			    { tylersUserId, new UserInfo { DisplayName = "Tyler Durden" }},
				{ Guid.NewGuid(), new UserInfo { DisplayName ="Robert Paulson" }},
				{ marlasUserId, new UserInfo { DisplayName = "Marla Singer" }}
			}));
		    var angelFaceUserId = Guid.NewGuid();

			// Act
			var displayNamesReturned = userService.GetDisplayNamesForMultipleUserIds(new List<Guid>(){ tylersUserId, marlasUserId, angelFaceUserId });

		    // Assert
		    displayNamesReturned.Count.ShouldBe(3);
			displayNamesReturned[tylersUserId].ShouldBe("Tyler Durden");
		    displayNamesReturned[marlasUserId].ShouldBe("Marla Singer");
		    displayNamesReturned[angelFaceUserId].ShouldBeNull();
		}

	    [Fact]
	    public void GetUserRolesCopesWithNoAuthenticatedUser()
	    {
			//Arrange
			var httpContextAccessor = FakeHttpContextAccessor.Get(false);
			var userService = new UserService(httpContextAccessor, null);

			//Act
		    var roles = userService.GetUserRoles();

			//Assert
			roles.Count.ShouldBe(0);
		}

	    [Theory]
	    [InlineData("1594B24E-2672-4509-9037-831775D39DD9", "Tyler Durden", "T.Durden@email.com", "1594B24E-2672-4509-9037-831775D39DD9", "Tyler Durden", "t.Durden@email.com")]
	    public void GetEmailForUserId_Returns_Correct_EmailAddress(string userIdToInsert, string displayNameToInsert, string emailToInsert, string userIdToQueryBy, string expectedDisplayName, string expectedEmail)
	    {
		    // Arrange
		    var userService = new UserService(null, new FakeAuthenticateService(new Dictionary<Guid, UserInfo> { { Guid.Parse(userIdToInsert), new UserInfo { DisplayName = displayNameToInsert, EmailAddress = emailToInsert } } }));

		    // Act
		    var actualDisplayName = userService.GetEmailForUserId(Guid.Parse(userIdToQueryBy));

		    // Assert
		    actualDisplayName.ShouldBe(emailToInsert);
	    }
	}
}
