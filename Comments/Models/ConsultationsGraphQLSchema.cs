using GraphQL;
using GraphQL.Types;

namespace Comments.Models
{
    public class ConsultationsGraphQLSchema : Schema
    {
        public ConsultationsGraphQLSchema(IDependencyResolver resolver): base(resolver)
        {
            Query = resolver.Resolve<ConsultationsGraphQLQuery>();
        }
    }
}


