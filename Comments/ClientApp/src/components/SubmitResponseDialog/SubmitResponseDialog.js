import React, { PureComponent } from "react";
import { pullFocusByQuerySelector } from "../../helpers/accessibility-helpers";
import { SubmitResponseFeedback } from "../SubmitResponseFeedback/SubmitResponseFeedback";
import { Input } from "@nice-digital/nds-input";

export class SubmitResponseDialog extends PureComponent {

	state = {
		feedbackVisible: false,
	};

	mandatoryQuestionsAreValid = () => {
		let organisationIsValid = false;
		if ((this.props.respondingAsOrganisation === "yes" && this.props.organisationName.length > 0) || this.props.respondingAsOrganisation === "no") {
			organisationIsValid = true;
		}

		let tobaccoIsValid = false;
		if ((this.props.hasTobaccoLinks === "yes" && this.props.tobaccoDisclosure.length > 0) || this.props.hasTobaccoLinks === "no") {
			tobaccoIsValid = true;
		}

		let organisationExpressionOfInterestIsValid = false;
		if (this.props.respondingAsOrganisation === "no" || !this.props.showExpressionOfInterestSubmissionQuestion ||
			this.props.organisationExpressionOfInterest === "yes"  || this.props.organisationExpressionOfInterest === "no"){
			organisationExpressionOfInterestIsValid = true;
		}

		return organisationIsValid && tobaccoIsValid && organisationExpressionOfInterestIsValid;
	};

	submitConsultation = () => {
		if (this.props.validToSubmit && this.mandatoryQuestionsAreValid() && this.props.unsavedIds.length === 0) {
			this.props.submitConsultation();
		}
		else {
			this.setState({
				feedbackVisible: true,
			});
			pullFocusByQuerySelector("#SubmitResponseFeedback");
		}
	};

	handleSubmitToOrgLeadClick = () => {
		this.props.submitToOrgLead();
	};

