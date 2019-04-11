// @flow

import React, { Component, Fragment } from "react";
import { withRouter, Link, Prompt } from "react-router-dom";
//import stringifyObject from "stringify-object";
import { LiveMessage } from "react-aria-live";

import preload from "../../data/pre-loader";
import { load } from "../../data/loader";
import {
	saveCommentHandler,
	deleteCommentHandler,
	saveAnswerHandler,
	deleteAnswerHandler,
} from "../../helpers/editing-and-deleting";
import { pullFocusByQuerySelector } from "../../helpers/accessibility-helpers";
import { mobileWidth } from "../../constants";
import { getElementPositionWithinDocument, getSectionTitle } from "../../helpers/utils";
import { updateUnsavedIds } from "../../helpers/unsaved-comments";
import { tagManager } from "../../helpers/tag-manager";

import { CommentBox } from "../CommentBox/CommentBox";
import { Question } from "../Question/Question";
import { LoginBanner } from "../LoginBanner/LoginBanner";
import { UserContext } from "../../context/UserContext";
import { highlightComment } from "../Selection/Selection";

type PropsType = {
	staticContext?: any,
	match: {
		url: string,
		params: any
	},
	location: {
		pathname: string,
		search: string
	},
	announceAssertive: Function,
};

type StateType = {
	comments: Array<CommentType>,
	questions: Array<QuestionType>,
	loading: boolean,
	allowComments: boolean,
	initialDataLoaded: boolean,
	drawerOpen: boolean,
	drawerMobile: boolean,
	viewComments: boolean,
	shouldShowDrawer: boolean,
	shouldShowCommentsTab: boolean,
	shouldShowQuestionsTab: boolean,
	error: string,
	unsavedIds: Array<number>,
};

