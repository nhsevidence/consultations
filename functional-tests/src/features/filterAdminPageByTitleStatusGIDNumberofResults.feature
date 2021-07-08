Feature: The list of consultations is reduced when user filter by title , status, number of result and InDev GID ID
	As a user of consultations
	We want to be able to filter the consultations list by Title, Status, number of results displayed on page and InDev GID ID

	Background:
		Given I open the url "admin"
		When I log into the admin page with username "IDAM_EMAIL1" and password "IDAM_PASSWORD"

	Scenario: User can filter for a consultation by its title, InDev GID ID, number of results and status
		Given I expect the result list count contains "Showing 1 to 25"
		When I add the indev GID "Dec08" to the filter
		Then I expect the result list count contains "Showing 2 consultations"
		When I click on the cancel filter
		Then I expect the result list count contains "Showing 1 to 25"
		When I add the indev GID "GID-TA10269" to the filter
		Then I expect the result list count contains "Showing 1 consultation"
		When I click on the cancel filter
		Then I expect the result list count contains "Showing 1 to 25"
		When I change the number of results on the page by selecting index "1"
		Then I expect the result list count contains "Showing 1 to 50"
		When I change the number of results on the page by selecting index "2"
		Then I expect all results are displayed
		Given I select open and closed status filter
		Then I expect all results are displayed
