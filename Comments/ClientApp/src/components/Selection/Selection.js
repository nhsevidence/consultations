import React, { Component } from "react";
//import xpathRange from "xpath-range";
import { stringifyObject } from "stringify-object";
//import { rangy, TextRange } from "rangy";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange"; 
import "rangy/lib/rangy-serializer";


type PropsType = {
	newCommentFunc: Function,
	sourceURI: string
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
	
	getCommentForRange = (limitingElement: any, selection: any, excludeClassName: string) =>{
		
		const rangySelection = rangy.getSelection();

		let selectionRange = rangySelection.getRangeAt(0);		

		let serialisedRange = "";
		try{
			//see: https://github.com/timdown/rangy/wiki/Serializer-Module
			serialisedRange = rangy.serializeRange(selectionRange, false, limitingElement);
			console.log(serialisedRange);		
		}
		catch(error){
		 	return null;
		}

		let quote = rangySelection.text(); 

		let comment = { 
			quote: quote,
		 	rangeStart: serialisedRange,
		 	sourceURI: this.props.sourceURI,
		 	placeholder: "Comment on this selected text",
		 	commentText: "",
		 	commentOn: "Selection" 
		};
		
		return(comment);
	}

	onMouseUp = (event: Event) => {

		if (window && window.getSelection){
			const selection = window.getSelection();
			if (selection.isCollapsed || selection.rangeCount < 1){ //isCollapsed is true when there"s no text selected.
				this.setState({ toolTipVisible: false });
				return;
			}			
			const comment = this.getCommentForRange(event.currentTarget, selection, "icon"); 
			if (comment === null){
				this.setState({ toolTipVisible: false });
				return;
			}
			
			const boundingRectOfContainer = this.selectionContainer.current.getBoundingClientRect();
			const position =
			{
				x: event.pageX - (boundingRectOfContainer.left + document.documentElement.scrollLeft),
			  	y: event.pageY - (boundingRectOfContainer.top + document.documentElement.scrollTop)			  
			};

			this.setState({ comment, position, toolTipVisible: true });
		} else{
			this.setState({ toolTipVisible: false });
		}		
	}	

	onButtonClick = (event: Event ) => {
		this.props.newCommentFunc(this.state.comment);
		this.setState({ toolTipVisible: false });
	}

	onVisibleChange = (toolTipVisible) => {
		this.setState({
			toolTipVisible
		});
	}

	// trim strips whitespace from either end of a string. This usually exists in native code, but not in IE8.
	trim = (s: string) => {
		if (typeof String.prototype.trim === "function") {
			return String.prototype.trim.call(s);
		} else {
			return s.replace(/^[\s\xA0]+|[\s\xA0]+$/g, "");
		}
	}

	render() {
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
const MyToolTip = (props = ToolTipPropsType) => {
	const { position, visible, onButtonClick } = props;
	var contentMenuStyle = {
		display: visible ? "block" : "none",
		left: position.x,
		top: position.y
	};
	return (
		<div className="selection-container" style={contentMenuStyle}>			
			<button onClick={onButtonClick} className="btn"><span className="icon icon--comment" aria-hidden="true"></span>&nbsp;&nbsp;Comment</button>
		</div>
	);
};

export default Selection;
