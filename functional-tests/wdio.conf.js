var path = require("path");

exports.config = {
	// debug: true,
	// execArgv: ['--debug=127.0.0.1:9229'],
	// Use selenium standalone server so we don't have spawn a separate server
	services: ["selenium-standalone"],
	seleniumLogs: "./logs",

	specs: ["./src/features/**/*.feature"],
	exclude: [
		// "./src/features/**/unsavedCommentReviewPage.feature",
		// "./src/features/**/answerQuestion.feature",
		// "./src/features/**/unsavedCommentDocPage.feature",
		// "./src/features/**/submitComments.feature",
		// "./src/features/**/orderingOnReviewPage.feature",
		 "./src/features/**/commentOnSubSection.feature",
		 "./src/features/**/filterAdminPageByGID.feature",
		 "./src/features/**/filterNumberOfResultsOnAdminPage.feature",
		 "./src/features/**/filterYourStatusOnAdminPage.feature",
		// "./src/features/**/commentOnDocument.feature",
		 "./src/features/**/commentOnChapter.feature",
		 "./src/features/**/filterAdminPageByTitle.feature",
		// "./src/features/**/commentOnSection.feature"
	],

	// Assume user has Chrome and Firefox installed.
	capabilities: [
		{
			browserName: "chrome",
		},
		// {
		//   browserName: "firefox"
		//}
	],

	logLevel: "verbose",
	// Change this to verbose if you want more detailed logging in the terminal
	coloredLogs: true,
	screenshotPath: "./errorShots/",
	baseUrl: "https://alpha.nice.org.uk/consultations/",
	reporters: ["spec"],

	// Use BDD with Cucumber
	framework: "cucumber",
	cucumberOpts: {
		compiler: ["js:babel-register"], // Babel so we can use ES6 in tests
		require: [
			"./src/steps/given.js",
			"./src/steps/when.js",
			"./src/steps/then.js",
		],
		tagExpression: "not @pending", // See https://docs.cucumber.io/tag-expressions/
		timeout: 600000,
	},

	// Set up global asssertion libraries
	before: function before() {
		const chai = require("chai");
		global.expect = chai.expect;
		global.assert = chai.assert;
		global.should = chai.should();
	},
};
