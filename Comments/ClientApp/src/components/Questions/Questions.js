// @flow

import React, { Component, Fragment } from "react";
import { Prompt, withRouter } from "react-router-dom";
import Helmet from "react-helmet";
import { LoginBanner } from "../LoginBanner/LoginBanner";
import { StackedNav } from "../StackedNav/StackedNav";
import { UserContext } from "../../context/UserContext";
import preload from "../../data/pre-loader";
import { load } from "../../data/loader";
import { OpenQuestion } from "../QuestionTypes/OpenQuestion/OpenQuestion";
import { YNQuestion } from "../QuestionTypes/YNQuestion/YNQuestion";
import { saveQuestionHandler, deleteQuestionHandler, moveQuestionHandler } from "../../helpers/editing-and-deleting";
import { updateUnsavedIds } from "../../helpers/unsaved-comments";
import { PreviouslySetQuestions } from "../PreviouslySetQuestions/PreviouslySetQuestions";
import { canUseDOM } from "../../helpers/utils";

type PropsType = {
	staticContext: ContextType;
	match: any;
	location: any;
	draftProject: boolean;
};

type StateType = {
	error: ErrorType;
	loading: boolean;
	hasInitialData: boolean;
	editingAllowed: boolean;
	questionsData: Object;
	unsavedIds: Array<string>;
};

