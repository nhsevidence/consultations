import React, { Fragment } from "react";
import { convertNodeToElement } from "react-html-parser";
import {nodeIsTypeText, nodeIsSubsection, nodeIsSpanTag, nodeIsInternalLink} from "./types";
import processInternalLink from "./internal-link";
import {tagManager} from "../../helpers/tag-manager";

export const processChapterSectionSubsection = (node, onNewCommentClick, sourceURI, allowComments) => {

	let commentOn = node.attribs["data-heading-type"].toLowerCase();
	let quote = node.children.filter(nodeIsTypeText)[0].data;

	if (nodeIsSubsection(node)) {
		quote = node.children.filter(nodeIsSpanTag)[0].children.filter(nodeIsTypeText)[0].data;
		commentOn = "subsection";
	}

	const htmlElementID = (commentOn === "section" || commentOn === "subsection") ? node.attribs.id : "";

	if (typeof(node.attribs) !== undefined){ //this gets rid of the tooltip added to the anchor in indev. it's just not really needed on text.
		node.attribs.title = "";
	}

	return (
		<Fragment key={htmlElementID}>
			{allowComments &&
				<button
					data-gtm="button"
					data-gtm-category="Consultation comments page"
					data-gtm-action="Clicked"
					data-gtm-label={`Comment on ${commentOn || "chapter"}`}
					data-qa-sel="in-text-comment-button"
					title={`Comment on ${commentOn || "chapter"}`}
					className="document-comment-container__commentButton"
					tabIndex={0}
					onClick={e => {
						e.preventDefault();
						tagManager({
							event: "generic",
							category: "Consultation comments page",
							action: "Clicked",
							label: `Comment on ${commentOn || "chapter"}`,
						});
						onNewCommentClick(e, {
							sourceURI,
							commentText: "",
							commentOn,
							htmlElementID,
							quote,
						});
					}}
				>
					<span className="icon icon--comment" aria-hidden="true" />
					<span className="visually-hidden">Comment on {commentOn}: {quote}</span>
				</button>
			}
			{convertNodeToElement(node, 0, transform)}
		</Fragment>
	);
};

const transform = (node) => {
	if (nodeIsInternalLink(node)){
		return processInternalLink(node);
	}
};
