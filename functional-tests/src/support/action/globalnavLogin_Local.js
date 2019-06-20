import login from "./login";

module.exports = (username, password) => {
	// If you are already logged in
	if (browser.getCookie("__nrpa_2.2")) {
		return;
	}

	browser.waitForExist("header[aria-label='Site header']");
	var headerMenuShown = browser.isVisible("#header-menu-button");
	if (headerMenuShown) {
		browser.click("#header-menu-button");
		browser.click("#header-menu a[href*='accounts.nice.org.uk/signin']");
	} else {
		browser.click("#header-menu-button+* a[href*='accounts.nice.org.uk/signin']");
	}
	login(username, password);
};
