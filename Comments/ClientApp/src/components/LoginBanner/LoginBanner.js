// @flow
import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";
import queryString from "query-string";
import Cookies from "js-cookie";
import { UserContext } from "../../context/UserContext";
import { load } from "../../data/loader";

type PropsType = {
	signInURL: string,
	registerURL: string,
	signInButton: boolean,
	signInText?: string,
	match: PropTypes.object.isRequired,
	location: PropTypes.object.isRequired,
	allowOrganisationCodeLogin: boolean,
}

type OrganisationCode = {
	organisationAuthorisationId: number,
	organisationId: number,
	organisationName: string,
	collationCode: string,
}

type StateType = {
	organisationCode: string,
	hasError: bool,
	errorMessage: string,
	showOrganisationCodeLogin: bool,
	showAuthorisationOrganisation: bool,
	authorisationOrganisationFound: OrganisationCode, 
}

export class LoginBanner extends Component<PropsType, StateType> {

	constructor(props: PropsType) {
		super(props);

		this.state = {
			userEnteredCollationCode: "",
			hasError: false,
			errorMessage: "",
			showOrganisationCodeLogin: true,
			showAuthorisationOrganisation: false,
			authorisationOrganisationFound: null,
		};
	}

	componentDidMount() {
		const userEnteredCollationCode = queryString.parse(this.props.location.search).code;
		if (userEnteredCollationCode){
			this.setState({
				userEnteredCollationCode,
			}, () => {
				this.checkOrganisationCode();
			});
		}
	}

	handleOrganisationCodeChange = (userEnteredCollationCode) => {
		this.setState({
			userEnteredCollationCode,
		}, () => {
			this.checkOrganisationCode(userEnteredCollationCode);
		});
	};

	gatherDataForCheckOrganisationCode = async () => {
		const organisationCode = load(
			"organisation",
			undefined,
			[],
			{
				collationCode: this.state.userEnteredCollationCode,
				consultationId: this.props.match.params.consultationId, 
			})
			.then(response => response.data)
			.catch(err => {
				this.setState({
					hasError: true,
					errorMessage: err.response.data.errorException.Message, 
					showAuthorisationOrganisation: false,					
				});
			});
		return {
			organisationCode: await organisationCode,
		};
	}

	checkOrganisationCode = () => {
		this.gatherDataForCheckOrganisationCode()
			.then(data => {
				if (data.organisationCode != null) {
					this.setState({
						hasError: false,
						errorMessage: "",
						showAuthorisationOrganisation: true,
						authorisationOrganisationFound: data.organisationCode,
					});
				}
			})
			.catch(err => {
				throw new Error("checkOrganisationCode failed " + err);
			});		
	}

	gatherDataForCreateOrganisationUserSession = async () => {
		const session = load(
			"organisationsession",
			undefined,
			[],
			{
				collationCode: this.state.userEnteredCollationCode,
				organisationAuthorisationId: this.state.authorisationOrganisationFound.organisationAuthorisationId, 
			}, 
			"POST")
			.then(response => response.data)
			.catch(err => {
				this.setState({
					hasError: true,
					errorMessage: err.response.data.errorException.Message, 
					showAuthorisationOrganisation: false,
				});
			});
		return {
			session: await session,
		};
	}

	CreateOrganisationUserSession = async () => {
		const session = this.gatherDataForCreateOrganisationUserSession()
			.then(data => {
				if (data.session != null) { 
					this.setState({
						hasError: false,
						errorMessage: "",						
					});
					return data.session;
				}
			})
			.catch(err => {
				throw new Error("checkOrganisationCode failed " + err);
			});		
		return {
			session: await session,
		};
	}

	handleConfirmClick = (updateContextFunction) => {
		const consultationId = this.props.match.params.consultationId;
		this.CreateOrganisationUserSession().then(data => {
			console.log("data is:" + JSON.stringify(data));

			var expirationDate = new Date(data.session.expirationDateTicks);

			Cookies.set(`ConsultationSession-${consultationId}`, data.session.sessionId, {expires: expirationDate}); //TODO: add to cookie policy

			//now, set state to show logged in. 
			this.setState({
				showOrganisationCodeLogin: false,
				showAuthorisationOrganisation: false,
			})
			updateContextFunction();
		})
		.catch(err => {
			this.setState({
				hasError: true,
				errorMessage: "Unable to confirm",
			})
		});			
	}


	render(){

		return (
			<div className="panel panel--inverse mt--0 mb--0 sign-in-banner"
					 data-qa-sel="sign-in-banner">
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<div className="LoginBanner">
								{this.props.allowOrganisationCodeLogin && this.state.showOrganisationCodeLogin &&
									<Fragment>
										<p>If you would like to comment on this consultation as part of an organisation, please enter your organisation code here:</p>
										<label>
											Organisation code<br/>
											{this.state.hasError && 
												<div>{this.state.errorMessage}</div>
											}
											<DebounceInput
												minLength={6}
												debounceTimeout={400}
												type="text"
												onChange={e => this.handleOrganisationCodeChange(e.target.value)}
												className="form__input form__input--text limitWidth"
												data-qa-sel="OrganisationCodeLogin"
												value={this.state.userEnteredCollationCode}
											/>
										</label>
										<br/><br/>
										{this.state.showAuthorisationOrganisation && 
											<Fragment>
												<label>Confirm organisation name<br/>
													<strong>{this.state.authorisationOrganisationFound.organisationName}</strong>
												</label>
												<br/>												
												<UserContext.Consumer>
													{({ contextValue: ContextType, updateContext }) => (
														<button className="btn btn--cta" onClick={() => this.handleConfirmClick(updateContext)}  title={"Confirm your organisation is " + this.state.authorisationOrganisationFound.organisationName}>Confirm</button>
													)}
												</UserContext.Consumer>
												<br/>
											</Fragment>
										}	
									</Fragment>							
								}
								<a href={this.props.signInURL} title="Sign in to your NICE account">
									Sign in to your NICE account</a> {this.props.signInText || "to comment on this consultation"}.{" "}
								<br/>
								Don't have an account?{" "}
								<a href={this.props.registerURL} title="Register for a NICE account">
									Register
								</a>
							</div>
							{this.props.signInButton &&
								<p>
									<a className="btn btn--inverse" href={this.props.signInURL} title="Sign in to your NICE account">Sign in</a>
								</p>
							}
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default withRouter(LoginBanner); 