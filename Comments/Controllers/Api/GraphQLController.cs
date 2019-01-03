using System;
using System.Threading.Tasks;
using Comments.Models;
using GraphQL;
using GraphQL.Types;
using Microsoft.AspNetCore.Mvc;

namespace Comments.Controllers.Api
{
	[ApiExplorerSettings(IgnoreApi = true)]
	[Route("/api/[controller]")]
	public class GraphQLController : Controller
	{
		private readonly IDocumentExecuter _documentExecuter;
		private readonly ISchema _schema;

		// GET
		public GraphQLController(ISchema schema, IDocumentExecuter documentExecuter)
		{
			_schema = schema;
			_documentExecuter = documentExecuter;
		}

		[HttpPost]
		public async Task<IActionResult> Post([FromBody] GraphQLQuery query)
		{
			if (query == null) { throw new ArgumentNullException(nameof(query)); }
			var inputs = query.Variables.ToInputs();
			var executionOptions = new ExecutionOptions
			{
				Schema = _schema,
				Query = query.Query,
				Inputs = inputs,
			};

			var result = await _documentExecuter.ExecuteAsync(executionOptions).ConfigureAwait(false);

			if (result.Errors?.Count > 0)
			{
				return BadRequest(result);
			}

			return Ok(result);
		}
	}
}
