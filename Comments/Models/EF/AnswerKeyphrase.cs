using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Comments.Models
{
	public partial class AnswerKeyPhrase
	{
		public int AnswerKeyPhraseId { get; set; }
		public int AnswerId { get; set; }
		public int KeyPhraseId { get; set; }
		public float Score { get; set; }
	}
}
