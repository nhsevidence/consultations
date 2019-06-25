// @flow

import React, { Component, Fragment } from "react";

//import stringifyObject from "stringify-object";

type PropsType = {
	staticContext?: any,
	question: QuestionType,
};

type StateType = {
	
};

export class SubmissionQuestion extends Component<PropsType, StateType> {

	render() {
		const question = this.props.question;
		if (!question) return null;
		
		return (
			<li>
				<p><strong>{question.questionText}</strong></p>
				<textarea id="Question{question.questionID}" className="form__input form__input--textarea"></textarea>
			</li>
		);
	}
}
