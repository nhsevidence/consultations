// @flow

import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
//import stringifyObject from "stringify-object";

import preload from "../../data/pre-loader";
import { load } from "../../data/loader";
import { saveCommentHandler, deleteCommentHandler, saveAnswerHandler, deleteAnswerHandler } from "../../helpers/editing-and-deleting";
import { queryStringToObject } from "../../helpers/utils";
import { pullFocusById } from "../../helpers/accessibility-helpers";
import { projectInformation } from "../../constants";
import { UserContext } from "../../context/UserContext";

import { Header } from "../Header/Header";
import { PhaseBanner } from "../PhaseBanner/PhaseBanner";
import { BreadCrumbs } from "../Breadcrumbs/Breadcrumbs";
import { FilterPanel } from "../FilterPanel/FilterPanel";
import { ResultsInfo } from "../ResultsInfo/ResultsInfo";
import { withHistory } from "../HistoryContext/HistoryContext";
import { CommentBox } from "../CommentBox/CommentBox";
import { Question } from "../Question/Question";
import { LoginBanner } from "../LoginBanner/LoginBanner";
import { SubmitResponseDialog } from "../SubmitResponseDialog/SubmitResponseDialog";

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
	history: HistoryType,
	basename: string,
};

type StateType = {
	consultationData: ConsultationDataType,
	commentsData: ReviewPageViewModelType,
	userHasSubmitted: boolean,
	validToSubmit: false,
	viewSubmittedComments: boolean,
	path: string,
	hasInitalData: boolean,
	allowComments: boolean,
	comments: Array<CommentType>,
	questions: Array<QuestionType>,
	sort: string,
	supportsDownload: boolean,
	loading: boolean,
	respondingAsOrganisation: boolean,
	organisationName: string,
	hasTobaccoLinks: boolean,
	tobaccoDisclosure: string,
};

