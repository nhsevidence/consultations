import clickElement from "@nice-digital/wdio-cucumber-steps/lib/support/action/clickElement";
import waitForVisible from "@nice-digital/wdio-cucumber-steps/lib/support/action/waitForVisible";
import checkContainsText from "@nice-digital/wdio-cucumber-steps/lib/support/check/checkContainsText";
import selectors from "../selectors";

export const submitResponse = () => {
	waitForVisible(selectors.reviewPage.answerNoRepresentOrg);
	clickElement("click", "element", selectors.reviewPage.answerNoRepresentOrg);
	waitForVisible(selectors.reviewPage.answerNoTobacLink);
	clickElement("click", "element", selectors.reviewPage.answerNoTobacLink);
	clickElement("click", "element", selectors.reviewPage.submitResponse);
	waitForVisible(selectors.reviewPage.reviewSubmittedCommentsButton);
	checkContainsText("element", selectors.reviewPage.responseSubmittedHeader, "Response submitted");
};

export default submitResponse;