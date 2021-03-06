Feature: The list of consultations is reduced when user searches by title
	As a user of consultations
	We want to be able to filter the consultations list by Title

	Background:
		Given I open the url "admin"
		When I log into the admin page with username "IDAM_EMAIL1" and password "IDAM_PASSWORD"

	Scenario: User can search for a consultation by its title
		Given I expect the result list count contains "Showing 1 to 25"
		When I add the indev GID "Dec08" to the filter
		Then I expect the result list count contains "Showing 2 consultations"
		When I click on the cancel filter
		Then I expect the result list count contains "Showing 1 to 25"
