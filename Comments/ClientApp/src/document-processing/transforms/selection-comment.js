import React, { Fragment } from "react";
import { convertNodeToElement } from "react-html-parser";
import {nodeHasASelectionComment} from "./types";
import processInternalLink from "./internal-link";

export const processSelectionComment = (node, index) => {

	return (
		<span className="hello">
			{convertNodeToElement(node, 0)}
		</span>
	);
};

const transform = (node, index) => {
	if (node.children && node.children.length){
		console.log(node.children);
	}

	if (nodeHasASelectionComment(node)){
		return (
			<span key={index} className="selected"> test </span>
		);
	}
};

