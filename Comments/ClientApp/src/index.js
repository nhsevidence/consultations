import "core-js/es6/map";
import "core-js/es6/set";
import "core-js/fn/array/includes";
import "core-js/es6/regexp";
import "raf/polyfill";
import "classlist-polyfill";

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

// import registerServiceWorker from "./registerServiceWorker";

import App from "./components/App/App";

const baseUrl = document.getElementsByTagName("base")[0].getAttribute("href").replace(/\/$/, "");
const rootElement = document.getElementById("root");

ReactDOM.hydrate(
	<BrowserRouter basename={baseUrl}>
		<App basename={baseUrl}/>
	</BrowserRouter>,
	rootElement
);

// registerServiceWorker();
