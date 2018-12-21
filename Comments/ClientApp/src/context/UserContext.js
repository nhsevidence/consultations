// @flow

import React from "react";
import { load } from "../data/loader";
import { withRouter } from "react-router";

export const UserContext = React.createContext();

type PropsType = {
	location: any,
	children: any,
	staticContext: any,
	match: any
};

type StateType = {
	isAuthorised: boolean,
	displayName: string,
	signInURL: string,
	registerURL: string
};

export class UserProvider extends React.Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);

		this.state = {
			isAuthorised: false,
			displayName: "",
			signInURL: "",
			registerURL: "",
		};

		const isServerSideRender = (this.props.staticContext && this.props.staticContext.preload);
		const preloadSource = isServerSideRender ? this.props.staticContext.preload.data : window.__PRELOADED__; // TODO: extract this preloaded line out to (or near) the preload endpoint method.

		if (preloadSource){
			this.state = {
				isAuthorised: preloadSource.isAuthorised,
				displayName: preloadSource.displayName,
				signInURL: preloadSource.signInURL,
				registerURL: preloadSource.registerURL,
			};
			if (this.props.staticContext) {
				this.props.staticContext.analyticsGlobals.isSignedIn = preloadSource.isAuthorised;
			}
		}
	}

	loadUser = (returnURL) => {
		load("user", undefined, [], { returnURL, cachebust: new Date().getTime() })
			.then(
				res => {
					this.setState({
						isAuthorised: res.data.isAuthorised,
						displayName: res.data.displayName,
						signInURL: res.data.signInURL,
						registerURL: res.data.registerURL,
					});
				}
			);
	};

	// fire when route changes

	componentDidMount() {
		this.loadUser(this.props.location.pathname); //this is currently only needed as the sign in url isn't right on SSR. TODO: fix SSR.
	}

	render() {
		return (
			<UserContext.Provider value={this.state}>
				{this.props.children}
			</UserContext.Provider>
		);
	}
}

export default withRouter(UserProvider);
