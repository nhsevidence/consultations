// @flow

import React from "react";
import { Route, Switch } from "react-router";
import { Helmet } from "react-helmet";

import DocumentViewWithRouter from "../DocumentView/DocumentView";
import NotFound from "../NotFound/NotFound";
import ReviewPageWithRouter from "../ReviewPage/ReviewPage";
import UserProviderWithRouter from "../../context/UserContext";
import DocumentPreviewWithRouter from "../DocumentPreview/DocumentPreview";
import DocumentPreviewRedirectWithRouter from "../DocumentPreview/DocumentPreviewRedirect";

type PropsType = any;

type StateType = {
	onboarded: boolean
}

class App extends React.Component<PropsType, StateType> {
	render() {
		return (
			<UserProviderWithRouter>
				<Helmet titleTemplate="%s | Consultations | NICE">
					<html lang="en-GB"/>
				</Helmet>

				<Switch>
					{/*Document View*/}
					<Route exact path="/:consultationId/:documentId/:chapterSlug">
						<DocumentViewWithRouter/>
					</Route>

					{/*Document (Preview Layout)*/}
					<Route exact path="/preview/:reference/consultation/:consultationId/document/:documentId/chapter/:chapterSlug">
						<DocumentPreviewWithRouter />
					</Route>

					{/*	If we hit this we're coming in *without* a chapter slug, so we need to get the first chapter of the current document and pass its slug into the URL so it matches the route above */}
					<Route exact path="/preview/:reference/consultation/:consultationId/document/:documentId">
						<DocumentPreviewRedirectWithRouter />
						{/* This component only redirects to the above route */}
					</Route>

					{/*Review Page*/}
					<Route exact path="/:consultationId/review">
						<ReviewPageWithRouter/>
					</Route>

					{/*404*/}
					<Route component={NotFound}/>
				</Switch>
			</UserProviderWithRouter>
		);
	}
}

export default App;
