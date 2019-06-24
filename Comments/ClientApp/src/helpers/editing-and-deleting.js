// @flow

import {load} from "../data/loader";
import {tagManager} from "./tag-manager";

// Comments =================================== //

export function saveCommentHandler(event: Event, comment: CommentType, self: any) {
	event.preventDefault();

	const originalId = comment.commentId;
	const isANewComment = comment.commentId < 0;
	const method = isANewComment ? "POST" : "PUT";
	const urlParameters = isANewComment ? [] : [comment.commentId];
	const endpointName = isANewComment ? "newcomment" : "editcomment";
	let error = "";

	load(endpointName, undefined, urlParameters, {}, method, comment, true)
		.then(res => {
			if (res.status === 201 || res.status === 200) {
				const index = self.state.comments
					.map(function (comment) {
						return comment.commentId;
					})
					.indexOf(comment.commentId);
				const comments = self.state.comments;
				comments[index] = res.data;
				self.setState({
					comments,
					error,
				});
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Clicked",
					label: "Comment saved button",
				});
				tagManager({
					event: "pageview",
					gidReference: window.analyticsGlobals.gidReference,
					title: window.analyticsGlobals.consultationTitle,
					stage: "save",
				});
				self.updateUnsavedIds(`${originalId}c`, false);
				if (typeof self.issueA11yMessage === "function") {
					self.issueA11yMessage("Comment saved");
				}
				if (typeof self.validationHander === "function") {
					self.validationHander();
				}
			}
		})
		.catch(err => {
			console.log(err);
			if (err.response) {
				error = "save";
				self.setState({
					error,
				});
				if (typeof self.issueA11yMessage === "function") {
					self.issueA11yMessage("There was a problem saving this comment");
				}
			}
		});
}

export function deleteCommentHandler(event: Event, commentId: number, self: any) {
	event.preventDefault();
	if (commentId < 0) {
		removeCommentFromState(commentId, self);
	} else {
		load("editcomment", undefined, [commentId], {}, "DELETE")
			.then(res => {
				if (res.status === 200) {
					removeCommentFromState(commentId, self);
				}
			})
			.catch(err => {
				console.log(err);
				if (err.response) {
					const error = "delete";
					self.setState({
						error,
					});
					if (typeof self.issueA11yMessage === "function") {
						self.issueA11yMessage("There was a problem deleting this comment");
					}
				}
			});
	}
}

function removeCommentFromState(commentId: number, self: any) {
	self.updateUnsavedIds(`${commentId}c`, false);
	if (typeof self.issueA11yMessage === "function") {
		self.issueA11yMessage("Comment deleted");
	}
	tagManager({
		action: "Clicked",
		label: "Comment deleted button",
		event: "generic",
		category: "Consultation comments page",
	});
	let comments = self.state.comments;
	const error = "";
	comments = comments.filter(comment => comment.commentId !== commentId);
	self.setState({comments, error});
	if ((comments.length === 0) && (typeof self.validationHander === "function")) {
		self.validationHander();
	}
}

// Answers =================================== //

