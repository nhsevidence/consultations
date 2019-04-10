export function nodeIsChapter(node){
	return node.name === "a" && node.attribs && node.attribs["data-heading-type"] === "chapter";
}

export function nodeIsSection(node) {
	return node.name === "a" && node.attribs && node.attribs["data-heading-type"] === "section";
}

export function nodeIsInternalLink(node) {
	return node.name === "a" && node.attribs && node.attribs["rel"] === "internal";
}

export function nodeIsSubsection(node) {
	return node.name === "p" && node.attribs && node.attribs["data-heading-type"] === "numbered-paragraph";
}

export function nodeIsTypeText(node) {
	return node.type === "text";
}

export function nodeIsSpanTag(node) {
	return node.name === "span";
}

export function nodeIsComment(node) {
	return node.type === "comment";
}

export function nodeHasASelectionComment(node){
	//console.log('nodeHasASelectionComment hit');
	return true;
}