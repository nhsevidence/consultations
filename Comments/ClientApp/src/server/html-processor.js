// @flow

// Handles post-processing of the HTML from create-react-app to support
// server side rendering. I.e. replaces placeholders within html etc

const OpeningHtmlTagRegex: RegExp = /<html[^>]*>/g,
	OpeningBodyTagRegex: RegExp = /<body[^>]*>/g,
	ClassAttributeRegex: RegExp = /class=['"]([^"]*)['"]/;

// Replace placeholders and tokens in the static html layout file.

export const prepTags = (html: string, { title, metas, links, scripts, analyticsGlobals }): string => {
	return html
		.replace("<!--! title -->", title)
		.replace("<!--! metas -->", metas)
		.replace("<!--! links -->", links)
		.replace("<!--! scripts -->", scripts)
		.replace("<!--! analyticsGlobals -->", analyticsGlobals);
};

// Removes the class attribute from the given html attributes.
// The returned object has properties for:
// - The original class attribute value
// - The html attributes without the class name attribute
export const parseClassAttribute = (htmlAttributes: string): string => {
	let className: string = "";

	let classNameMatch = htmlAttributes.match(ClassAttributeRegex);
	if (classNameMatch && classNameMatch.length === 2) {
		className = classNameMatch[1];
	}

	let attrs: string = htmlAttributes.replace(ClassAttributeRegex, "").trim();

	return { htmlAttributes: attrs,
		className: className };
};

// Replaces the html tag with the given html attributes.
// Always adds a `no-js` class to support Modernizr
export const replaceOpeningHtmlTag = (html: string, htmlAttributes: string): string => {
	let classAttr = parseClassAttribute(htmlAttributes),
		className = classAttr.className.length > 0 ? ` ${classAttr.className}` : "",
		htmlAttrs = classAttr.htmlAttributes.length > 0 ? ` ${classAttr.htmlAttributes}` : "";

	return html.replace(OpeningHtmlTagRegex, `<html class="no-js${className}"${htmlAttrs}>`);
};

// Replaces the body tag with the given attributes
export const replaceOpeningBodyTag = (html: string, bodyAttributes: string): string => {
	let attrs = bodyAttributes.length > 0 ? ` ${bodyAttributes}` : "";
	return html.replace(OpeningBodyTagRegex, `<body${attrs}>`);
};

// Replaces the react root div with the given content html
export const replaceRootContent = (html: string, rootContent: string): string => {
	return html.replace("<div id=\"root\"></div>", `<div id="root">${rootContent}</div>`);
};

export const replaceAccountsEnvironment = (html: string, accountsEnvironment: string): string => {
	return html.replace(/data-environment="[^"]*"/g, `data-environment="${accountsEnvironment}"`);
};

export const processHtml = (html: string, {
	title, metas, links, analyticsGlobals, scripts, htmlAttributes, bodyAttributes, rootContent, accountsEnvironment,
}): string => {
	html = replaceOpeningHtmlTag(html, htmlAttributes);
	html = replaceOpeningBodyTag(html, bodyAttributes);
	html = replaceAccountsEnvironment(html, accountsEnvironment);
	html = replaceRootContent(html, rootContent);
	html = prepTags(html, { title,
		metas,
		links,
		scripts,
		analyticsGlobals,
	});
	return html;
};

export default processHtml;
