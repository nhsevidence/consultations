using Comments.Services;
using System;

namespace Comments.Test.Infrastructure
{
    public static class FakeUserService
    {
        public static IUserService Get(bool isAuthenticated, string displayName = null, string userId = null, TestUserType testUserType  = TestUserType.NotAuthenticated, bool addRoleClaim = true, int? organisationUserId = null)
        {
            return new UserService(FakeHttpContextAccessor.Get(isAuthenticated, displayName, userId, testUserType, addRoleClaim, organisationUserId), new FakeAPIService());
        }
    }
}
