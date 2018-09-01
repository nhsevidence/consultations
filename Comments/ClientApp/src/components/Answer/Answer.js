// @flow

import React, { Component, Fragment } from "react";

type PropsType = {
	staticContext?: any,
	isVisible: boolean,
	answer: AnswerType,
	readOnly: boolean,
	saveHandler: Function,
	deleteHandler: Function,
	unique: string
};

type StateType = {
	answer: AnswerType,
	unsavedChanges: boolean,
};

export class Answer extends Component<PropsType, StateType> {
	constructor() {
		super();
		this.state = {
			answer: {},
			unsavedChanges: false,
		};
	}

	componentDidMount() {
		this.setState({
			answer: this.props.answer,
		});
	}

	textareaChangeHandler = e => {
		const answer = this.state.answer;
		answer.answerText = e.target.value;
		this.setState({
			answer,
			unsavedChanges: true,
		});
	};

	static getDerivedStateFromProps(nextProps: any, prevState: any) {
		const prevTimestamp = prevState.answer.lastModifiedDate;
		const nextTimestamp = nextProps.answer.lastModifiedDate;
		const hasAnswerBeenUpdated = () => prevTimestamp !== nextTimestamp;
		if (hasAnswerBeenUpdated()) {
			return {
				answer: nextProps.answer,
				unsavedChanges: false,
			};
		}
		return null;
	}

	render() {
		if (!this.state.answer) return null;
		const {
			answerText,
			answerId,
			questionId,
		} = this.state.answer;
		const unsavedChanges = this.state.unsavedChanges;
		const answer = this.state.answer;
		const readOnly = this.props.readOnly;

		return (

			<Fragment>
				<section role="form">
					<form onSubmit={e => this.props.saveHandler(e, answer)}>
						<div className="form__group form__group--textarea mb--0">
							<textarea
								data-qa-sel="Comment-text-area"
								disabled={readOnly}
								id={this.props.unique}
								className="form__input form__input--textarea"
								onChange={this.textareaChangeHandler}
								placeholder="Enter your answer here"
								value={answerText}/>
						</div>
						{!readOnly && answerText && answerText.length > 0 ?
							unsavedChanges ?
								<input
									data-qa-sel="submit-button"
									className="btn ml--0"
									type="submit"
									value="Save answer"
								/>
								:
								<span className="ml--0 CommentBox__savedIndicator">Saved</span>
							:
							null
						}
						{!readOnly && (this.state.unsavedChanges || answerId > 0) &&
						<button
							data-qa-sel="delete-comment-button"
							className="btn mr--0 right"
							onClick={e => this.props.deleteHandler(e, questionId, answerId)}>
							<span className="visually-hidden">Delete this answer</span>
							<span className="icon icon--trash" aria-hidden="true"/>
						</button>
						}
					</form>
				</section>
			</Fragment>
		);
	}
}

export default Answer;
