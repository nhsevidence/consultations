// @flow

import queryString from "query-string";
//import stringifyObject from "stringify-object";

/**
 * Create a query string out of an object
 * @param obj the key-value pairs that you'd like to be turned into a querystring
 * @returns {string}
 */
export function objectToQueryString(obj) {
	let str = [];
	for (let p in obj)
		if (obj.hasOwnProperty(p)) {
			if (Array.isArray(obj[p])){
				for (let index in obj[p]){
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p][index]));
				}
			} else{
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
		}
	if (str.length) return "?" + str.join("&");
	return "";
}

/**
 * Creates an object out of a query string
 * 	@param qryString {string} the querystring you'd like to be turned into an object
 *  @returns obj
 */
export function queryStringToObject(qryString) {
	return queryString.parse(qryString);
}

/**
 * Resolve a promise on the next tick - used in testing
 * @see https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick
 * @returns {Promise<any>}
 */
export const nextTick = async () => {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
};

/**
 * Format a string by replacing {0} with arguments passed in
 * @see https://stackoverflow.com/a/4673436
 * @returns {String}
 */
export function replaceFormat(stringToReplace, args) {
	if (typeof(stringToReplace) === undefined || stringToReplace === null)
		return stringToReplace;

	return stringToReplace.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] !== undefined
			? args[number]
			: match
		;
	});
}

/**
 * @param link String The string in which you want to check for the presence of "http"
 * Detects link that starts with "http"
 * @returns {Boolean}
 */
export const isHttpLink = link => link.indexOf("http") === 0;

// Remove querystring parameters from a given URL
export const removeQueryParameter =
	(url: string, parameter: string, value: ?string = null): string => {
		const urlParts = url.split("?");

		if (urlParts.length < 2)
			return url;

		let urlParams = urlParts[1].split(/[&;]/g);

		for (let i = urlParams.length; i-- > 0;) {
			const parParts = urlParams[i].split("=");

			if (parParts[0].toLowerCase() === parameter.toLowerCase()
				&& (!value || (value && value.toLowerCase() === (parParts[1] || "").toLowerCase()))) {
				urlParams.splice(i, 1);
			}
		}

		const queryString = (urlParams.length > 0 ? "?" + urlParams.join("&") : "");
		return urlParts[0] + queryString;
	};

export const appendQueryParameter =
	(url: string, parameter: string, value: string): string => `${url}${url.indexOf("?") === -1 ? "?" : "&"}${parameter}=${value}`;

/// Determines if the execution environment is client or server
/// See https://stackoverflow.com/a/32598826/486434
export const canUseDOM = (): boolean => (
	!!(
		typeof window !== "undefined" &&
		window.document &&
		window.document.createElement
	));

const whichChild = (elem) => {
	let  i= 0;
	while ((elem=elem.previousSibling)!=null) ++i;
	return i;
};

const reverseString = (str) => {
	return (str === "") ? "" : reverseString(str.substr(1)) + str.charAt(0);
};
	
//this function returns a long dotted decimal representing the position in the document. below the div with id of root.
export const getElementPositionWithinDocument = (elem) => {
	let curindex = "";
	if (elem.parentElement) {
		do {
			curindex += whichChild(elem).toString() + " "; // add elem.tagName to see what the element is.
			if (elem.id === "root"){
				break;
			}
		} while (elem = elem.parentElement); // eslint-disable-line
	}
	return reverseString(curindex.trim().replace(new RegExp(/\s/, "g"), "."));
};

//this gets the title of the nearest section above the passed in element (or the element itself). it can also return the chapter title.
export const getSectionTitle = (elem) => {
	do {
		if (elem.classList.contains("section")){
			return elem.title;
		}
		if (elem.classList.contains("chapter")){
			return elem.title;
		}
		if (elem.id === "root"){ //it won't look higher than root.
			return null;
		}
	} while (elem = elem.parentNode); // eslint-disable-line
	return null; //shouldn't really ever be called, as root will get hit if there's no matches. 
};

export const removeQuerystring = (url) => {
	return url.split("?")[0];
};