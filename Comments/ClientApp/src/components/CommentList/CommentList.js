// @flow

import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";

import { load } from "./../../data/loader";
import preload from "../../data/pre-loader";
import { CommentBox } from "../CommentBox/CommentBox";
//import stringifyObject from "stringify-object";

type PropsType = {
	staticContext?: any,
	match: {
		url: string,
		params: any
	},
	location: {
		pathname: string
	},
	drawerOpen: boolean
};

type CommentType = {
	commentId: number,
	lastModifiedDate: Date,
	lastModifiedByUserId: string,
	commentText: string,
	locationId: number,
	sourceURI: string,
	htmlElementID: string,
	rangeStart: string,
	rangeStartOffset: string,
	rangeEnd: string,
	rangeEndOffset: string,
	quote: string,
	commentOn: string
};

type StateType = {
	comments: Array<CommentType>,
	loading: boolean
};

export class CommentList extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);
		this.state = {
			comments: [],
			loading: true,
			highlighter: null
		};
		let preloadedData = {};
		if (this.props.staticContext && this.props.staticContext.preload) {
			preloadedData = this.props.staticContext.preload.data;
		}

		const preloaded = preload(
			this.props.staticContext,
			"comments",
			[],
			{
				sourceURI: this.props.match.url
			},
			preloadedData
		);

		if (preloaded) {
			this.state = {
				comments: preloaded.comments,
				loading: false
			};
			//this.generateHighlights();
		}
	}

	//this function is only called onload server-side.
	loadComments() {
		console.log('loading comments');
		load("comments", undefined, [], { sourceURI: this.props.match.url }).then(
			res => {
				this.setState({
					comments: res.data.comments,
					loading: false
				},
				// setTimeout(this.generateHighlights, 0)
				);
				console.log('comments loaded');
			}
		);
	}

	componentDidMount() {
		if (this.state.comments.length === 0) { //if the server-side load didn't find any comments, try again.
			this.loadComments();
		}
		else{
			//this.generateHighlights();
			setTimeout(
				this.generateHighlights,
				0
			);
		}
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname;
		const newRoute = this.props.location.pathname;
		if (oldRoute !== newRoute) {
			this.setState({
				loading: true
			});
			this.loadComments();
		}
	}

	generateHighlights = () => {
		console.log('generating highlights');
		const ranges = this.state.comments
			.filter(comment => comment.rangeStart !== null)
			.map(comment => comment.rangeStart);
		console.log(ranges);

		let highlighter = window.highlighter;
		if (typeof(highlighter) === 'undefined' || highlighter === null) {
			highlighter = rangy.createHighlighter(document, "TextRange");
			let classApplied = rangy.createClassApplier("highlightClass");
			highlighter.addClassApplier(classApplied);

			window.highlighter = highlighter;
			//this.setState({highlighter});
		}



		highlighter.removeAllHighlights();

		let limitingElement = document.getElementById("someDiv"); //temporary

		for (let range of ranges){
			console.log('about to deserialise: ' + range);
			try {
				const rangeToHighlight = rangy.deserializeRange(range, limitingElement);
				highlighter.highlightRanges("highlightClass", [rangeToHighlight]);
			}
			catch(error){
				console.log('problem ')
				console.error(error);
			}
		}
	};

	newComment(newComment: CommentType) {
		let comments = this.state.comments;
		//negative ids are unsaved / new comments
		let idToUseForNewBox = -1;
		if (comments && comments.length) {
			const existingIds = comments.map(c => c.commentId);
			const lowestExistingId = Math.min.apply(Math, existingIds);
			idToUseForNewBox = lowestExistingId >= 0 ? -1 : lowestExistingId - 1;
		} else {
			comments = [];
		}
		const generatedComment = Object.assign({}, newComment, {
			commentId: idToUseForNewBox
		});
		comments.unshift(generatedComment);
		this.setState({ comments });
		setTimeout(this.generateHighlights, 0);
	}

	saveCommentHandler = (e: Event, comment: CommentType) => {
		e.preventDefault();

		const isANewComment = comment.commentId < 0;
		const method = isANewComment ? "POST" : "PUT";
		const urlParameters = isANewComment ? [] : [comment.commentId];
		const endpointName = isANewComment ? "newcomment" : "editcomment";

		load(endpointName, undefined, urlParameters, {}, method, comment, true)
			.then(res => {
				if (res.status === 201 || res.status === 200) {
					const index = this.state.comments
						.map(function(comment) {
							return comment.commentId;
						})
						.indexOf(comment.commentId);
					const comments = this.state.comments;
					comments[index] = res.data;
					this.setState({
						comments
					});
				}
			})
			.catch(err => {
				console.log(err);
				if (err.response) alert(err.response.statusText);
			});
	};

	deleteCommentHandler = (e: Event, commentId: number) => {
		e.preventDefault();
		if (commentId < 0) {
			this.removeCommentFromState(commentId);
		} else {
			load("editcomment", undefined, [commentId], {}, "DELETE")
				.then(res => {
					if (res.status === 200) {
						this.removeCommentFromState(commentId);
					}
				})
				.catch(err => {
					console.log(err);
					if (err.response) alert(err.response.statusText);
				});
		}
	};

	removeCommentFromState = (commentId: number) => {
		let comments = this.state.comments;
		comments = comments.filter(comment => comment.commentId !== commentId);
		this.setState({ comments });
		//setTimeout(this.generateHighlights, 0);
		this.state.highlighter.removeAllHighlights();
	};

	render() {
		if (this.state.loading) return <p>Loading</p>;
		if (!this.state.loading && this.state.comments.length === 0)
			return (
				<Fragment>
					<p>No comments</p>
				</Fragment>
			);

		return (
			<Fragment>
				<ul className="CommentList list--unstyled">
					{this.state.comments.map((comment, idx) => {
						return (
							<CommentBox
								drawerOpen={this.props.drawerOpen}
								key={comment.commentId}
								unique={`Comment${idx}`}
								comment={comment}
								saveHandler={this.saveCommentHandler}
								deleteHandler={this.deleteCommentHandler}
							/>
						);
					})}
				</ul>
			</Fragment>
		);
	}
}

export default withRouter(CommentList);
