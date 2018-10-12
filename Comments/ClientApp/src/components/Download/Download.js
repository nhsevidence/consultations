// @flow

import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
import Helmet from "react-helmet";
import { UserContext } from "../../context/UserContext";
import { LoginBanner } from "../LoginBanner/LoginBanner";
import { Header } from "../Header/Header";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { ConsultationItem } from "./ConsultationItem/ConsultationItem";
import preload from "../../data/pre-loader";
import { FilterPanel } from "../FilterPanel/FilterPanel";
import { load } from "../../data/loader";
import { withHistory } from "../HistoryContext/HistoryContext";
import TextFilterWithHistory from "../TextFilter/TextFilter";

type StateType = {
	path: string;
	searchTerm: string;
	consultationListData: any | {
		consultations: any, //Array<ConsultationListRow>,
		optionFilters: any, //Array<OptionFilterGroup>,
		textFilter: any, //TextFilterGroup,
		indevBasePath: any, //string,
	};
	hasInitialData: boolean;
	loading: boolean;
	error: {
		hasError: boolean;
		message: string | null;
	};
	referrer: string;
}

type PropsType = {
	staticContext: any;
	match: {
		params: Object;
		url: string;
	};
	basename: string;
	location: {
		pathname: string;
	}
}

class Download extends Component<PropsType, StateType> {

	constructor(props) {
		super(props);

		this.state = {
			searchTerm: "",
			path: "",
			consultationListData: {},
			hasInitialData: false,
			loading: true,
			error: {
				hasError: false,
				message: null,
			},
			referrer: "",
		};

		let preloadedData, preloadedConsultations;
		if (this.props.staticContext && this.props.staticContext.preload) {
			preloadedData = this.props.staticContext.preload.data;
		}

		preloadedConsultations = preload(
			this.props.staticContext,
			"consultationList",
			[],
			{},
			preloadedData
		);

		if (preloadedConsultations) {
			this.state = {
				searchTerm: "",
				path: this.props.basename + this.props.location.pathname,
				consultationListData: preloadedConsultations,
				loading: false,
				hasInitialData: true,
				error: {
					hasError: false,
					message: null,
				},
				referrer: "",
			};
		}


	}

	loadDataAndUpdateState = () => {
		load("consultationsList")
			.then(response => {
				this.setState({
					consultationListData: response.data,
				});
			})
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "consultationsList error  " + err,
					},
				});
			});
	};

	unlisten = () => {};

	componentWillUnmount(){
		this.unlisten();
	}

	componentDidMount() {
		if (!this.state.hasInitialData) {
			this.loadDataAndUpdateState();
		}
		this.unlisten = this.props.history.listen(() => {
			console.log("filter changed");
			const path = this.props.basename + this.props.location.pathname + this.props.history.location.search;
			if (!this.state.path || path !== this.state.path) {
				this.loadDataAndUpdateState();
			}
		});

		let referrer = this.state.consultationListData.indevBasePath;
		this.setState({referrer});
		if (typeof(document) !== "undefined"){
			referrer = document.referrer;
			if (referrer.toLowerCase().indexOf("indev") != -1)
			{
				this.setState({referrer});
			}
		}
	}

	render() {
		const BackToIndevLink = [
			{
				label: "Back to InDev",
				url: this.state.referrer,
				localRoute: false,
			},
		];

		const {
			path,
			loading,
			hasInitialData,
			consultationListData,
		} = this.state;

		const {
			consultations,
			optionFilters,
			textFilter,
		} = consultationListData;

		if (!hasInitialData) return null;

		if (loading) return <h1>Loading...</h1>;

		return (
			<UserContext.Consumer>
				{(contextValue: any) => !contextValue.isAuthorised ?
					<LoginBanner
						signInButton={false}
						currentURL={this.props.match.url}
						signInURL={contextValue.signInURL}
						registerURL={contextValue.registerURL}
						signInText="to administer a consultation"
					/>
					:
					<Fragment>
						<Helmet>
							<title>Download Responses</title>
						</Helmet>
						<div className="container">
							<div className="grid">
								<div data-g="12">
									<Breadcrumbs links={BackToIndevLink}/>
									<Header title={`Download Responses - referrer: ${this.state.consultationListData.indevBasePath}`}/>
									<div className="grid">
										<div data-g="12 md:3">
											<h2 className="h5">Filter</h2>
											{textFilter && <TextFilterWithHistory search={this.props.location.search}
																														 path={this.props.basename + this.props.location.pathname} {...textFilter}/>}
											<FilterPanel filters={optionFilters} path={path}/>
										</div>
										<div data-g="12 md:9">
											<h2 className="h5">All consultations</h2>
											<ul className="list--unstyled">
												{consultations.map((item, idx) =>
													<ConsultationItem key={idx} {...item} />
												)}
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Fragment>
				}
			</UserContext.Consumer>
		);
	}
}

export default withRouter(withHistory(Download));
