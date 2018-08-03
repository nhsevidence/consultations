using System.Collections.Generic;

namespace Comments.ViewModels
{
    public class TopicListFilterGroup
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public IList<TopicListFilterOption> Options { get; set; }
    }
}