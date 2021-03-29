// @flow

import React, { Component } from "react";
import { withRouter, Prompt, Redirect } from "react-router-dom";
import Helmet from "react-helmet";

import preload from "../../data/pre-loader";
import { load } from "../../data/loader";
import {
	saveCommentHandler,
	deleteCommentHandler,
	saveAnswerHandler,
	deleteAnswerHandler,
} from "../../helpers/editing-and-deleting";
import { queryStringToObject } from "../../helpers/utils";
import { tagManager } from "../../helpers/tag-manager";
import { UserContext } from "../../context/UserContext";
import { Header } from "../Header/Header";
import BreadCrumbsWithRouter from "../Breadcrumbs/Breadcrumbs";
import { FilterPanel } from "../FilterPanel/FilterPanel";
import { ReviewResultsInfo } from "../ReviewResultsInfo/ReviewResultsInfo";
import { withHistory } from "../HistoryContext/HistoryContext";
import { CommentBox } from "../CommentBox/CommentBox";
import { Question } from "../Question/Question";
import LoginBannerWithRouter from "../LoginBanner/LoginBanner";
import { SubmitResponseDialog } from "../SubmitResponseDialog/SubmitResponseDialog";
import { SubmittedContent}  from "../SubmittedContent/SubmittedContent";
import { updateUnsavedIds } from "../../helpers/unsaved-comments";
import { pullFocusByQuerySelector } from "../../helpers/accessibility-helpers";

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
	announceAssertive: Function,
};

type StateType = {
	consultationData: ConsultationDataType | null,
	commentsData: ReviewPageViewModelType | null,
	submittedDate: Date,
	validToSubmit: false,
	path: string | null,
	hasInitialData: boolean,
	allowComments: boolean,
	comments: Array<CommentType>,
	questions: Array<QuestionType>,
	sort: string,
	supportsDownload: boolean,
	loading: boolean,
	respondingAsOrganisation: boolean | null,
	organisationName: string,
	hasTobaccoLinks: boolean | null,
	tobaccoDisclosure: string,
	organisationExpressionOfInterest: boolean | null,
	unsavedIds: Array<number>,
	documentTitles: "undefined" | Array<any>,
	justSubmitted: boolean,
	path: null | string,
	isLead: boolean,
	emailAddress: string | null,
};

