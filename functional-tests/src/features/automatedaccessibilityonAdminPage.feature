Feature: Automated accessibility on a Consultation Admin page
   	As a user of consultations
  	We want to be able to check the page is accessible by speech reader software users
 		We want to be able to check each element on the page for accessibility issues

Background:
		Given I open the url "admin"
		When I log into accounts with username "IDAM_EMAIL1" and password "IDAM_PASSWORD"

Scenario: User login to consultation Admin page and check there is no accessibility issues
		# Then the page should have no A accessibility issues
		Then the page should have no AA accessibility issues
