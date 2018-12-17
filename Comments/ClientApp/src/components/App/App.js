// @flow

import React, { Fragment } from "react";
import { Route, Switch, Redirect } from "react-router";
import { Helmet } from "react-helmet";

import DocumentViewWithRouter from "../DocumentView/DocumentView";
import NotFound from "../NotFound/NotFound";
import ReviewWithRouter from "../Review/Review";
import SubmittedWithRouter from "../Submitted/Submitted";
import UserProviderWithRouter from "../../context/UserContext";
import FooterWithRouter from "../Footer/Footer";
import DocumentPreviewWithRouter from "../DocumentPreview/DocumentPreview";
import DownloadWithRouter from "../Download/Download";
import QuestionsWithRouter from "../Questions/Questions";
import {ErrorBoundary} from "../ErrorBoundary/ErrorBoundary";
import {LiveAnnouncer, LiveMessenger} from "react-aria-live";
import { projectInformation } from "../../constants";
import { PhaseBanner } from "../PhaseBanner/PhaseBanner";

// import "../../../node_modules/@nice-digital/icons/dist/_nice-icons.scss";
// import "../../../node_modules/@nice-digital/design-system/src/stylesheets/nice-design-system.scss";
import "./App.scss";

type PropsType = any;

type StateType = {
	onboarded: boolean
}

class App extends React.Component<PropsType, StateType> {
	render() {
		return (
			<Fragment>
				<PhaseBanner
					phase={projectInformation.phase}
					name={projectInformation.name}
				/>
				<UserProviderWithRouter>
					<Helmet titleTemplate="%s | Consultations | NICE">
						<html lang="en-GB"/>
					</Helmet>
					<ErrorBoundary>
						<LiveAnnouncer>
							<Switch>

								{/*Admin Routes*/}
								{/*Download*/}
								<Route exact path="/admin">
									<Redirect to={"/admin/download"} />
								</Route>

								{/*Download*/}
								<Route exact path="/admin/download">
									<DownloadWithRouter basename={this.props.basename}/>
								</Route>

								{/*Questions*/}
								<Route path="/admin/questions/:consultationId">
									<QuestionsWithRouter />
								</Route>

								{/*Document View*/}			
								<Route exact
											 path="/:consultationId/:documentId/:chapterSlug">
									<DocumentViewWithRouter/>
								</Route>

								{/*Document (Preview Layout)*/}
								<Route exact
											 path="/preview/:reference/consultation/:consultationId/document/:documentId/chapter/:chapterSlug">
									<DocumentPreviewWithRouter/>
								</Route>

								{/*Review Page*/}
								<Route exact
											 path="/:consultationId/review">
									<LiveMessenger>
										{({announcePolite, announceAssertive}) =>
											<ReviewWithRouter
												announcePolite={announcePolite}
												announceAssertive={announceAssertive}
												basename={this.props.basename}/>
										}
									</LiveMessenger>
								</Route>

								{/*Submit Page*/}
								<Route exact
											 path="/:consultationId/submitted">
									<LiveMessenger>
										{({announcePolite, announceAssertive}) =>
											<SubmittedWithRouter
												announcePolite={announcePolite}
												announceAssertive={announceAssertive}
												basename={this.props.basename}/>
										}
									</LiveMessenger>
								</Route>

								{/*404*/}
								<Route component={NotFound}/>
							</Switch>
						</LiveAnnouncer>
					</ErrorBoundary>
				</UserProviderWithRouter>
				<FooterWithRouter />
			</Fragment>
		);
	}
}

export default App;
