// We use babel register so we can load ES6 code on the server without
// having to have an extra build step ie through webpack.

require("@babel/register")({
	root: __dirname,
	rootMode: "upward"
});

require("ignore-styles");

module.exports = require("./renderer");
