Feature: Automated accessibility on a Consultation Review page
   	As a user of consultations
  	We want to be able to check the page is accessible by speech reader software users
 		We want to be able to check each element on the page for accessibility issues

Background:
		Given I open the url "527/2/overview"
		When I log into accounts with username "IDAM_EMAIL1" and password "IDAM_PASSWORD"

 Scenario: User login, comment and navigate to consultation Review page to check there is no accessibility issues
 		Given I comment on a Chapter
		When I add the comment "Accessibility testing" and submit
		Then I expect the comment save button displays "Saved"
		Then I click delete comment
		When I click on the Review Page link
		# Then the page should have no A accessibility issues
		Then the page should have no AA accessibility issues

