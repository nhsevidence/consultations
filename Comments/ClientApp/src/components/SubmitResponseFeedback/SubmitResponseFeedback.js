import React from "react";

export const SubmitResponseFeedback = (props) => {
	const {
		validToSubmit,
		unsavedIdsQty,
		organisationName,
		tobaccoDisclosure,
		respondingAsOrganisation,
		hasTobaccoLinks,
		showExpressionOfInterestSubmissionQuestion,
		organisationExpressionOfInterest,
		emailIsEmpty,
		emailIsWrongFormat,
		questions,
		isOrganisationCommenter,
	} = props;

	let items = [];

	questions.forEach(question => {
		if (question.answers.length > 1){
			items.push(`You have too many answers for the question "${question.questionText}"`);
		}

	});

	if (unsavedIdsQty)
		items.push("You have unsaved changes. Please save or delete before submitting your response");

	if (!validToSubmit)
		items.push("You have not saved any comments");

	if (isOrganisationCommenter) {
		if (emailIsEmpty) {
			items.push("You have not entered an email address");
		} else if (emailIsWrongFormat) {
			items.push("Email address is in an invalid format");
		}
	}

	if (!isOrganisationCommenter) {
		if (respondingAsOrganisation === null)
			items.push("You have not stated whether you are submitting the response on behalf of an organisation");

		if (respondingAsOrganisation && organisationName.length < 1)
			items.push("You have stated that you are responding on behalf of an organisation but you haven't entered the organisation name");

		if (respondingAsOrganisation && showExpressionOfInterestSubmissionQuestion && organisationExpressionOfInterest === null)
			items.push("You have not disclosed whether your organisation would like to express an interest in formally supporting this quality standard");

		if (hasTobaccoLinks === null)
			items.push("You have not disclosed whether you or the organisation you represent have links to the tobacco industry");

		if (hasTobaccoLinks && tobaccoDisclosure.length < 1)
			items.push("You have indicated that you or the organisation you represent have links with the tobacco industry but you have not supplied any details");
	}

	if (!items.length) return null;

	return (
		<div data-qa-sel="Submit-response-feedback" className="SubmitResponseFeedback mb--d" id="SubmitResponseFeedback">
			<p className="SubmitResponseFeedback__title">You can't submit your response yet</p>
			<ul className="mt--0">
				{items.map(i => <li key={i}>{i}</li>)}
			</ul>
		</div>
	);

};
