using NICE.Identity.Authentication.Sdk.API;
using NICE.Identity.Authentication.Sdk.Domain;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace Comments.Test.Infrastructure
{
	public class FakeAPIService : IAPIService
    {
	    private readonly IEnumerable<UserDetails> _usersToFind;
	    private readonly Dictionary<string, IEnumerable<string>> _rolesToFind;

	    public FakeAPIService(IEnumerable<UserDetails> usersToFind = null, Dictionary<string, IEnumerable<string>> rolesToFind = null)
	    {
		    _usersToFind = usersToFind;
		    _rolesToFind = rolesToFind;
	    }

	    public Task<IEnumerable<UserDetails>> FindUsers(IEnumerable<string> nameIdentifiers, HttpClient httpClient = null)
	    {
			return new Task<IEnumerable<UserDetails>>(() => _usersToFind ?? new List<UserDetails>());
	    }

	    public Task<Dictionary<string, IEnumerable<string>>> FindRoles(IEnumerable<string> nameIdentifiers, string host, HttpClient httpClient = null)
	    {
		    return new Task<Dictionary<string, IEnumerable<string>>>(() => _rolesToFind ?? new Dictionary<string, IEnumerable<string>>());
	    }
    }
}
