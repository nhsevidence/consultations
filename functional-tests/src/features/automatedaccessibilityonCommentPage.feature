Feature: Automated accessibility on a Consultation Comment Page
   	As a user of consultations
  	We want to be able to check page is accessible by speech reader software users on comment page
 		We want to be able to check each element on the page for accessibility issues

Background:
		Given I open the url "526/8/overview"
		When I log into accounts with username "IDAM_EMAIL1" and password "IDAM_PASSWORD"

Scenario: User login to consultation Comment page and check there is no accessibility issues
	Then the page should have no A accessibility issues
  # Then the page should have no AA accessibility issues
