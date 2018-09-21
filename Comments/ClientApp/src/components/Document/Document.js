// @flow

import React, {Component, Fragment} from "react";
import {Helmet} from "react-helmet";
import {withRouter} from "react-router";
import objectHash from "object-hash";

import preload from "../../data/pre-loader";
import {load} from "./../../data/loader";
import {PhaseBanner} from "./../PhaseBanner/PhaseBanner";
import {BreadCrumbs} from "./../Breadcrumbs/Breadcrumbs";
import {StackedNav} from "./../StackedNav/StackedNav";
import {HashLinkTop} from "../../helpers/component-helpers";
import {projectInformation} from "../../constants";
import {ProcessDocumentHtml} from "../../document-processing/ProcessDocumentHtml";
import {LoginBanner} from "./../LoginBanner/LoginBanner";
import {UserContext} from "../../context/UserContext";
import {Selection} from "../Selection/Selection";
import {pullFocusByQuerySelector} from "../../helpers/accessibility-helpers";
import {Header} from "../Header/Header";

type PropsType = {
	staticContext: {
		globals: any,
	},
	match: any,
	location: any,
	onNewCommentClick: Function,
	preview: boolean
};

type StateType = {
	loading: boolean,
	documentsData: any, // the list of other documents in this consultation
	chapterData: any, // the current chapter's details - markup and sections,
	consultationData: any, // the top level info - title etc
	currentInPageNavItem: null | string,
	hasInitialData: boolean,
	onboarded: boolean,
	currentChapterDetails?: {
		title: string,
		slug: string
	},
	allowComments: boolean,
	error: {
		hasError: boolean,
		message: string | null,
	}
};

type DocumentsType = Array<Object>;