export class CommentList extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);
		this.state = {
			comments: [],
			questions: [],
			loading: true,
			allowComments: true,
			error: "",
			initialDataLoaded: false,
			drawerOpen: false,
			drawerMobile: false,
			viewComments: true,
			shouldShowDrawer: false,
			shouldShowCommentsTab: false,
			shouldShowQuestionsTab: false,
			unsavedIds: [],
		};

		let preloadedData = {};
		if (this.props.staticContext && this.props.staticContext.preload) {
			preloadedData = this.props.staticContext.preload.data; //this is data from Configure => SupplyData in Startup.cs. the main thing it contains for this call is the cookie for the current user.
		}

		const preloadedCommentsData = preload(
			this.props.staticContext,
			"comments",
			[],
			{sourceURI: this.props.match.url},
			preloadedData
		);

		if (preloadedCommentsData) {
			let allowComments = preloadedCommentsData.consultationState.consultationIsOpen && !preloadedCommentsData.consultationState.userHasSubmitted;
			this.state = {
				comments: preloadedCommentsData.comments,
				questions: preloadedCommentsData.questions,
				loading: false,
				allowComments: allowComments,
				error: "",
				initialDataLoaded: true,
				viewComments: preloadedCommentsData.consultationState.shouldShowCommentsTab,
				shouldShowDrawer: preloadedCommentsData.consultationState.shouldShowDrawer,
				shouldShowCommentsTab: preloadedCommentsData.consultationState.shouldShowCommentsTab,
				shouldShowQuestionsTab: preloadedCommentsData.consultationState.shouldShowQuestionsTab,
				drawerOpen: false,
				drawerMobile: false,
				unsavedIds: [],
			};

			this.temporary();
		}
	}

	loadComments() {
		load("comments", undefined, [], {sourceURI: this.props.match.url}).then(
			response => {
				let allowComments = response.data.consultationState.consultationIsOpen && !response.data.consultationState.userHasSubmitted;
				this.setState({
					comments: response.data.comments,
					questions: response.data.questions,
					loading: false,
					allowComments: allowComments,
					shouldShowDrawer: response.data.consultationState.shouldShowDrawer,
					shouldShowCommentsTab: response.data.consultationState.shouldShowCommentsTab,
					shouldShowQuestionsTab: response.data.consultationState.shouldShowQuestionsTab,
				}, this.temporary);
			})
			.catch(err => console.log("load comments in commentlist " + err));
	}

	temporary = () => {
		var self = this;
		setTimeout(function() {
			self.highlightSelections();
			self.forceUpdate();
		}, 50);
	}

	highlightSelections = () => {
		const selectionComments = this.state.comments.filter(comment => comment.commentOn === "Selection");
		if (selectionComments.length){
			for (let comment in selectionComments){
				highlightComment(selectionComments[comment]);
			}
		}
	}

	componentDidMount() {
		if (!this.state.initialDataLoaded) {
			this.loadComments();
		}
		// We can't prerender whether we're on mobile cos SSR doesn't have a window
		this.setState({
			drawerMobile: this.isMobile(),
		});
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname + prevProps.location.search;
		const newRoute = this.props.location.pathname + this.props.location.search;
		if (oldRoute !== newRoute) {
			this.setState({
				loading: true,
				unsavedIds: [],
			});
			this.loadComments();
		}
	}

	issueA11yMessage = (message: string) => {
		const unique = new Date().getTime().toString();
		// announcer requires a unique id so we're able to repeat phrases
		this.props.announceAssertive(message, unique);
	};

	newComment = (e: Event, newComment: CommentType) => {
		if ((typeof(newComment.order) === "undefined" || (newComment.order === null)) && e !== null) {
			///these values are already set when user has selected text. when they've clicked a button though they'll be unset.
			newComment.order = getElementPositionWithinDocument(e.currentTarget);
			newComment.section = getSectionTitle(e.currentTarget);
		}

		this.setState({
			drawerOpen: true,
			viewComments: true,
		});
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
			commentId: idToUseForNewBox,
			show: false,
		});
		comments.unshift(generatedComment);
		this.setState({comments});
		setTimeout(() => {
			pullFocusByQuerySelector(`#Comment${idToUseForNewBox}`);
		}, 0);
		this.temporary();
	};

	//these handlers have moved to the helpers/editing-and-deleting.js utility file as they're also used in ReviewList.js
	saveCommentHandler = (e: Event, comment: CommentType) => {
		saveCommentHandler(e, comment, this);
	};

	deleteCommentHandler = (e: Event, commentId: number) => {
		deleteCommentHandler(e, commentId, this);
	};

	saveAnswerHandler = (e: Event, answer: AnswerType, questionId: number) => {
		saveAnswerHandler(e, answer, questionId, this);
	};

	deleteAnswerHandler = (e: Event, questionId: number, answerId: number) => {
		deleteAnswerHandler(e, questionId, answerId, this);
	};

	updateUnsavedIds = (commentId: string, dirty: boolean) => {
		updateUnsavedIds(commentId, dirty, this);
	};

	componentWillUnmount(){
		console.log("componentWillUnmount called");
	}

	//old drawer code:
	isMobile = () => {
		if (typeof document !== "undefined") {
			return (
				document.getElementsByTagName("body")[0].offsetWidth <= mobileWidth
			);
		}
		return false;
	};

	drawerClassnames = () => {
		const open = this.state.drawerOpen ? "Drawer--open" : "";
		const mobile = this.state.drawerMobile ? "Drawer--mobile" : "";
		return `Drawer ${open} ${mobile}`;
	};

	handleClick = (event: string) => {
		switch (event) {
			case "toggleOpenComments":
				this.setState(prevState => {
					const drawerOpen = prevState.drawerOpen && prevState.viewComments ? !prevState.drawerOpen : true;
					tagManager({
						event: "generic",
						category: "Consultation comments page",
						action: "Clicked",
						label: `${drawerOpen ? "Open" : "Close"} comments panel button`,
					});
					return (
						{
							drawerOpen,
							viewComments: true,
						}
					);
				});
				pullFocusByQuerySelector("#js-drawer-toggleopen-comments");
				break;

			case "toggleOpenQuestions":

				this.setState(prevState => {
					const drawerOpen = prevState.drawerOpen && !prevState.viewComments ? !prevState.drawerOpen : true;
					tagManager({
						event: "generic",
						category: "Consultation comments page",
						action: "Clicked",
						label: `${drawerOpen ? "Open" : "Close"} questions panel button`,
					});
					return (
						{
							drawerOpen,
							viewComments: false,
						}
					);
				});
				pullFocusByQuerySelector("#js-drawer-toggleopen-questions");
				break;

			default:
				return;
		}
	};

	render() {
		if (!this.state.shouldShowDrawer) {
			return null;
		}

		const a11yMessage = () => {
			if (!this.state.drawerOpen) {
				return "Comments and questions panel closed";
			} else {
				if (this.state.viewComments) {
					return "Comments panel open";
				} else {
					return "Questions panel open";
				}
			}
		};

		return (
			<Fragment>
				<Prompt
					when={this.state.unsavedIds.length > 0}
					message={`You have ${this.state.unsavedIds.length} unsaved ${this.state.unsavedIds.length === 1 ? "change" : "changes"}. Continue without saving?`}
				/>
				<LiveMessage message={a11yMessage()} aria-live="assertive"/>
				<section aria-label="Commenting panel"
								 className={this.drawerClassnames()}>
					<div className="Drawer__controls">
						{this.state.shouldShowCommentsTab &&
						<button
							data-qa-sel="open-commenting-panel"
							id="js-drawer-toggleopen-comments"
							className={`Drawer__control Drawer__control--comments ${(this.state.viewComments ? "active" : "active")}`}
							onClick={() => this.handleClick("toggleOpenComments")}
							aria-controls="comments-panel"
							aria-haspopup="true"
							aria-label={this.state.drawerOpen ? "Close the commenting panel" : "Open the commenting panel"}
							tabIndex="0">
							{!this.state.drawerMobile ?
								<span>{(this.state.drawerOpen && this.state.viewComments ? "Close comments" : "Open comments")}</span>
								:
								<span
									className={`icon ${
										this.state.drawerOpen
											? "icon--chevron-right"
											: "icon--chevron-left"}`}
									aria-hidden="true"
									data-qa-sel="close-commenting-panel"
								/>
							}
						</button>
						}
						{this.state.shouldShowQuestionsTab &&
						<button
							data-qa-sel="open-questions-panel"
							id="js-drawer-toggleopen-questions"
							className={`Drawer__control Drawer__control--questions ${(this.state.viewComments ? "active" : "active")}`}
							onClick={() => this.handleClick("toggleOpenQuestions")}
							aria-controls="questions-panel"
							aria-haspopup="true"
							aria-label={this.state.drawerOpen ? "Close the questions panel" : "Open the questions panel"}
							tabIndex="0">
							{!this.state.drawerMobile ?
								<span>{(this.state.drawerOpen && !this.state.viewComments ? "Close questions" : "Open questions")}</span>
								:
								<span
									className={`icon ${
										this.state.drawerOpen
											? "icon--chevron-right"
											: "icon--chevron-left"}`}
									aria-hidden="true"
									data-qa-sel="close-questions-panel"
								/>
							}
						</button>
						}
					</div>
					<div
						aria-disabled={!this.state.drawerOpen && (this.state.shouldShowQuestionsTab || this.state.shouldShowCommentsTab)}
						data-qa-sel="comment-panel"
						id="comments-panel"
						className={`Drawer__main ${this.state.drawerOpen ? "Drawer__main--open" : "Drawer__main--closed"}`}
					>
						<UserContext.Consumer>
							{(contextValue: ContextType) => {
								return (
									<div data-qa-sel="comment-list-wrapper">

										{contextValue.isAuthorised &&
												<Link
													to={`/${this.props.match.params.consultationId}/review`}
													data-qa-sel="review-all-comments"
													className="btn btn--cta mt--c">
													Review and submit your response &nbsp;&nbsp;
													<span className="icon icon--chevron-right" aria-hidden="true" />
												</Link>
										}

										{this.state.error !== "" ?
											<div className="errorBox">
												<p>We couldn{"'"}t {this.state.error} your comment. Please try again in a few minutes.</p>
												<p>If the problem continues please <a href={"/get-involved/contact-us"}>contact us</a>.</p>
											</div>
											: null}

										{this.state.loading ? <p>Loading...</p> :
											contextValue.isAuthorised ?

												<Fragment>

													<div className={`${this.state.viewComments ? "show" : "hide"}`}>
														{this.state.comments.length === 0 ? <p>No comments yet</p> :
															<ul className="CommentList list--unstyled mt--0">
																{this.state.comments.map((comment) => {
																	return (
																		<CommentBox
																			updateUnsavedIds={this.updateUnsavedIds}
																			readOnly={!this.state.allowComments}
																			key={comment.commentId}
																			unique={`Comment${comment.commentId}`}
																			comment={comment}
																			saveHandler={this.saveCommentHandler}
																			deleteHandler={this.deleteCommentHandler}
																		/>
																	);
																})}
															</ul>
														}
													</div>

													<div className={`${this.state.viewComments ? "hide" : "show"}`}>
														<p className="mt--0">Please answer the following questions</p>
														<ul className="CommentList list--unstyled mt--0">
															{this.state.questions.map((question) => {
																const isUnsaved = this.state.unsavedIds.includes(`${question.questionId}q`);
																return (
																	<Question
																		isUnsaved={isUnsaved}
																		updateUnsavedIds={this.updateUnsavedIds}
																		readOnly={!this.state.allowComments}
																		key={question.questionId}
																		unique={`Comment${question.questionId}`}
																		question={question}
																		saveAnswerHandler={this.saveAnswerHandler}
																		deleteAnswerHandler={this.deleteAnswerHandler}
																	/>
																);
															})}
														</ul>
													</div>
												</Fragment>
												:
												<LoginBanner
													signInButton={true}
													currentURL={this.props.match.url}
													signInURL={contextValue.signInURL}
													registerURL={contextValue.registerURL}
												/>
										}
									</div>
								);
							}}
						</UserContext.Consumer>
					</div>
				</section>
			</Fragment>
		);
	}
}

export default withRouter(CommentList);