export class Review extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);
		this.state = {
			loading: true,
			consultationData: null,
			commentsData: null,
			submittedDate: null,
			validToSubmit: false,
			path: null,
			hasInitialData: false,
			allowComments: false,
			comments: [], //this contains all the comments, not just the ones displayed to the user. the show property defines whether the comment is filtered out from view.
			questions: [], //this contains all the questions, not just the ones displayed to the user. the show property defines whether the question is filtered out from view.
			sort: "DocumentAsc",
			supportsDownload: false,
			respondingAsOrganisation: null,
			organisationName: "",
			hasTobaccoLinks: null,
			tobaccoDisclosure: "",
			organisationExpressionOfInterest: null,
			unsavedIds: [],
			documentTitles: [],
			justSubmitted: false,
			isLead: false,
			emailAddress: null,
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
			Object.assign({relativeURL: this.props.match.url}, queryStringToObject(querystring)),
			preloadedData,
		);
		const consultationId = this.props.match.params.consultationId;
		const preloadedConsultationData = preload(
			this.props.staticContext,
			"consultation",
			[],
			{consultationId, isReview: true},
			preloadedData,
		);

		if (preloadedCommentsData && preloadedConsultationData) {
			if (this.props.staticContext) {
				this.props.staticContext.analyticsGlobals.gidReference = preloadedConsultationData.reference;
				this.props.staticContext.analyticsGlobals.consultationId = preloadedConsultationData.consultationId;
				this.props.staticContext.analyticsGlobals.consultationTitle = preloadedConsultationData.title;
				this.props.staticContext.analyticsGlobals.stage = preloadedConsultationData.consultationState.submittedDate ? "postsubmission" : "presubmission";
			}
			this.state = {
				path: this.props.basename + this.props.location.pathname,
				commentsData: preloadedCommentsData,
				consultationData: preloadedConsultationData,
				submittedDate: preloadedConsultationData.consultationState.submittedDate,
				validToSubmit: preloadedConsultationData.consultationState.supportsSubmission,
				loading: false,
				hasInitialData: true,
				allowComments: (preloadedConsultationData.consultationState.consultationIsOpen && !preloadedConsultationData.consultationState.submittedDate),
				comments: preloadedCommentsData.commentsAndQuestions.comments,
				questions: preloadedCommentsData.commentsAndQuestions.questions,
				sort: preloadedCommentsData.sort,
				supportsDownload: preloadedConsultationData.consultationState.supportsDownload,
				organisationName: preloadedCommentsData.organisationName || "",
				respondingAsOrganisation: (preloadedCommentsData.isLead ? true : null),
				hasTobaccoLinks: null,
				organisationExpressionOfInterest: null,
				tobaccoDisclosure: "",
				unsavedIds: [],
				documentTitles: this.getListOfDocuments(preloadedCommentsData.filters),
				justSubmitted: false,
				isLead: preloadedCommentsData.isLead,
				emailAddress: "",
			};
		}

		let isSSR = false;
		if (this.props.staticContext) {
			isSSR = true;
		}
		const message = `Review page log hit at ${new Date().toJSON()}. running as ${process.env.NODE_ENV} SSR: ${isSSR}`;
		preload(this.props.staticContext, "logging", [], {logLevel: "Warning"}, null, false, "POST", {}, {message}, true);

	}

	//this is temporary for debug purposes.
	logStuff = () => {

		let isSSR = false;
		if (this.props.staticContext) {
			isSSR = true;
		}
		const message = `Review page log hit at ${new Date().toJSON()}. running as ${process.env.NODE_ENV} SSR: ${isSSR}`;

		load("logging", undefined, [], {logLevel: "Warning"}, "POST", {message}, true)
			.then(response => response.data)
			.catch(err => {
				console.error(err);
			});
	};

	gatherData = async () => {
		const querystring = this.props.history.location.search;
		const path = this.props.basename + this.props.location.pathname + this.props.history.location.search;
		this.setState({
			path,
		});
		const commentsData = load("commentsreview", undefined, [], Object.assign({relativeURL: this.props.match.url}, queryStringToObject(querystring)))
			.then(response => response.data)
			.catch(err => {
				if (window) {
					//window.location.assign(path); // Fallback to full page reload if we fail to load data
				} else {
					throw new Error("failed to load comments for review.  " + err);
				}
			});

		if (this.state.consultationData === null) {

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

	loadDataAndUpdateState = (callback?: Function) => {
		this.gatherData()
			.then(data => {
				if (data.consultationData !== null) {
					this.setState({
						consultationData: data.consultationData,
						commentsData: data.commentsData,
						comments: data.commentsData.commentsAndQuestions.comments,
						questions: data.commentsData.commentsAndQuestions.questions,
						submittedDate: data.consultationData.consultationState.submittedDate,
						validToSubmit: data.consultationData.consultationState.supportsSubmission,
						loading: false,
						allowComments: (data.consultationData.consultationState.consultationIsOpen && !data.consultationData.consultationState.submittedDate),
						supportsDownload: data.consultationData.consultationState.supportsDownload,
						sort: data.commentsData.sort,
						organisationName: data.commentsData.organisationName || "",
						documentTitles: this.getListOfDocuments(data.commentsData.filters),
						isLead: data.commentsData.isLead,
						respondingAsOrganisation: (data.commentsData.isLead ? true : null),
					});
				} else {
					this.setState({
						commentsData: data.commentsData,
						comments: data.commentsData.commentsAndQuestions.comments,
						questions: data.commentsData.commentsAndQuestions.questions,
						sort: data.commentsData.sort,
						loading: false,
						organisationName: data.commentsData.organisationName || "",
						documentTitles: this.getListOfDocuments(data.commentsData.filters),
						isLead: data.commentsData.isLead,
						respondingAsOrganisation: (data.commentsData.isLead ? true : null),
					}, () => {
						tagManager({
							event: "generic",
							category: "Consultation comments page",
							action: "Clicked",
							label: "Review filter",
						});
					});
				}
				if (data.consultationData !== null) {
					tagManager({
						event: "pageview",
						gidReference: this.state.consultationData.reference,
						title: this.getPageTitle(true),
						stage: this.state.consultationData.consultationState.submittedDate ? "postsubmission" : "presubmission",
					});
				}
				if (callback) callback();
			})
			.catch(err => {
				throw new Error("gatherData in componentDidMount failed " + err);
			});
	};

	componentWillUnmount() {
		this.unlisten();
	}

	componentDidMount() {
		if (!this.state.hasInitialData) { // if this statement is true then we know we've come from another page
			this.loadDataAndUpdateState(()=>{
				pullFocusByQuerySelector("#root");
			});
		}
		this.unlisten = this.props.history.listen(() => {
			const path = this.props.basename + this.props.location.pathname + this.props.history.location.search;
			if (!this.state.path || path !== this.state.path) {
				this.loadDataAndUpdateState();
			}
		});
	}

	unlisten = () => {
	};

	submitConsultation = () => {
		const comments = this.state.comments;
		const questions = this.state.questions;
		const organisationName = this.state.organisationName;
		const tobaccoDisclosure = this.state.tobaccoDisclosure;
		const respondingAsOrganisation = this.state.respondingAsOrganisation;
		const hasTobaccoLinks = this.state.hasTobaccoLinks;
		const organisationExpressionOfInterest = (this.state.consultationData.showExpressionOfInterestSubmissionQuestion ? (this.state.organisationExpressionOfInterest) : null);

		let answersToSubmit = [];
		questions.forEach(function (question) {
			if (question.answers != null) {
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
			organisationExpressionOfInterest,
		};
		load("submit", undefined, [], {}, "POST", submission, true)
			.then(response => {
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Response submitted",
					label: `${response.data.comments ? response.data.comments.length : "0"} comments, ${response.data.answers ? response.data.answers.length : "0"} answers`,
				});
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Length to submit response",
					label: "Duration in minutes",
					value: (Math.round(response.data.durationBetweenFirstCommentOrAnswerSavedAndSubmissionInSeconds / 60)),
				});
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Submission mandatory questions",
					label: `${response.data.respondingAsOrganisation ? "Yes" : "No"}, ${response.data.hasTobaccoLinks ? "Yes" : "No"}`,
				});
				this.setState({
					submittedDate: true,
					validToSubmit: false,
					allowComments: false,
					justSubmitted: true,
				});
				this.logStuff();
			})
			.catch(err => {
				console.log(err);
				if (err.response) alert(err.response.statusText);
			});
	};

	submitToLead = (organisationName) => {
		const comments = this.state.comments;
		const questions = this.state.questions;
		const emailAddress = this.state.emailAddress;

		let answersToSubmit = [];
		questions.forEach(function (question) {
			if (question.answers != null) {
				answersToSubmit = answersToSubmit.concat(question.answers);
			}
		});

		load("submitToLead", undefined, [], {}, "POST", {
			emailAddress,
			comments,
			answers: answersToSubmit,
			organisationName,
			respondingAsOrganisation: true,
		}, true)
			.then(response => {
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Response submitted to lead",
					label: `${response.data.comments ? response.data.comments.length : "0"} comments, ${response.data.answers ? response.data.answers.length : "0"} answers`,
				});
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Length to submit response to lead",
					label: "Duration in minutes",
					value: (Math.round(response.data.durationBetweenFirstCommentOrAnswerSavedAndSubmissionInSeconds / 60)),
				});
				this.setState({
					submittedDate: true,
					validToSubmit: false,
					allowComments: false,
					justSubmitted: true,
				});
				this.logStuff();
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
		questions.forEach(function (question) {
			if (question.answers !== null && question.answers.length > 0) {
				hasAnswers = true;
			}
		});
		const anyCommentsOrAnswers = comments.length > 0 || hasAnswers;
		this.setState({
			validToSubmit: anyCommentsOrAnswers,
			supportsDownload: anyCommentsOrAnswers,
		});
	};

	fieldsChangeHandler = (e: SyntheticInputEvent<*>) => {
		if(e.target.type === "radio"){
			let value = e.target.value;
			if(e.target.value==="true") value = true;
			if(e.target.value==="false") value = false;
			this.setState({
				[e.target.name]: value,
			});
		}else{
			this.setState({
				[e.target.name]: e.target.value,
			});
		}
	};

	issueA11yMessage = (message: string) => {
		const unique = new Date().getTime().toString();
		// announcer requires a unique id so we're able to repeat phrases
		this.props.announceAssertive(message, unique);
	};

	//these handlers are in the helpers/editing-and-deleting.js utility file as they're also used in CommentList.js
	saveCommentHandler = (e: Event, comment: CommentType) => {
		saveCommentHandler(e, comment, this);
	};

	deleteCommentHandler = (e: Event, comment: CommentType) => {
		deleteCommentHandler(e, comment, this);
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

	getListOfDocuments = (filters: Array<any>) => {
		if (!filters) return;
		return filters.filter(item => item.id === "Document")[0].options
			.map(item => {
				return {
					id: item.id,
					title: item.label,
				};
			});
	};

	getDocumentTitle = (documentId: string) => {
		if (documentId && documentId !== null) {
			// this catch is here temporarily until we have a way to administer questions (it's possible that questions have been placed on documents that are not set to support questions)
			try {
				return this.state.documentTitles.filter(item => item.id === documentId.toString())[0].title;
			}
			catch (err) {
				return "Consultation document ID " + documentId;
			}

		}
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

	getPageTitle = (isForAnalytics: boolean = false) => {
		if (isForAnalytics) return this.state.consultationData.title;
		return `${this.state.consultationData.title} | Review your response`;
	};

	render() {
		if (this.state.loading) return <h1>Loading...</h1>;
		if (this.state.justSubmitted) return <Redirect push to={"submitted"}/>;
		const {reference} = this.state.consultationData;
		const commentsToShow = this.state.comments.filter(comment => comment.show) || [];
		const questionsToShow = this.state.questions.filter(question => question.show) || [];

		let headerSubtitle1 = "Review and edit your question responses and comments before you submit them to us.";
		let headerSubtitle2 = "Once they have been submitted you will not be able to edit them further or add any extra comments.";

		return (
			<>
				<Helmet>
					<title>{this.getPageTitle()}</title>
				</Helmet>
				<Prompt
					when={this.state.unsavedIds.length > 0}
					message={`You have ${this.state.unsavedIds.length} unsaved ${this.state.unsavedIds.length === 1 ? "change" : "changes"}. Continue without saving?`}
				/>
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<BreadCrumbsWithRouter links={this.state.consultationData.breadcrumbs}/>
							<UserContext.Consumer>
								{(contextValue: ContextType) => {

									if (contextValue.isOrganisationCommenter && !contextValue.isLead) {
										headerSubtitle1 = `On this page you can review and edit your response to the consultation before you send them to ${contextValue.organisationName}.`;
										headerSubtitle2 = "Once you have sent your response you will not be able to edit it or add any more comments.";
									}

									return (
										!contextValue.isAuthorised ?
											<LoginBannerWithRouter
												signInButton={true}
												currentURL={this.props.match.url}
												signInURL={contextValue.signInURL}
												registerURL={contextValue.registerURL}
												allowOrganisationCodeLogin={false}
												orgFieldName="review"
											/> :
											<main>
												<div className="page-header">
													<Header
														title={this.state.submittedDate ? "Response submitted" : "Review your response"}
														subtitle1={this.state.submittedDate ? "" : headerSubtitle1}
														subtitle2={this.state.submittedDate ? "" : headerSubtitle2}
														reference={reference}
														consultationState={this.state.consultationData.consultationState}
													/>

													<SubmittedContent
														organisationName={contextValue.organisationName}
														isOrganisationCommenter={contextValue.isOrganisationCommenter}
														isLead={contextValue.isLead}
														consultationState={this.state.consultationData.consultationState}
														consultationId={this.props.match.params.consultationId}
														basename={this.props.basename}
														isSubmitted={this.state.submittedDate}
														linkToReviewPage={false}
													/>

													<div className="grid">
														<div data-g="12 md:3" className="sticky">
															<h2 className="h5 mt--0">Filter</h2>
															<FilterPanel filters={this.state.commentsData.filters} path={this.state.path}/>
														</div>
														<div data-g="12 md:9">
															<ReviewResultsInfo
																commentCount={commentsToShow.length}
																showCommentsCount={this.state.consultationData.consultationState.shouldShowCommentsTab}
																questionCount={questionsToShow.length}
																showQuestionsCount={this.state.consultationData.consultationState.shouldShowQuestionsTab}
																sortOrder={this.state.sort}
																appliedFilters={this.getAppliedFilters()}
																path={this.state.path}
																isLoading={this.state.loading}/>
															<div data-qa-sel="comment-list-wrapper">
																{questionsToShow.length > 0 &&
																<div>
																	<ul className="CommentList list--unstyled">
																		{questionsToShow.map((question) => {
																			const isUnsaved = this.state.unsavedIds.includes(`${question.questionId}q`);
																			return (
																				<Question
																					showAnswer={contextValue.isAuthorised}
																					updateUnsavedIds={this.updateUnsavedIds}
																					isUnsaved={isUnsaved}
																					readOnly={!this.state.allowComments || this.state.submittedDate}
																					key={question.questionId}
																					unique={`Comment${question.questionId}`}
																					question={question}
																					saveAnswerHandler={this.saveAnswerHandler}
																					deleteAnswerHandler={this.deleteAnswerHandler}
																					documentTitle={this.getDocumentTitle(question.documentId)}
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
																					readOnly={!this.state.allowComments || this.state.submittedDate}
																					isVisible={this.props.isVisible}
																					key={comment.commentId}
																					unique={`Comment${comment.commentId}`}
																					comment={comment}
																					documentTitle={this.getDocumentTitle(comment.documentId)}
																					saveHandler={this.saveCommentHandler}
																					deleteHandler={this.deleteCommentHandler}
																					updateUnsavedIds={this.updateUnsavedIds}
																				/>
																			);
																		})}
																	</ul>
																}
															</div>
															{!this.state.consultationData.consultationState.submittedDate &&
															<SubmitResponseDialog
																unsavedIds={this.state.unsavedIds}
																isAuthorised={contextValue.isAuthorised}
																submittedDate={this.state.submittedDate}
																validToSubmit={this.state.validToSubmit}
																submitConsultation={this.submitConsultation}
																fieldsChangeHandler={this.fieldsChangeHandler}
																submitToLead={this.submitToLead}
																respondingAsOrganisation={this.state.respondingAsOrganisation}
																organisationName={contextValue.isOrganisationCommenter ? contextValue.organisationName : this.state.organisationName}
																hasTobaccoLinks={this.state.hasTobaccoLinks}
																tobaccoDisclosure={this.state.tobaccoDisclosure}
																showExpressionOfInterestSubmissionQuestion={this.state.consultationData.showExpressionOfInterestSubmissionQuestion}
																organisationExpressionOfInterest={this.state.organisationExpressionOfInterest}
																isLead={contextValue.isLead}
																isOrganisationCommenter={contextValue.isOrganisationCommenter}
																questions={this.state.questions}
																emailAddress={this.state.emailAddress}
															/>
															}
														</div>
													</div>
												</div>
											</ main>
									);
								}}
							</UserContext.Consumer>
						</div>
					</div>
				</div>
			</>
		);
	}
}

export default withRouter(withHistory(Review));