export class Document extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);

		this.state = {
			chapterData: null,
			documentsData: [],
			consultationData: null,
			loading: true,
			hasInitialData: false,
			currentInPageNavItem: null,
			onboarded: false,
			allowComments: true,
			children: null,
			error: {
				hasError: false,
				message: null,
			},
		};

		if (this.props) {

			let preloadedChapter, preloadedDocuments, preloadedConsultation;

			preloadedChapter = preload(
				this.props.staticContext,
				"chapter",
				[],
				{...this.props.match.params}
			);
			preloadedDocuments = preload(
				this.props.staticContext,
				"documents",
				[],
				{consultationId: this.props.match.params.consultationId}
			);

			preloadedConsultation = preload(
				this.props.staticContext,
				"consultation",
				[],
				{consultationId: this.props.match.params.consultationId, isReview: false}
			);

			if (preloadedChapter && preloadedDocuments && preloadedConsultation) {
				if (this.props.staticContext) {
					this.props.staticContext.globals.gidReference = preloadedConsultation.reference;
				}
				const allowComments = preloadedConsultation.supportsComments &&
					preloadedConsultation.consultationState.consultationIsOpen &&
					!preloadedConsultation.consultationState.userHasSubmitted;
				if (preloadedChapter) {
					preloadedChapter = this.addChapterDetailsToSections(preloadedChapter);
				}
				this.state = {
					chapterData: preloadedChapter,
					documentsData: preloadedDocuments,
					consultationData: preloadedConsultation,
					loading: false,
					hasInitialData: true,
					currentInPageNavItem: null,
					onboarded: false,
					allowComments: allowComments,
					error: {
						hasError: false,
						message: null,
					},
				};
			}
		}
	}

	getChapterData = (params) => {
		return load("chapter", undefined, [], {...params});
	};

	gatherData = async () => {
		const {consultationId} = this.props.match.params;

		let chapterData;
		let documentsData;

		chapterData = this.getChapterData(this.props.match.params)
			.then(response => response.data)
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "chapterData " + err,
					},
				});
			}
			);

		documentsData = load("documents", undefined, [], {consultationId})
			.then(response => response.data)
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "documentsData " + err,
					},
				});
			});

		const consultationData = load("consultation", undefined, [], {
			consultationId,
			isReview: false,
		})
			.then(response => response.data)
			.catch(err => {
				this.setState({
					error: {
						hasError: true,
						message: "consultationData " + err,
					},
				});
			});

		return {
			chapterData: await chapterData,
			documentsData: await documentsData,
			consultationData: await consultationData,
		};
	};

	componentDidMount() {
		if (!this.state.hasInitialData) {
			this.gatherData()
				.then(data => {
					const allowComments = data.consultationData.supportsComments &&
						data.consultationData.consultationState.consultationIsOpen &&
						!data.consultationData.consultationState.userHasSubmitted;
					this.addChapterDetailsToSections(data.chapterData);
					this.setState({
						...data,
						loading: false,
						hasInitialData: true,
						allowComments: allowComments,
					}, () => {
						window.dataLayer.push({
							event: "pageview",
							gidReference: this.state.consultationData.reference,
							title: this.getPageTitle(),
						});
					});
				})
				.catch(err => {
					this.setState({
						error: {
							hasError: true,
							message: "gatherData in componentDidMount failed " + err,
						},
					});
				});
		}
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname;
		const newRoute = this.props.location.pathname;
		if (oldRoute === newRoute) return;

		this.setState({
			loading: true,
		});

		// are we on the same document as before?
		if (this.props.match.params.documentId === prevProps.match.params.documentId) {
			this.getChapterData(this.props.match.params)
				.then(response => {
					const chapterData = this.addChapterDetailsToSections(response.data);
					this.setState({
						chapterData,
						loading: false,
					}, () => {
						window.dataLayer.push({
							event: "pageview",
							gidReference: this.state.consultationData.reference,
							title: this.getPageTitle(),
						});
					});
					pullFocusByQuerySelector(".document-comment-container");
				});
		} else {
			this.gatherData()
				.then(data => {
					const chapterData = this.addChapterDetailsToSections(data.chapterData);
					this.setState({
						chapterData,
						consultationData: data.consultationData,
						documentsData: data.documentsData,
						loading: false,
					}, () => {
						window.dataLayer.push({
							event: "pageview",
							gidReference: this.state.consultationData.reference,
							title: this.getPageTitle(),
						});
					});
					pullFocusByQuerySelector(".document-comment-container");
				})
				.catch(err => {
					this.setState({
						error: {
							hasError: true,
							message: "gatherData in componentDidUpdate failed " + err,
						},
					});
				});
		}
	}

	getDocumentChapterLinks = (
		documentId: number,
		chapterSlug: string,
		consultationId: number,
		documents: any,
		title: string
	) => {
		if (!documentId) return null;
		const isCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const isCurrentChapter = slug => slug === chapterSlug;
		const createChapterLink = chapter => {
			return {
				label: chapter.title,
				url: `/${consultationId}/${documentId}/${chapter.slug}`,
				current: isCurrentChapter(chapter.slug),
				isReactRoute: true,
			};
		};
		const currentDocument = documents.filter(isCurrentDocument);
		return {
			title,
			links: currentDocument[0].chapters.map(createChapterLink),
		};
	};

	// Only Comment View
	getDocumentLinks = (
		getCommentable: boolean,
		title: string,
		documents: DocumentsType,
		currentDocumentFromRoute: number,
		currentConsultationFromRoute: number
	) => {
		if (!documents) return null;

		const isCurrentDocument = documentId => documentId === currentDocumentFromRoute;
		const isCommentable = d => d.convertedDocument;
		const isSupporting = d => !d.convertedDocument;

		const documentToLinkObject = d => {
			const label = d.title || "Download Document";
			// If it's a commentable document, get the link of the first chapter in the document, else use the href and provide a download link

			const url = isCommentable(d) ? `/${currentConsultationFromRoute}/${d.documentId}/${d.chapters[0].slug}` : d.href || "#";

			const current = isCurrentDocument(d.documentId);

			// isReactRoute: the "isReactRoute" attribute is telling the StackedNav component whether this item's link should be resolved by the react router or not
			// If it's not a react route then the link should be wrapped in a standard anchor tag
			const isReactRoute = isCommentable(d);

			return {
				label,
				url,
				current,
				isReactRoute,
			};
		};

		let filteredDocuments: any = [];

		if (getCommentable) { // $FlowIgnore
			filteredDocuments = documents
				.filter(isCommentable)
				.map(documentToLinkObject);
		} else { // $FlowIgnore
			filteredDocuments = documents
				.filter(isSupporting)
				.map(documentToLinkObject);
		}

		return {
			title,
			links: filteredDocuments,
		};
	};

	addChapterDetailsToSections = (chapterData: Object) => {
		const { title, slug } = chapterData;
		if (chapterData.sections.length) {
			if ((chapterData.sections[0].slug !== slug) && (chapterData.sections[0].title !== title)) {
				chapterData.sections.unshift({title, slug});
				return chapterData;
			}
		} else {
			chapterData.sections.push({title, slug});
		}
		return chapterData;
	};

	getCurrentDocumentTitle = () => {
		const documents = this.state.documentsData;
		const documentId = parseInt(this.props.match.params.documentId, 0);

		const matchCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const currentDocumentDetails = documents.filter(matchCurrentDocument)[0];
		return currentDocumentDetails.title;
	};

	getPageTitle = () => {
		return `${this.state.chapterData.title} | ${this.getCurrentDocumentTitle()} | ${this.state.consultationData.title}`;
	};

	render() {
		if (this.state.error.hasError) {
			throw new Error(this.state.error.message);
		}
		if (!this.state.hasInitialData) return <h1>Loading...</h1>;

		const {reference} = this.state.consultationData;
		const {documentsData} = this.state;
		const {sections, content, slug} = this.state.chapterData;
		const consultationId = parseInt(this.props.match.params.consultationId, 0);
		const documentId = parseInt(this.props.match.params.documentId, 0);

		const currentDocumentTitle = this.getCurrentDocumentTitle();

		const documentHtmlProps = {
			content,
			slug,
			onNewCommentClick: this.props.onNewCommentClick,
			url: this.props.match.url,
			allowComments: this.state.allowComments,
		};

		return (
			<Fragment>
				<Helmet>
					<title>{this.getPageTitle()}</title>
				</Helmet>
				<UserContext.Consumer>
					{(contextValue: any) => !contextValue.isAuthorised ?
						<LoginBanner signInButton={false}
												 currentURL={this.props.match.url}
												 signInURL={contextValue.signInURL}
												 registerURL={contextValue.registerURL}/>
						: /* if contextValue.isAuthorised... */ null}
				</UserContext.Consumer>
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<PhaseBanner
								phase={projectInformation.phase}
								name={projectInformation.name}
								repo={projectInformation.repo}
							/>
							<BreadCrumbs links={this.state.consultationData.breadcrumbs}/>
							<main role="main">
								<div className="page-header">
									<Header
										title={currentDocumentTitle}
										reference={reference}
										consultationState={this.state.consultationData.consultationState}/>
									{this.state.allowComments &&
									<button
										data-gtm="comment-on-document-button"
										data-qa-sel="comment-on-consultation-document"
										className="btn btn--cta"
										onClick={e => {
											e.preventDefault();
											this.props.onNewCommentClick(e, {
												sourceURI: this.props.match.url,
												commentText: "",
												commentOn: "Document",
												quote: currentDocumentTitle,
												order: 0,
												section: null,
											});
											window.dataLayer.push({
												event: "button",
												category: "Consultation comments page",
												action: "Clicked",
												label: "Comment on this document",
											});
										}}>
										Comment on this document
									</button>
									}
								</div>

								<button
									className="screenreader-button"
									onClick={() => {
										pullFocusByQuerySelector(".document-comment-container");
									}}>
									Skip navigation
								</button>

								<div className="grid">

									{/* navigation column */}
									<div data-g="12 md:3" className="navigationColumn">
										<StackedNav
											links={this.getDocumentChapterLinks(
												documentId,
												this.props.match.params.chapterSlug,
												consultationId,
												documentsData,
												"Chapters in this document"
											)}/>
										<StackedNav
											links={this.getDocumentLinks(
												true,
												"Other consultation documents you can comment on",
												documentsData,
												documentId,
												consultationId
											)}/>
										<StackedNav
											links={this.getDocumentLinks(
												false,
												"Supporting documents (for information only)",
												documentsData,
												documentId,
												consultationId
											)}/>
									</div>

									{/* inPageNav column */}
									<div data-g="12 md:3 md:push:6" className="inPageNavColumn">
										{sections && sections.length ? (
											<nav
												className="in-page-nav"
												aria-labelledby="inpagenav-title">
												<h2
													id="inpagenav-title"
													className="in-page-nav__title">
													On this page
												</h2>
												<ol className="in-page-nav__list" role="menubar">
													{sections.map(item => {
														const props = {
															label: item.title,
															to: `#${item.slug}`,
															behavior: "smooth",
															block: "start",
														};
														return (
															<li role="presentation" className="in-page-nav__item" key={objectHash(item)}>
																<HashLinkTop {...props} />
															</li>
														);
													})}
												</ol>
											</nav>
										) : /* if !sections.length */ null}
									</div>

									{/* document column */}
									<div data-g="12 md:6 md:pull:3" className="documentColumn">
										<div
											className={`document-comment-container ${
												this.state.loading ? "loading" : ""}`}>
											<Selection newCommentFunc={this.props.onNewCommentClick}
																 sourceURI={this.props.match.url}
																 allowComments={this.state.allowComments}>
												<ProcessDocumentHtml {...documentHtmlProps} />
											</Selection>
										</div>
									</div>

								</div>
							</main>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withRouter(Document);
