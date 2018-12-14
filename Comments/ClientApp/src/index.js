import "core-js/es6/map";
import "core-js/es6/set";
import "core-js/fn/array/includes";
import "core-js/es6/regexp";
import "raf/polyfill";
import "classlist-polyfill";
import "ie9-oninput-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "./main.scss";

import App from "./components/App/App";

// Node imports
//$nice-font-base-path: "/consultations/fonts/";

// import "@nice-digital/design-system";
// import "nice-icons";

// import "@nice-digital/design-system/src/stylesheets/nice-design-system.scss";
// import "@nice-digital/icons/dist/_nice-icons.scss";

if (process.env.NODE_ENV === "development") {
	console.log("Attaching react-perf-devtool...");
	const { registerObserver } = require("react-perf-devtool");
	registerObserver();
}

const baseUrl = document.getElementsByTagName("base")[0].getAttribute("href").replace(/\/$/, "");
const rootElement = document.getElementById("root");

ReactDOM.hydrate(
	<BrowserRouter basename={baseUrl}>
		<App basename={baseUrl}/>
	</BrowserRouter>,
	rootElement
);
