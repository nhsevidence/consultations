// @flow

import React, { Component } from "react";
import xpathRange from "xpath-range";
//import stringifyObject from "stringify-object";

type PropsType = {
	newCommentFunc: Function,
	sourceURI: string,
	allowComments: boolean
};

type StateType = {
	toolTipVisible: boolean,
	comment: any,
	position: any
};

export class Selection extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);
		this.state = {
			toolTipVisible: false,
			comment: {},
			position: {}
		};
		this.selectionContainer = React.createRef();
		
	}

	findPos(obj) {
		let curleft = 0, curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
		}
		return [curleft,curtop];
	}

	getXPathForElement(element) {
		const idx = (sib, name) => sib 
			? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name)
			: 1;
		const segs = elm => !elm || elm.nodeType !== 1 
			? [""]
			: elm.id && document.querySelector(`#${elm.id}`) === elm
				? [`id("${elm.id}")`]
				: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
		return segs(element).join("/");
	}

	// function getElementByXPath(path) { 
	// 	return (new XPathEvaluator()) 
	// 		.evaluate(path, document.documentElement, null, 
	// 						XPathResult.FIRST_ORDERED_NODE_TYPE, null) 
	// 		.singleNodeValue; 
	// } 

	getCommentForRange = (limitingElement: any, selection: any) =>{
		let selectionRange = selection.getRangeAt(0);

		let comment = null;
		try {

			// let browserRange = new xpathRange.Range.BrowserRange(selectionRange);
			// let normedRange = browserRange.normalize().limit(limitingElement); //restrict the range to the current limiting area.

			// let quote = this.trim(normedRange.text());
			// let serialisedRange = normedRange.serialize(limitingElement, "");

			comment = {
				quote: selectionRange.toString(),
				rangeStart: this.getXPathForElement(selectionRange.startContainer.parentElement),
				rangeStartOffset: selectionRange.startOffset,
				rangeEnd: this.getXPathForElement(selectionRange.endContainer.parentElement),
				rangeEndOffset: selectionRange.endOffset,
				sourceURI: this.props.sourceURI,
				placeholder: "Comment on this selected text",
				commentText: "",
				commentOn: "Selection",
				position: this.findPos(selectionRange.startContainer.parentElement),
			};
		} catch (error) {
			console.error(error);
		}
		return(comment);
	}

	onMouseUp = (event: Event) => {

		if (window && window.getSelection) {
			const arrowSize = 10; //this must match the size in $arrow-size in Selection.scss
			const selection = window.getSelection();
			if (selection.isCollapsed || selection.rangeCount < 1){ //isCollapsed is true when there's no text selected.
				this.setState({ toolTipVisible: false });
				return;
			}
			const comment = this.getCommentForRange(event.currentTarget, selection);
			if (comment === null) {
				this.setState({ toolTipVisible: false });
			}

			const scrollTop = "pageYOffset" in window ? window.pageYOffset : document.documentElement.scrollTop;
			const scrollLeft = "pageXOffset" in window ? window.pageXOffset : document.documentElement.scrollLeft;
			const boundingRectOfContainer = this.selectionContainer.current.getBoundingClientRect();
			const position =
			{
				x: event.pageX - (boundingRectOfContainer.left + scrollLeft) - arrowSize,
				y: event.pageY - (boundingRectOfContainer.top + scrollTop) + arrowSize		  
			};

			this.setState({ comment, position, toolTipVisible: true });
		} else{
			this.setState({ toolTipVisible: false });
		}
	}
	onButtonClick = (event: Event ) => {
		this.props.newCommentFunc(null, this.state.comment); //can't pass the event here, as it's the button click event, not the start of the text selection.
		this.setState({ toolTipVisible: false });
	}


	onVisibleChange = (toolTipVisible) => {
		this.setState({
			toolTipVisible
		});
	}

	// trim strips whitespace from either end of a string.
	//
	// This usually exists in native code, but not in IE8.
	trim = (s: string) => {
		if (typeof String.prototype.trim === "function") {
			return String.prototype.trim.call(s);
		} else {
			return s.replace(/^[\s\xA0]+|[\s\xA0]+$/g, '');
		}
	}

	render() {

		if (!this.props.allowComments)
			return (
				<div>{this.props.children}</div>
			);

		return (
			<div onMouseUp={this.onMouseUp} ref={this.selectionContainer}>
				<MyToolTip visible={this.state.toolTipVisible} onButtonClick={this.onButtonClick} position={this.state.position}/>
				{this.props.children}
			</div>
		);
	}
}

type ToolTipPropsType = {
	position: any,
	visible: boolean,
	onButtonClick: any
}
export const MyToolTip = (props = ToolTipPropsType) => {
	const { position, visible, onButtonClick } = props;
	var contentMenuStyle = {
		display: visible ? "block" : "none",
		left: position.x,
		top: position.y
	};
	return (
		<div className="selection-container unselectable" style={contentMenuStyle}>
			<button onClick={onButtonClick} className="btn"><span className="icon icon--comment unselectable" aria-hidden="true"></span>&nbsp;&nbsp;Comment</button>
		</div>
	);
};

export default Selection;
