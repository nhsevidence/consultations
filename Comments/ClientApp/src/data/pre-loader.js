import { load } from "./loader";
//import stringifyObject from "stringify-object";

// Returns data if it's available or a promise that resolves with the data
// when it's loaded async.
// This assumes the app will be rendered twice on the server: once for
// requests to fire and once when all the data has loaded
const preload = (staticContext, endpoint,  urlParameters = [], query = {}, preloadData = {}, throwOnException = true, method = "GET", headers = {}, content = null, isJson = false) => {
	let data = null;

	// Client - get data from global var
	if (typeof window !== "undefined") {
		if (!window.__PRELOADED__) return null;
		data = window.__PRELOADED__[endpoint];
		delete window.__PRELOADED__[endpoint]; //this is deleted since the preloaded data should only be used on the initial page render and not persist beyond that
		return data;
	}

	// There should always be a static context on the server but check anyway
	if (!staticContext) {
		console.warn(`Static context was null on the server when executing endpoint: ${endpoint}`);
		return data;
	}

	// Data with that key already preloaded on the server
	if (staticContext.preload.data[endpoint]) {
		return staticContext.preload.data[endpoint];
	}
	let cookies = "";
	if (preloadData && preloadData.cookies) {
		cookies = preloadData.cookies;
	}
	// Load fresh data on the server
	const promise = load(endpoint, staticContext.baseUrl, urlParameters, query,  method, content, isJson, cookies, headers)
		.then(response => {
			staticContext.preload.data[endpoint] = response.data;
			return response.data;
		})
		.catch(err => {
			console.log("preload error");
			if (throwOnException){
				// todo: no pages loading on dev / alpha poss to do with the footer erroring...?
				 throw new Error(err);
			}
			else{
			 console.log(err); //this console.log is server-side, so not useful anywhere except locally.
			}
		});

	//staticContext.preload.data[endpoint] = data;

	// Track promises on the static context so that we can wait for all of them to resolve before
	staticContext.preload.loaders.push(promise);
	return null;
};

export default preload;
