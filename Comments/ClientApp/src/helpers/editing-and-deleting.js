// @flow

import { load } from "../data/loader";
import { tagManager } from "./tag-manager";

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
					.map(function(comment) {
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
					.map(function(question) {
						return question.questionId;
					})
					.indexOf(answer.questionId);
				const questions = self.state.questions;

				if (questions[questionIndex].answers === null || questions[questionIndex].answers.length < 1){
					questions[questionIndex].answers = [res.data];
				} else{
					const answerIndex = questions[questionIndex].answers
						.map(function(answer) {
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
	self.setState({ comments, error });
	if ((comments.length === 0) && (typeof self.validationHander === "function")) {
		self.validationHander();
	}
}

function removeAnswerFromState(questionId: number, answerId: number, self: any) {
	self.updateUnsavedIds(`${questionId}q`, false);
	let questions = self.state.questions;
	let questionToUpdate = questions.find(question => question.questionId === questionId);
	questionToUpdate.answers = questionToUpdate.answers.filter(answer => answer.answerId !== answerId);
	self.setState({ questions });
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