export class ReviewListPage extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);
		this.state = {
			loading: true,
			consultationData: null,
			commentsData: null,
			userHasSubmitted: false,
			viewSubmittedComments: false,
			validToSubmit: false,
			path: null,
			hasInitalData: false,
			allowComments: false,
			comments: [], //this contains all the comments, not just the ones displayed to the user. the show property defines whether the comment is filtered out from view.
			questions: [], //this contains all the questions, not just the ones displayed to the user. the show property defines whether the question is filtered out from view.
			sort: "DocumentAsc",
			supportsDownload: false,
			respondingAsOrganisation: "",
			organisationName: "",
			hasTobaccoLinks: "",
			tobaccoDisclosure: "",

		};

		let preloadedData = {};
		if (this.props.staticContext && this.props.staticContext.preload) {
			preloadedData = this.props.staticContext.preload.data; //this is data from Configure => SupplyData in Startup.cs. the main thing it contains for this call is the cookie for the current user.
		}

		const querystring = this.props.location.search;
		const preloadedCommentsData = preload(
			this.props.staticContext,
			"commentsreview",
			[],
			Object.assign({ relativeURL: this.props.match.url }, queryStringToObject(querystring)),
			preloadedData
		);
		const consultationId = this.props.match.params.consultationId;
		const preloadedConsultationData = preload(
			this.props.staticContext,
			"consultation",
			[],
			{consultationId, isReview: true},
			preloadedData
		);

		if (preloadedCommentsData && preloadedConsultationData) {
			this.state = {
				path: this.props.basename + this.props.location.pathname,
				commentsData: preloadedCommentsData,
				consultationData: preloadedConsultationData,
				userHasSubmitted: preloadedConsultationData.consultationState.userHasSubmitted,
				validToSubmit: preloadedConsultationData.consultationState.supportsSubmission,
				loading: false,
				hasInitalData: true,
				allowComments: (preloadedConsultationData.consultationState.consultationIsOpen && !preloadedConsultationData.consultationState.userHasSubmitted),
				comments: preloadedCommentsData.commentsAndQuestions.comments,
				questions: preloadedCommentsData.commentsAndQuestions.questions,
				sort: preloadedCommentsData.sort,
				supportsDownload: preloadedConsultationData.consultationState.supportsDownload,
				viewSubmittedComments: false,
				organisationName: preloadedCommentsData.organisationName || "",
				respondingAsOrganisation: "",
				hasTobaccoLinks: "",
				tobaccoDisclosure: "",
			};
		}
	}

	gatherData = async () => {

		const querystring = this.props.history.location.search;
		const path = this.props.basename + this.props.location.pathname + querystring;
		this.setState({
			path,
		});

		//console.log(`sourceURI: ${this.props.match.url}`);
		//debugger;
		const commentsData = load("commentsreview", undefined, [], Object.assign({ relativeURL: this.props.match.url }, queryStringToObject(querystring)))
			.then(response => response.data)
			.catch(err => {
				if (window){
					//window.location.assign(path); // Fallback to full page reload if we fail to load data
				} else{
					throw new Error("failed to load comments for review.  " + err);
				}
			});

		if (this.state.consultationData === null){

			const consultationId = this.props.match.params.consultationId;
			const consultationData = load("consultation", undefined, [], {
				consultationId, isReview: true,
			})
				.then(response => response.data)
				.catch(err => {
					throw new Error("consultationData " + err);
				});

			return {
				consultationData: await consultationData,
				commentsData: await commentsData,
			};
		}
		return {
			consultationData: null,
			commentsData: await commentsData,
		};
	};

	loadDataAndUpdateState = () => {
		this.gatherData()
			.then(data => {
				if (data.consultationData !== null){
					this.setState({
						consultationData: data.consultationData,
						commentsData: data.commentsData,
						comments: data.commentsData.commentsAndQuestions.comments,
						questions: data.commentsData.commentsAndQuestions.questions,
						userHasSubmitted: data.consultationData.consultationState.userHasSubmitted,
						validToSubmit: data.consultationData.consultationState.supportsSubmission,
						loading: false,
						allowComments: (data.consultationData.consultationState.consultationIsOpen && !data.consultationData.consultationState.userHasSubmitted),
						supportsDownload: data.consultationData.consultationState.supportsDownload,
						sort: data.commentsData.sort,
						organisationName: data.commentsData.organisationName,
					});
				} else{
					this.setState({
						commentsData: data.commentsData,
						comments: data.commentsData.commentsAndQuestions.comments,
						questions: data.commentsData.commentsAndQuestions.questions,
						sort: data.commentsData.sort,
						loading: false,
						organisationName: data.commentsData.organisationName,
					});
				}
			})
			.catch(err => {
				throw new Error("gatherData in componentDidMount failed " + err);
			});
	};

	componentDidMount() {
		if (!this.state.hasInitalData){ //typically this page is accessed by clicking a link on the document page, so it won't SSR.
			this.loadDataAndUpdateState();
		}
		this.props.history.listen(() => {
			this.loadDataAndUpdateState();
		});
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldQueryString = prevProps.location.search;
		const newQueryString = this.props.location.search;
		if (oldQueryString === newQueryString) return;
		pullFocusById("comments-column");
	}

	submitConsultation = () => {
		const comments = this.state.comments;
		const questions = this.state.questions;
		const organisationName = this.state.organisationName;
		const tobaccoDisclosure = this.state.tobaccoDisclosure;
		const respondingAsOrganisation = this.state.respondingAsOrganisation === "yes";
		const hasTobaccoLinks = this.state.hasTobaccoLinks === "yes";

		let answersToSubmit = [];
		questions.forEach(function(question){
			if (question.answers != null){
				answersToSubmit = answersToSubmit.concat(question.answers);
			}
		});
		let submission = {
			comments,
			answers: answersToSubmit, 
			organisationName: respondingAsOrganisation ? organisationName : null,
			tobaccoDisclosure: hasTobaccoLinks ? tobaccoDisclosure : null,
			respondingAsOrganisation,
			hasTobaccoLinks,
		};
		load("submit", undefined, [], {}, "POST", submission, true)
			.then(() => {
				this.setState({
					userHasSubmitted: true,
					validToSubmit: false,
					viewSubmittedComments: false,
					allowComments: false,
				});
			})
			.catch(err => {
				console.log(err);
				if (err.response) alert(err.response.statusText);
			});
	};

	//this validation handler code is going to have to get a bit more advanced when questions are introduced, as it'll be possible
	//to answer a question on the review page and the submit button should then enable - if the consultation is open + hasn't already been submitted + all the mandatory questions are answered.
	//(plus there's the whole unsaved changes to deal with. what happens there?)
	validationHander = () => {
		const comments = this.state.comments;
		const questions = this.state.questions;
		let hasAnswers = false;
		questions.forEach(function(question){
			if (question.answers !== null && question.answers.length > 0){
				hasAnswers = true;
			}
		});
		const anyCommentsOrAnswers = comments.length > 0 || hasAnswers;
		this.setState({
			validToSubmit: anyCommentsOrAnswers,
			supportsDownload: anyCommentsOrAnswers,
		});
	};

	viewSubmittedCommentsHandler = () => {
		this.setState({
			viewSubmittedComments: true,
		});
	};

	fieldsChangeHandler = (e: SyntheticInputEvent) => {
		this.setState({
			[e.target.name]: e.target.value,
		});
	};

	//these handlers are in the helpers/editing-and-deleting.js utility file as they're also used in CommentList.js
	saveCommentHandler = (e: Event, comment: CommentType) => {
		saveCommentHandler(e, comment, this);
	};
	deleteCommentHandler = (e: Event, comment: CommentType) => {
		deleteCommentHandler(e, comment, this);
	};
	saveAnswerHandler = (e: Event, answer: AnswerType) => {
		saveAnswerHandler(e, answer, this);
	};
	deleteAnswerHandler = (e: Event,  questionId: number, answerId: number) => {
		deleteAnswerHandler(e, questionId, answerId, this);
	};

	getAppliedFilters(): ReviewAppliedFilterType[] {
		const mapOptions =
			(group: ReviewFilterGroupType) => group.options
				.filter(opt => opt.isSelected)
				.map(opt => ({
					groupTitle: group.title,
					optionLabel: opt.label,
					groupId: group.id,
					optionId: opt.id,
				}));

		return this.state.commentsData.filters
			.map(mapOptions)
			.reduce((arr, group) => arr.concat(group), []);
	}

	render() {
		if (this.state.loading) return <h1>Loading...</h1>;
		const { reference } = this.state.consultationData;
		const commentsToShow = this.state.comments.filter(comment => comment.show) || [];
		const questionsToShow = this.state.questions.filter(question => question.show) || [];

		return (
			<Fragment>
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<PhaseBanner
								phase={projectInformation.phase}
								name={projectInformation.name}
								repo={projectInformation.repo}
							/>
							<BreadCrumbs links={this.state.consultationData.breadcrumbs}/>
							<main role="main">
								<div className="page-header">
									<Header
										title={this.state.userHasSubmitted ? "Response submitted" : "Review your response"}
										subtitle1={this.state.userHasSubmitted ? "" : "Review and edit your question responses and comments before you submit them to us."}
										subtitle2={this.state.userHasSubmitted ? "" : "Once they have been submitted you will not be able to edit them further or add any extra comments."}
										reference={reference}
										consultationState={this.state.consultationData.consultationState}/>
									{this.state.supportsDownload &&
										<div className="clearfix">
											<button className="btn btn--secondary right mr--0">Download your response</button>
										</div>
									}									
									<UserContext.Consumer>
										{ (contextValue: ContextType) => {
											return (
												!contextValue.isAuthorised ?
													<LoginBanner
														signInButton={true}
														currentURL={this.props.match.url}
														signInURL={contextValue.signInURL}
														registerURL={contextValue.registerURL}
													/> :
													(
														(this.state.userHasSubmitted && !this.state.viewSubmittedComments) ?
															<div className="hero">
																<div className="hero__container">
																	<div className="hero__body">
																		<div className="hero__copy">
																			<p className="hero__intro" data-qa-sel="submitted-text">Thank you, your response has been submitted.</p>
																			<div className="hero__actions">
																				<button className="btn" data-qa-sel="review-submitted-comments" onClick={this.viewSubmittedCommentsHandler}>Review your response</button>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
															: (
																<div>
																	<div data-g="12 md:3" className="sticky">
																		<FilterPanel filters={this.state.commentsData.filters} path={this.state.path} />
																	</div>
																	<div data-g="12 md:9">
																		<ResultsInfo commentCount={commentsToShow.length}
																			showCommentsCount={this.state.consultationData.consultationState.shouldShowCommentsTab}
																			questionCount={questionsToShow.length}
																			showQuestionsCount={this.state.consultationData.consultationState.shouldShowQuestionsTab}
																			sortOrder={this.state.sort}
																			appliedFilters={this.getAppliedFilters()}
																			path={this.state.path}
																			isLoading={this.state.loading} />
																		<div data-qa-sel="comment-list-wrapper">
																			{questionsToShow.length > 0 &&
																				<div>
																					{/* <p>We would like to hear your views on the draft recommendations presented in the guideline, and any comments you may have on the rationale and impact sections in the guideline and the evidence presented in the evidence reviews documents. We would also welcome views on the Equality Impact Assessment.</p>
																					<p>We would like to hear your views on these questions:</p> */}
																					<ul className="CommentList list--unstyled">
																						{questionsToShow.map((question) => {
																							return (
																								<Question
																									readOnly={!this.state.allowComments || this.state.userHasSubmitted}
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
																			}
																			{commentsToShow.length === 0 ? <p>{/*No comments yet*/}</p> :
																				<ul className="CommentList list--unstyled">
																					{commentsToShow.map((comment) => {
																						return (
																							<CommentBox
																								readOnly={!this.state.allowComments || this.state.userHasSubmitted}
																								isVisible={this.props.isVisible}
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
																		<SubmitResponseDialog
																			isAuthorised={contextValue.isAuthorised}
																			userHasSubmitted={this.state.userHasSubmitted}
																			validToSubmit={this.state.validToSubmit}
																			submitConsultation={this.submitConsultation}
																			fieldsChangeHandler={this.fieldsChangeHandler}
																			respondingAsOrganisation={this.state.respondingAsOrganisation}
																			organisationName={this.state.organisationName}
																			hasTobaccoLinks={this.state.hasTobaccoLinks}
																			tobaccoDisclosure={this.state.tobaccoDisclosure}
																		/>
																	</div>																	
																</div>
															)
													)
											);
										}}
									</UserContext.Consumer>
								</div>
							</ main>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withRouter(withHistory(ReviewListPage));