export function saveAnswerHandler(event: Event, answer: AnswerType, questionId: number, self: any) {
	event.preventDefault();
	const isANewAnswer = answer.answerId < 0;
	const method = isANewAnswer ? "POST" : "PUT";
	const urlParameters = isANewAnswer ? [] : [answer.answerId];
	const endpointName = isANewAnswer ? "newanswer" : "editanswer";

	load(endpointName, undefined, urlParameters, {}, method, answer, true)
		.then(res => {
			if (res.status === 201 || res.status === 200) {
				const questionIndex = self.state.questions
					.map(function (question) {
						return question.questionId;
					})
					.indexOf(answer.questionId);
				const questions = self.state.questions;

				if (questions[questionIndex].answers === null || questions[questionIndex].answers.length < 1) {
					questions[questionIndex].answers = [res.data];
				} else {
					const answerIndex = questions[questionIndex].answers
						.map(function (answer) {
							return answer.answerId;
						}).indexOf(answer.answerId);

					const answers = questions[questionIndex].answers;
					answers[answerIndex] = res.data;
					questions[questionIndex].answers = answers;
				}
				self.setState({
					questions,
				});
				tagManager({
					event: "generic",
					category: "Consultation comments page",
					action: "Clicked",
					label: "Save answer button",
				});
				tagManager({
					event: "pageview",
					gidReference: window.analyticsGlobals.gidReference,
					title: window.analyticsGlobals.consultationTitle,
					stage: "save",
				});
				self.updateUnsavedIds(`${questionId}q`, false);
				if (typeof self.issueA11yMessage === "function") {
					self.issueA11yMessage("Answer saved");
				}
				if (typeof self.validationHander === "function") {
					self.validationHander();
				}
			}
		})
		.catch(err => {
			console.log(err);
			if (typeof self.issueA11yMessage === "function") {
				self.issueA11yMessage("There was a problem saving this answer");
			}
			if (err.response) alert(err.response.statusText);
		});
}

export function deleteAnswerHandler(event: Event, questionId: number, answerId: number, self: any) {
	event.preventDefault();
	if (answerId < 0) {
		removeAnswerFromState(questionId, answerId, self);
	} else {
		load("editanswer", undefined, [answerId], {}, "DELETE")
			.then(res => {
				if (res.status === 200) {
					removeAnswerFromState(questionId, answerId, self);
				}
			})
			.catch(err => {
				console.log(err);
				if (err.response) alert(err.response.statusText);
				if (typeof self.issueA11yMessage === "function") {
					self.issueA11yMessage("There was a problem deleting this answer");
				}
			});
	}
}

function removeAnswerFromState(questionId: number, answerId: number, self: any) {
	self.updateUnsavedIds(`${questionId}q`, false);
	let questions = self.state.questions;
	let questionToUpdate = questions.find(question => question.questionId === questionId);
	questionToUpdate.answers = questionToUpdate.answers.filter(answer => answer.answerId !== answerId);
	self.setState({questions});
	if (typeof self.validationHander === "function") {
		self.validationHander();
	}
	if (typeof self.issueA11yMessage === "function") {
		self.issueA11yMessage("Answer deleted");
	}
	tagManager({
		action: "Clicked",
		label: "Delete answer button",
		event: "generic",
		category: "Consultation comments page",
	});
}

// Questions ================================= //

export function saveQuestionHandler(event: Event, question: QuestionType, self: any) {
	event.preventDefault();
	const originalQuestionId = question.questionId;
	const isANewQuestion = question.questionId < 0;
	const method = isANewQuestion ? "POST" : "PUT";
	const endpoint = isANewQuestion ? "newquestion" : "question";
	const urlParameters = isANewQuestion ? [] : [question.questionId];

	let error = "";

	load(endpoint, undefined, urlParameters, {}, method, question, true)
		.then(res => {
			if (res.status === 201 || res.status === 200) {

				const updatedQuestion = res.data;
				const documentId = updatedQuestion.documentId;
				const questionsData = self.state.questionsData;
				let relevantQuestions;

				// if we've updated a document's question, go to that document's documentQuestions
				if (documentId) {
					relevantQuestions = questionsData.documents.filter(item => item.documentId === documentId)[0].documentQuestions;
				} else { 
					if (question.isSubmissionQuestion){
						relevantQuestions = questionsData.submissionQuestions;
					} else{
						// otherwise presume that we're updating a consultation's question
						relevantQuestions = questionsData.consultationQuestions;
					}
				}
				const index = relevantQuestions.map(item => item.questionId).indexOf(originalQuestionId);
				relevantQuestions[index] = updatedQuestion;

				self.setState({
					questionsData,
				});
				self.updateUnsavedIds(`${originalQuestionId}q`, false);
			}
		})
		.catch(err => {
			console.log(err);
			if (err.response) {
				error = "save";
				self.setState({
					error,
				});
				if (typeof self.issueA11yMessage === "function") {
					self.issueA11yMessage("There was a problem saving this question");
				}
			}
		});
}

