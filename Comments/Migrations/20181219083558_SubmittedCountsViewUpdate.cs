using Microsoft.EntityFrameworkCore.Migrations;

namespace Comments.Migrations
{
    public partial class SubmittedCountsViewUpdate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
	        migrationBuilder.Sql($@"
				ALTER VIEW {MigrationConstants.Views.SubmittedCommentAndAnswerCount} AS 

				SELECT	SUBSTRING(l.SourceURI, 0, CASE WHEN (PATINDEX('%document%', l.SourceURI) = 0) THEN LEN(l.SourceURI) + 1 ELSE PATINDEX('%document%', l.SourceURI) - 1 END) AS SourceURI, 
						COUNT(DISTINCT(sc.SubmissionID)) AS CommentCount,
						COUNT(DISTINCT(sa.SubmissionID)) AS AnswerCount,
						COUNT(DISTINCT(s.SubmissionID)) AS TotalCount

				FROM [Location] l

				LEFT JOIN Comment c ON l.LocationID = c.LocationID AND c.IsDeleted = CAST(0 AS bit)
				LEFT JOIN SubmissionComment sc ON c.CommentID = sc.CommentID

				LEFT JOIN Question q ON l.LocationID = q.LocationID AND q.IsDeleted = CAST(0 AS bit)
				LEFT JOIN Answer a ON q.QuestionID = a.QuestionID AND a.IsDeleted = CAST(0 AS bit)
				LEFT JOIN SubmissionAnswer sa ON a.AnswerID = sa.AnswerID

				LEFT JOIN Submission s ON s.SubmissionID = sc.SubmissionID OR s.SubmissionID = sa.SubmissionID

				GROUP BY	SUBSTRING(l.SourceURI, 0, CASE WHEN (PATINDEX('%document%', l.SourceURI) = 0) THEN LEN(l.SourceURI) + 1 ELSE PATINDEX('%document%', l.SourceURI) - 1 END)
			");
		}

        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
