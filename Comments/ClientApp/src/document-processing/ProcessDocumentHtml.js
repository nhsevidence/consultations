// @flow

import React, {PureComponent, Fragment} from "react";
import ReactHtmlParser from "react-html-parser";
import {nodeIsChapter, nodeIsInternalLink, nodeIsSection, nodeIsSubsection, nodeHasASelectionComment} from "./transforms/types";
import {processChapterSectionSubsection} from "./transforms/chapter-section-subsection";
import {processSelectionComment} from "./transforms/selection-comment";
import processInternalLink from "./transforms/internal-link";

type PropsType = {
	content: any,
	url: string,
	onNewCommentClick: Function,
	allowComments: boolean,
}

type StateType = {
	content: any,
}

export class ProcessDocumentHtml extends PureComponent<PropsType, StateType> {
	constructor(props) {
		super(props);

		if (this.props) {
			const content = ReactHtmlParser(this.props.content, {
				transform: this.transformHtml,
			});
			this.state = {content};
		}
	}

	transformHtml = (node) => {		
		if (nodeIsChapter(node) || nodeIsSection(node) || nodeIsSubsection(node)) {
			return processChapterSectionSubsection(node, this.props.onNewCommentClick, this.props.url, this.props.allowComments);
		}
		if (nodeIsInternalLink(node)) {
			return processInternalLink(node);
		}
	};

	renderHtml = () => {
		const content = ReactHtmlParser(this.props.content, {
			transform: this.transformHtml,
		});
		this.setState({content});
	};

	componentDidMount() {
		if (!this.state.content) {
			this.renderHtml();
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.slug !== this.props.slug) {
			this.renderHtml();
		}
	}

	render() {
		if (!this.state.content) return null;
		return (
			<Fragment>
				{this.state.content}
			</Fragment>
		);
	}
}