export function deleteQuestionHandler(event: Event, question: QuestionType, self: any) {
	event.preventDefault();
	// if it's an unsaved question...
	if (question.questionId < 0) {
		removeQuestionFromState(question, self);
	}
	// if it's a previously saved question (and therefore has an ID from the database)
	else {
		load("question", undefined, [question.questionId], {}, "DELETE")
			.then(res => {
				if (res.status === 200) {
					removeQuestionFromState(question, self);
				}
			})
			.catch(err => {
				console.log(err);
				if (err.response) alert(err.response.statusText);
			});
	}
}

export function moveQuestionHandler(event: Event, question: QuestionType, direction: string, self: any) {
	event.preventDefault();

	self.setState({
		loading: true,
	});

	const questions = question.documentId === null ?
		(question.isSubmissionQuestion ? self.state.questionsData.submissionQuestions : self.state.questionsData.consultationQuestions) :
		self.state.questionsData.documents.find(document => document.documentId === question.documentId).documentQuestions;
	const questionIndex = questions.findIndex(q => q.questionId === question.questionId);
	let updateableQuestionIndex = null;
	let moveQuestion = false;

	if(direction.indexOf("up") !== -1 && questionIndex!==0) {
		updateableQuestionIndex = questionIndex-1;
		moveQuestion = true;
	} else if (direction.indexOf("down") !== -1 && questionIndex!==questions.length-1) {
		updateableQuestionIndex = questionIndex+1;
		moveQuestion = true;
	}

	if (moveQuestion === true){

		let originalQuestion = Object.assign({}, question);
		let updateableQuestion = Object.assign({}, questions[updateableQuestionIndex]);
		let originalQuestionOrder = originalQuestion.order;

		originalQuestion.order = updateableQuestion.order;
		updateableQuestion.order = originalQuestionOrder;

		let error = "";

		load("question", undefined, [originalQuestion.questionId], {}, "PUT", originalQuestion, true)
			.then(res => {
				if (res.status === 201 || res.status === 200) {
					load("question", undefined, [updateableQuestion.questionId], {}, "PUT", updateableQuestion, true)
						.then(res => {
							if (res.status === 201 || res.status === 200) {
								self.gatherData()
									.then(data => {
										self.setState({
											loading: false,
											questionsData: data.questionsData,
										});
									})
									.catch(err => {
										self.setState({
											error: {
												hasError: true,
												message: "gatherData in componentDidMount failed " + err,
											},
										});
									});
							}
						})
						.catch(err => {
							console.log(err);
							if (err.response) {
								error = "save";
								self.setState({
									loading:false,
									error,
								});
								if (typeof self.issueA11yMessage === "function") {
									self.issueA11yMessage("There was a problem moving this question");
								}
							}
						});
				}
			})
			.catch(err => {
				console.log(err);
				if (err.response) {
					error = "save";
					self.setState({
						loading:false,
						error,
					});
					if (typeof self.issueA11yMessage === "function") {
						self.issueA11yMessage("There was a problem moving this question");
					}
				}
			});
	}
}

function removeQuestionFromState(question: QuestionType, self: any) {
	self.updateUnsavedIds(`${question.questionId}q`, false);
	const questions = self.state.questionsData;
	let currentQuestions;
	if (question.documentId === null) { 
		if (question.isSubmissionQuestion){
			// we know it's a submission  question
			currentQuestions = questions.submissionQuestions;
		} else{
			// we know it's a consultation level question
			currentQuestions = questions.consultationQuestions;
		}		
	} else {
		currentQuestions = questions.documents.filter(item => {
			return item.documentId === question.documentId;
		})[0].documentQuestions;
	}
	const index = currentQuestions
		.map(question => question.questionId)
		.indexOf(question.questionId);
	currentQuestions.splice(index, 1);
	self.setState({questions});
}