	render() {
		const {
			isAuthorised,
			submittedDate,
			fieldsChangeHandler,
			organisationName,
			tobaccoDisclosure,
			respondingAsOrganisation,
			hasTobaccoLinks,
			showExpressionOfInterestSubmissionQuestion,
			organisationExpressionOfInterest,
			isOrganisationCommenter,
			isLead,
		} = this.props;

		return (
			<>
				{isOrganisationCommenter ? (
					<div className="panel">
						<h2>You are about to submit your final response to {organisationName}</h2>
						<p>Lorem</p>
						<h3>Another heading</h3>
						<p>Ipsum</p>
						<Input
							label="Email address"
							name="emailAddress"
							onChange={fieldsChangeHandler}
						/>
						<h3>Now submit your response to {organisationName}</h3>
						<p>Lorememememe</p>
						<button onClick={this.handleSubmitToOrgLeadClick}>Submit to your organisation</button>
					</div>
				) : (
					<div className="panel">
						<p className="lead">You are about to submit your final response to NICE.</p>

						{isLead &&
							<>
								<p>You are responding on behalf of <strong>{organisationName}</strong></p>
							</>
						}

						<p>You must answer the following {(!isLead || showExpressionOfInterestSubmissionQuestion) ? "questions" : "question"} before you submit.</p>

						{!isLead &&
						<>
							<p><strong>Are you responding on behalf of an organisation?</strong></p>

							<div role="radiogroup" aria-label="Are you responding on behalf of an organisation?">
								<div className="form__group form__group--radio form__group--inline">
									<input
										className="form__radio"
										id="respondingAsOrganisation--true"
										type="radio"
										name="respondingAsOrganisation"
										checked={respondingAsOrganisation === "yes"}
										onChange={fieldsChangeHandler}
										value={"yes"}
									/>
									<label
										data-qa-sel="respond-yes-responding-as-org"
										className="form__label form__label--radio"
										htmlFor="respondingAsOrganisation--true">
										Yes
									</label>
								</div>

								<div className="form__group form__group--radio form__group--inline">
									<input
										className="form__radio"
										id="respondingAsOrganisation--false"
										type="radio"
										name="respondingAsOrganisation"
										checked={respondingAsOrganisation === "no"}
										onChange={fieldsChangeHandler}
										value={"no"}
									/>
									<label
										data-qa-sel="respond-no-responding-as-org"
										className="form__label form__label--radio"
										htmlFor="respondingAsOrganisation--false">
										No
									</label>
								</div>

							</div>
						</>
						}

						{(!isLead && respondingAsOrganisation === "yes") &&
							<>
								<div className="form__group form__group--text">
									<label htmlFor="organisationName" className="form__label">
										<strong>Enter the name of your organisation</strong>
									</label>
									<input data-qa-sel="organisation-name" data-hj-whitelist id="organisationName" name="organisationName" value={organisationName}
										className="form__input" type="text" onChange={fieldsChangeHandler}/>
								</div>
							</>
						}

						{respondingAsOrganisation === "yes" && showExpressionOfInterestSubmissionQuestion &&
							<>
								<p>
									<strong>Would your organisation like to express an interest in formally supporting this quality standard?</strong><br/>
									<a href="/standards-and-indicators/get-involved/support-a-quality-standard" target="_new">More information</a>
								</p>
								<div role="radiogroup" aria-label="Would your organisation like to express an interest in formally supporting this quality standard?">
									<div className="form__group form__group--radio form__group--inline">
										<input
											className="form__radio"
											id="organisationExpressionOfInterest--true"
											type="radio"
											name="organisationExpressionOfInterest"
											checked={organisationExpressionOfInterest === "yes"}
											onChange={fieldsChangeHandler}
											value={"yes"}
										/>
										<label
											data-qa-sel="express-interest-yes"
											className="form__label form__label--radio"
											htmlFor="organisationExpressionOfInterest--true">
											Yes
										</label>
									</div>

									<div className="form__group form__group--radio form__group--inline">
										<input
											className="form__radio"
											id="organisationExpressionOfInterest--false"
											type="radio"
											name="organisationExpressionOfInterest"
											checked={organisationExpressionOfInterest === "no"}
											onChange={fieldsChangeHandler}
											value={"no"}
										/>
										<label
											data-qa-sel="express-interest-no"
											className="form__label form__label--radio"
											htmlFor="organisationExpressionOfInterest--false">
											No
										</label>
									</div>
								</div>
							</>
						}

						<p><strong>Do you or the organisation you represent have any links with the tobacco industry?</strong></p>
						<p className="mb--0">This includes:</p>
						<ul className="mt--0">
							<li>current or past links</li>
							<li>direct or indirect links</li>
							<li>receiving funding from the tobacco industry.</li>
						</ul>

						<div role="radiogroup"
							aria-label="Do you or the organisation you represent have any links with the tobacco industry?">

							<div className="form__group form__group--radio form__group--inline">
								<input
									className="form__radio"
									id="hasTobaccoLinks--true"
									type="radio"
									name="hasTobaccoLinks"
									value={"yes"}
									checked={hasTobaccoLinks === "yes"}
									onChange={fieldsChangeHandler}
								/>
								<label
									className="form__label form__label--radio"
									htmlFor="hasTobaccoLinks--true">
									Yes
								</label>

							</div>

							<div className="form__group form__group--radio form__group--inline">
								<input
									className="form__radio"
									id="hasTobaccoLinks--false"
									type="radio"
									name="hasTobaccoLinks"
									onChange={fieldsChangeHandler}
									checked={hasTobaccoLinks === "no"}
									value={"no"}
								/>
								<label
									data-qa-sel="respond-no-has-tobac-links"
									className="form__label form__label--radio"
									htmlFor="hasTobaccoLinks--false">
									No
								</label>
							</div>
						</div>

						{hasTobaccoLinks === "yes" &&
							<div data-qa-sel="respond-yes-has-tobac-links" className="form__group form__group--textarea">
								<label htmlFor="tobaccoDisclosure" className="form__label">
									<strong>Please provide details</strong>
								</label>
								<textarea
									data-hj-whitelist
									id="tobaccoDisclosure"
									name="tobaccoDisclosure"
									value={tobaccoDisclosure}
									className="form__input form__input--textarea"
									onChange={fieldsChangeHandler}/>
							</div>
						}

						{isAuthorised &&
						<>
							<p><strong>Now submit your response to NICE.</strong></p>
							<p>After submission you won't be able to edit your comments further or add any extra comments.</p>
							{this.state.feedbackVisible &&
							<SubmitResponseFeedback
								{...this.props}
								unsavedIdsQty={this.props.unsavedIds.length}
							/>
							}
							<button
								className="btn btn--cta"
								data-qa-sel="submit-comment-button"
								onClick={this.submitConsultation}>
								{submittedDate ? "Responses submitted" : "Submit my response"}
							</button>
						</>
						}

					</div>
				)}
			</>
		);
	}
}
