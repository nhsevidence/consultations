module.exports = (username, password) => {
	browser.waitForVisible("body #Email", 10000);
	browser.setValue("input[name='Email']", process.env[username]);
	browser.setValue("input[name='Password']", process.env[password]);
	browser.submitForm("input[name='Email']");
};