export class Questions extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);

		this.state = {
			editingAllowed: true,
			questionsData: {},
			loading: true,
			hasInitialData: false,
			unsavedIds: [],
			error: {
				hasError: false,
				message: null,
			},
		};

		if (this.props) {
			
			let preloadedQuestionsData;
			let preloadedData = {};
			if (this.props.staticContext && this.props.staticContext.preload) {
				preloadedData = this.props.staticContext.preload.data;
			}
			const isAuthorised = ((preloadedData && preloadedData.isAuthorised) || (canUseDOM() && window.__PRELOADED__["isAuthorised"]));

			if (isAuthorised){

				preloadedQuestionsData = preload(
					this.props.staticContext,
					"questions",
					[],
					{
						consultationId: this.props.match.params.consultationId,
						draft: this.props.draftProject,
						reference: this.props.match.params.reference,
					},
					preloadedData,
					false //don't throw on exception, this could happen if the user has authenticated but doesn't have permission to access the feed.
				);

				if (preloadedQuestionsData) {
					this.state = {
						editingAllowed: true,
						questionsData: preloadedQuestionsData,
						loading: false,
						hasInitialData: true,
						unsavedIds: [],
						error: {
							hasError: false,
							message: null,
						},
					};
				}
			}
		}
	}

	gatherData = async () => {
		const questionsData = load(
			"questions",
			undefined,
			[],
			{
				consultationId: this.props.match.params.consultationId,
				draft: this.props.draftProject,
				reference: this.props.match.params.reference,
			},
		)
			.then(response => response.data)
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "questionsData " + err,
					},
				});
			});
		return {
			questionsData: await questionsData,
		};
	};

	componentDidMount() {
		if (!this.state.hasInitialData) {
			this.gatherData()
				.then(data => {
					this.setState({
						...data,
						loading: false,
						hasInitialData: true,
					});
				})
				.catch(err => {
					this.setState({
						error: {
							hasError: true,
							message: "gatherData in componentDidMount failed " + err,
						},
					});
				});
		}
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname;
		const newRoute = this.props.location.pathname;
		if (oldRoute === newRoute) return;
		this.setState({
			loading: true,
		});
		this.gatherData()
			.then(data => {
				this.setState({
					...data,
					loading: false,
					unsavedIds: [],
				});
			})
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "gatherData in componentDidMount failed " + err,
					},
				});
			});
	}

	getQuestionsToDisplay = (currentDocumentId: string | null, questionsData: Object) => {
		if (currentDocumentId === null) return;
		const isCurrentDocument = item => item.documentId.toString() === currentDocumentId;
		if (currentDocumentId === "consultation") return questionsData.consultationQuestions;
		return questionsData.documents.filter(isCurrentDocument)[0].documentQuestions;
	};

	saveQuestion = (event: Event, question: QuestionType) => {
		saveQuestionHandler(event, question, this);
	};

	deleteQuestion = (event: Event, question: QuestionType) => {
		deleteQuestionHandler(event, question, this);
	};

	updateUnsavedIds = (commentId: string, dirty: boolean) => {
		updateUnsavedIds(commentId, dirty, this);
	};

	moveQuestion = (event: Event, question: QuestionType, direction: string) => {
		moveQuestionHandler(event, question, direction, this);
	};

	newQuestion = (e: SyntheticEvent<HTMLElement>, consultationId: string, documentId: number | null, questionTypeId: number, questionContent: string = "") => {
		const newQuestion = {
			questionId: -1,
			questionTypeId,
			documentId,
			questionText: questionContent,
			sourceURI: "",
		};

		const questionsData = this.state.questionsData;
		let currentQuestions;
		if (documentId === null) {
			//	this is a consultation level question
			currentQuestions = questionsData.consultationQuestions;
			newQuestion.sourceURI = `consultations://./consultation/${consultationId}`;
		} else {
			// this is a document level question
			currentQuestions = questionsData.documents.filter(item => item.documentId === documentId)[0].documentQuestions;
			newQuestion.sourceURI = `consultations://./consultation/${consultationId}/document/${documentId}`;
		}
		this.setState({
			loading: true,
		});
		this.saveQuestion(e, newQuestion);
		currentQuestions.push(newQuestion);
		this.setState({questionsData});
	};

	createConsultationNavigation = (questionsData: Object, currentConsultationId: string, currentDocumentId: string | null) => {
		const isCurrentRoute = (documentId) => documentId.toString() === currentDocumentId;
		const {consultationTitle, consultationQuestions} = questionsData;
		return {
			title: "Add questions to consultation",
			links: [
				{
					label: consultationTitle,
					//url: `/admin/questions/${currentConsultationId}/consultation`,
					url: this.getUrlForNavigation(this.props.draftProject, currentConsultationId, "consultation", this.props.match.params.reference),
					marker: consultationQuestions.length || null,
					current: isCurrentRoute("consultation"),
					isReactRoute: true,
				},
			],
		};
	};

	createDocumentsNavigation = (
		questionsData: Object,
		currentConsultationId: string,
		currentDocumentId: string | null) => {
		const doesntHaveDocumentIdOfZero = document => document.documentId !== 0; // todo: to be replaced with convertedDocument when available on endpoint
		const isCurrentRoute = (documentId) => documentId.toString() === currentDocumentId;
		return {
			title: "Add questions to documents",
			links: questionsData.documents
				.filter(doesntHaveDocumentIdOfZero)
				.map(consultationDocument => {
					return {
						label: consultationDocument.title,
						url: this.getUrlForNavigation(this.props.draftProject, currentConsultationId, consultationDocument.documentId, this.props.match.params.reference),
						isReactRoute: true,
						marker: consultationDocument.documentQuestions.length || null,
						current: isCurrentRoute(consultationDocument.documentId),
					};
				}),
		};
	};

	getUrlForNavigation = (isDraft, currentConsultationId, documentId, reference) => {
		return isDraft ?
			`/admin/questions/preview/${reference}/${currentConsultationId}/${documentId}`
			: `/admin/questions/${currentConsultationId}/${documentId}`;
	};

	render() {
		if (!this.state.hasInitialData && this.state.loading) return <h1>Loading...</h1>;
		const {questionsData, unsavedIds} = this.state;
		// If there's no documentId, set currentDocumentId to null
		const currentDocumentId =
			this.props.match.params.documentId === undefined ? null : this.props.match.params.documentId;
		const currentConsultationId = this.props.match.params.consultationId;
		let questionsToDisplay = [];
		if (questionsData && questionsData.consultationQuestions) {
			questionsToDisplay = this.getQuestionsToDisplay(currentDocumentId, questionsData);
		}

		return (
			<UserContext.Consumer>
				{(contextValue: any) => !contextValue.isAuthorised ?
					<LoginBanner
						signInButton={false}
						currentURL={this.props.match.url}
						signInURL={contextValue.signInURL}
						registerURL={contextValue.registerURL}
						signInText="to administer a consultation"
					/>
					:
					<Fragment>
						<Prompt
							when={this.state.unsavedIds.length > 0}
							message={`You have ${unsavedIds.length} unsaved ${unsavedIds.length === 1 ? "change" : "changes"}. Continue without saving?`}
						/>
						<Helmet>
							<title>Set Questions</title>
						</Helmet>
						<div className="container">
							<div className="grid">
								<div data-g="12">
									<h1 className="h3">{questionsData.consultationTitle}</h1>
									<div className="grid">
										<div data-g="12 md:5">
											<StackedNav
												links={
													this.createConsultationNavigation(
														questionsData,
														currentConsultationId,
														currentDocumentId)}/>
											<StackedNav
												links={
													this.createDocumentsNavigation(
														questionsData,
														currentConsultationId,
														currentDocumentId)}/>
										</div>
										<div data-g="12 md:7">
											{currentDocumentId ?
												<Fragment>
													{questionsToDisplay && questionsToDisplay.map((question, index) => {
														if (question.questionId <= 0) return null;
														const questionProps = {
															isFirst: index === 0,
															isLast: questionsToDisplay.length === index + 1,
															counter: index + 1,
															readOnly: !this.state.editingAllowed,
															updateUnsavedIds: this.updateUnsavedIds,
															key: question.questionId,
															question: question,
															saveQuestion: this.saveQuestion,
															deleteQuestion: this.deleteQuestion,
															moveQuestion: this.moveQuestion,
															totalQuestionQty: questionsToDisplay.length,
														};
														if (question.questionType.type === "YesNo") {
															return (
																<YNQuestion {...questionProps}/>
															);
														}
														if (question.questionType.type === "Text") {
															return (
																<OpenQuestion {...questionProps}/>
															);
														}
														return null;
													})}
													{questionsData.questionTypes.map(item => (
														<AddQuestionButton
															newQuestion={this.newQuestion}
															key={`key-${item.questionTypeId}`}
															{...item}
															loading={this.state.loading}
															currentDocumentId={currentDocumentId}
															currentConsultationId={currentConsultationId}
														/>
													))}

													<PreviouslySetQuestions
														currentUserRoles={questionsData.currentUserRoles}
														currentConsultationId={currentConsultationId}
														currentDocumentId={currentDocumentId}
														questions={questionsData.previousQuestions}
														newQuestion={this.newQuestion}/>

												</Fragment>
												:
												<p>Choose consultation title or document to add questions.</p>
											}
										</div>
									</div>
								</div>
							</div>
						</div>
					</Fragment>
				}
			</UserContext.Consumer>
		);
	}
}

export default withRouter(Questions);

export const AddQuestionButton = props => {
	const {type, questionTypeId, loading, currentDocumentId, currentConsultationId, newQuestion} = props;
	const buttonText = type === "YesNo" ? "Add a yes/no question" : "Add an open question";
	const documentId = currentDocumentId === "consultation" ? null : parseInt(currentDocumentId, 10);
	return (
		<button
			className="btn btn--cta"
			disabled={loading}
			onClick={e => {
				newQuestion(
					e,
					currentConsultationId,
					documentId,
					questionTypeId);
			}
			}
		>{buttonText}</button>
	);
};
