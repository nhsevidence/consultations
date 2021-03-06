import tophatLogin from "@nice-digital/wdio-cucumber-steps/lib/support/action/tophatLogIn";
import waitFor from "@nice-digital/wdio-cucumber-steps/lib/support/action/waitFor";
import selectors from "../selectors";

export const Login = (username, password) => {
	browser.refresh();
	tophatLogin(username, password);
	browser.pause(2000);
	waitFor(".page-header", 3000);
	browser.pause(2000);
};
