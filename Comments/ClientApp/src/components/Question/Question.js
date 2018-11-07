// @flow

import React, { Component, Fragment } from "react";
import { AnswerBox } from "../AnswerBox/AnswerBox";

//import stringifyObject from "stringify-object";

type PropsType = {
	staticContext?: any,
	saveAnswerHandler: Function,
	deleteAnswerHandler: Function,
	question: QuestionType,
	readOnly: boolean,
	isUnsaved: boolean,
	documentTitle?: string,
};

type StateType = {
	questionId: number
};

export class Question extends Component<PropsType, StateType> {

	isTextSelection = (question) => question.commentOn && question.commentOn.toLowerCase() === "selection" && question.quote;

	render() {
		if (!this.props.question) return null;
		const { documentTitle } = this.props;
		const { commentOn, quote } = this.props.question;
		let answers = this.props.question.answers;
		if (answers === null || answers.length < 1){
			answers = [{
				answerId: -1,
				questionId: this.props.question.questionId,
			}];
		}

		return (

			<li className={this.props.isUnsaved ? "CommentBox CommentBox--unsavedChanges" : "CommentBox"}>
				{!this.isTextSelection(this.props.question) &&
				<Fragment>
					{documentTitle &&
						<h1 className="CommentBox__title mt--0 mb--0">{documentTitle}</h1>
					}
					<h2 data-qa-sel="comment-box-title" className="CommentBox__title mt--0 mb--0">
						Question on <span className="text-lowercase">{commentOn}</span>
					</h2>
				</Fragment>
				}

				{this.isTextSelection(this.props.question) &&
				<Fragment>
					<h1 className="CommentBox__title mt--0 mb--0">{documentTitle}</h1>
					<h2 data-qa-sel="comment-box-title" className="CommentBox__title mt--0 mb--0">
						Question on: <span className="text-lowercase">{commentOn}</span>
					</h2>
					<div className="CommentBox__quote mb--d">{quote}</div>
				</Fragment>
				}
				<p><strong>{this.props.question.questionText}</strong></p>
				{this.props.isUnsaved &&
				<p className="CommentBox__validationMessage">You have unsaved changes</p>
				}
				{answers.map((answer) => {
					return (
						<AnswerBox
							questionText={this.props.question.questionText}
							updateUnsavedIds={this.props.updateUnsavedIds}
							questionId={this.props.question.questionId}
							readOnly={this.props.readOnly}
							isVisible={this.props.isVisible}
							key={answer.answerId}
							unique={`Answer${answer.answerId}`}
							answer={answer}
							saveAnswerHandler={this.props.saveAnswerHandler}
							deleteAnswerHandler={this.props.deleteAnswerHandler}
						/>
					);
				})}

			</li>
		);
	}
}
