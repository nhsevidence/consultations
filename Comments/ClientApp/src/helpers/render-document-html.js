import React, { Fragment } from "react";
import ReactHtmlParser, { convertNodeToElement } from "react-html-parser";

// const SectionCommentButton = () => {
// 	return <button>Comment on this section</button>;
// };

// onNewCommentClick passed through from <Document />
export const renderDocumentHtml = (incomingHtml, onNewCommentClick, sourceURI) => {

	function addSectionCommentButtons(node) {
		// console.log(node);
		// find the "sections" - anchors with a data-heading-type of "section"
		// and render them verbatim with a button before them

		if (
			node.name === "a" &&
			node.attribs &&
			node.attribs["data-heading-type"] === "section"
		) {
			console.log(node);

			const isTypeText = (child) => child.type === "text";

			const childrenThatHaveTypeOfText = node.children.filter(isTypeText);

			const sectionName = childrenThatHaveTypeOfText[0].data;

			const elementId = node.attribs.id;

			return (
				<Fragment>
					<button
						tabIndex={0}
						href={`${sectionName}`}
						onClick={e => {
							e.preventDefault();
							onNewCommentClick({
								placeholder: `Comment on ${sectionName}`,
								sourceURI: sourceURI,
								commentText: "",
								commentOn: "Section",
								htmlElementID: elementId
							});
						}}
					>
						Comment on section: {`${sectionName}`}
					</button>
					{/* this is the original DOM node, rendered */}
					{convertNodeToElement(node)}
				</Fragment>
			);
		}
	}

	return ReactHtmlParser(incomingHtml, {
		transform: addSectionCommentButtons
	});
};
