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
			loading: true
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
		}
	}

	loadComments() {
		load("comments", undefined, [], { sourceURI: this.props.match.url }).then(
			res => {
				this.setState({
					comments: res.data.comments,
					loading: false
				});
			}
		);
	}

	componentDidMount() {
		if (this.state.comments.length === 0) {
			this.loadComments();
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
		const ranges = this.state.comments
			.filter(comment => comment.rangeStart !== null)
			.map(comment => comment.rangeStart);
		console.log(ranges);

		const highlighter = rangy.createHighlighter(document, "TextRange");

		let classApplied = rangy.createClassApplier("highlightClass");
		highlighter.addClassApplier(classApplied);


		for (let index of ranges){

			const rangeToHighlight = rangy.deserializeRange(ranges[index]); //, limitingElement);

			highlighter.highlightRanges("highlightClass", [rangeToHighlight]);
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
		this.generateHighlights();
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
