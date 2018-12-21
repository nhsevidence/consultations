// @flow

// eslint-disable-next-line
// See https://medium.com/@cereallarceny/server-side-rendering-with-create-react-app-fiber-react-router-v4-helmet-redux-and-thunk-275cb25ca972
// and https://github.com/cereallarceny/cra-ssr/blob/master/server/universal.js

import { createServerRenderer } from "aspnet-prerendering";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Helmet } from "react-helmet";
import { processHtml } from "./html-processor";
import App from "./../components/App/App";
import { Error } from "./../components/Error/Error";

const BaseUrlRelative: string = "/consultations";

// Returns a script tag with the stringified data for loading on the client
const getPreloadedDataHtml = (data): string => {
	let scriptTag: string = `<script>window.__PRELOADED__=${JSON.stringify(data)};</script>`;

	// Wrap new lines in dev mode so it's easier to scan over html source for debugging purposes
	if (process.env.NODE_ENV === "development") {
		scriptTag = `\r\n\r\n${scriptTag}\r\n\r\n`;
	}

	return scriptTag;
};

const getAnalyticsGlobalsData = (data): string => {
	let scriptTag: string = `<script>window.analyticsGlobals=${JSON.stringify(data)};</script>`;

	// Wrap new lines in dev mode so it's easier to scan over html source for debugging purposes
	if (process.env.NODE_ENV === "development") {
		scriptTag = `\r\n\r\n${scriptTag}\r\n\r\n`;
	}

	return scriptTag;
};

// Returns a promise that resolves to an object containing the HTML to be rendered.
// The params contains properties e.g.
// { location: { protocol, slashes, auth, host, port, hostname, hash, search, query: {}, pathname, path, href },
// origin, url, baseUrl, absoluteUrl, domainTasks: { }, data: { originalHtml: "", ... }
// The `params.data` property contains properties set in `SupplyData` in Startup.cs.
export const serverRenderer = (params): Promise => {
	return new Promise((resolve, reject) => {
		// Context object that Routes can use to pass properties 'out'. Primarily used for status code.
		// eslint-disable-next-line
		// See https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/StaticRouter.md#context-object
		// E.g.:
		//  <Route render={({ staticContext }) => {
		//      if (staticContext) staticContext.status = 404;
		//      return null; }} />
		let staticContext = {
			preload: {
				data: {
					cookies: params.data.cookies,
					isAuthorised: params.data.isAuthorised,
					displayName: params.data.displayName,
					signInURL: params.data.signInURL,
					registerURL: params.data.registerURL,
					requestURL: params.data.requestURL,
				}, // Key value pairs of preloaded data sets
				loaders: [], // List of promises where we track preloading data
			},
			analyticsGlobals: {},
			baseUrl: params.origin + BaseUrlRelative,
			// Base url is used for 'server' ajax requests so we can hit the .NET instance from the Node process
		};

		let app = (
			<StaticRouter basename={BaseUrlRelative} location={params.url} context={staticContext}>
				<App basename={BaseUrlRelative}/>
			</StaticRouter>);

		let rootContent = "";
		try {
			// First render: this trigger any data preloaders to fire
			rootContent = renderToString(app);
		}
		catch (e) {
			reject(e);
			return;
		}

		// Wait for all preloaders to have loaded before re-rendering the app
		Promise.all(staticContext.preload.loaders).then(() => {

			try {
				// Second render now that all the data preloaders have finished so we can render with data on the server
				rootContent = renderToString(app);
			}
			catch (e) {
				reject(e);
				return;
			}
			const helmet = Helmet.renderStatic();
			const html = processHtml(params.data.originalHtml,
				{
					htmlAttributes: helmet.htmlAttributes.toString(),
					bodyAttributes: helmet.bodyAttributes.toString(),
					rootContent: rootContent,
					title: helmet.title.toString(),
					metas: helmet.meta.toString(),
					links: helmet.link.toString(),
					analyticsGlobals: getAnalyticsGlobalsData(staticContext.analyticsGlobals),
					scripts: getPreloadedDataHtml(staticContext.preload.data) + helmet.script.toString(),
					accountsEnvironment: params.data.accountsEnvironment,
				});

			resolve({html: html, statusCode: staticContext.status || 200});

		}).catch((e) => {
			if (process.env.NODE_ENV === "production") {
				// In production, rejecting the promise shows a standard dotnet 500 server error page
				reject(e);
				return;
			}
			// In development show a nice YSOD to devs with the error message
			const error = <Error error={e}/>;
			let html = params.data.originalHtml;
			if (typeof(html) !== "undefined"){
				html = processHtml(params.data.originalHtml,
					{
						rootContent: renderToString(error),
						accountsEnvironment: params.data.accountsEnvironment,
					});
			} else{
				html = renderToString(error);
			}
			resolve({html: html, statusCode: staticContext.status || 500});
		});
	});
};

// `createServerRenderer` is what the DotNetCore SpaServices requires for SSR
export default createServerRenderer(serverRenderer);
