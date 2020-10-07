import "@nice-digital/wdio-cucumber-steps/lib/given";
import { Given } from "cucumber";

import deleteComments from "../support/action/deleteComments";
import { deleteSubmissionUser } from "../support/action/deleteSubmissionUser";
import { addQuestionsToConsultation } from "../support/action/addQuestionsToConsultation";

Given(/^I delete all comments on the page$/, deleteComments);

Given(/^I comment on a Document$/, () => {
	browser.pause(1000);
	browser.waitForVisible("[data-qa-sel='comment-on-consultation-document']");
	browser.click("[data-qa-sel='comment-on-consultation-document']");
	browser.pause(1000);
	browser.waitForVisible("body [data-qa-sel='comment-box-title']", 10000);
});

Given(/^I comment on a Document again$/, () => {
	browser.pause(1000);
	browser.waitForVisible("[data-qa-sel='comment-on-consultation-document']");
	browser.click("[data-qa-sel='comment-on-consultation-document']");
	browser.pause(1000);
	browser.waitForVisible("body [data-qa-sel='comment-box-title']", 10000);
});

Given(/^I comment on a Chapter$/, () => {
	browser.pause(1000);
	browser.waitForVisible(".document-comment-container");
	browser.pause(1000);
	browser.click(".chapter > .title [data-qa-sel='in-text-comment-button']");
	browser.pause(1000);
	browser.waitForVisible("body [data-qa-sel='comment-box-title']");
	browser.pause(2000);
});

Given(/^I comment on a Section$/, () => {
	browser.pause(1000);
	browser.click("[data-qa-sel='nav-list-item']:nth-of-type(4)");
	browser.waitForVisible(".document-comment-container");
	browser.pause(1000);
	browser.waitForVisible(
		".section:first-of-type > .title [data-qa-sel='in-text-comment-button']"
	);
	browser.pause(1000);
	browser.click(
		".section:first-of-type > .title [data-qa-sel='in-text-comment-button']"
	);
	browser.pause(1000);
	browser.waitForVisible("body [data-qa-sel='comment-box-title']");
});

Given(/^I comment on a Sub-section$/, () => {
	browser.pause(1000);
	browser.waitForVisible(
		".section:first-of-type > [data-qa-sel='in-text-comment-button']"
	);
	browser.click(
		".section:first-of-type > [data-qa-sel='in-text-comment-button']"
	);
	browser.waitForVisible(".document-comment-container");
	browser.pause(1000);
	browser.waitForVisible("body [data-qa-sel='comment-box-title']");
	browser.pause(1000);
});

Given(/^I delete submissions for userid "([^"]*)?"$/, deleteSubmissionUser);

Given(
	/^I add questions to Consultation "([^"]*)?"$/,
	addQuestionsToConsultation
);
