// @flow

import React, { Component, Fragment } from "react";
import Moment from "react-moment";
import { Helmet } from "react-helmet";
import { StickyContainer, Sticky } from "react-sticky";
import { withRouter } from "react-router";
import Scrollspy from "react-scrollspy";

import preload from "../../data/pre-loader";
import { load } from "./../../data/loader";
import { PhaseBanner } from "./../PhaseBanner/PhaseBanner";
import { BreadCrumbs } from "./../Breadcrumbs/Breadcrumbs";
import { StackedNav } from "./../StackedNav/StackedNav";
import { HashLinkTop } from "../../helpers/component-helpers";
import { projectInformation } from "../../constants";
import { processDocumentHtml } from "./process-document-html";
import { LoginBanner } from "./../LoginBanner/LoginBanner";
import { UserContext } from "../../context/UserContext";
import { processDocumentHtml } from "./process-document-html";
import { processDocumentHtml } from "../../document-processing/process-document-html";
import { processPreviewHtml } from "../../document-processing/process-preview-html";
import { ErrorOverview } from "./ErrorOverview";
import { LoginBanner } from "./../LoginBanner/LoginBanner";
import { UserContext } from "../../context/UserContext";
import { Selection } from "../Selection/Selection";
import { pullFocusByQuerySelector } from "../../helpers/accessibility-helpers";
import { Header } from "../Header/Header";

// import stringifyObject from "stringify-object";

type PropsType = {
	staticContext?: any,
	match: any,
	location: any,
	onNewCommentClick: Function
};

type StateType = {
	loading: boolean,
	documentsData: any, // the list of other documents in this consultation
	chapterData: any, // the current chapter's details - markup and sections,
	consultationData: any, // the top level info - title etc
	currentInPageNavItem: null | string,
	hasInitialData: boolean,
	onboarded: boolean,
	currentChapterDetails: {
		title: string,
		slug: string
	},
	allowComments: boolean
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
		};

		if (this.props) {

			let preloadedChapter, preloadedDocuments, preloadedConsultation;

			if (this.props.match.params.reference) {
				preloadedChapter = preload(
					this.props.staticContext,
					"previewchapter",
					[],
					{ ...this.props.match.params }
				);
				preloadedDocuments = preload(
					this.props.staticContext,
					"previewdraftdocuments",
					[],
					{ ...this.props.match.params }
				);
			} else {
				preloadedChapter = preload(
					this.props.staticContext,
					"chapter",
					[],
					{ ...this.props.match.params }
				);
				preloadedDocuments = preload(
					this.props.staticContext,
					"documents",
					[],
					{ consultationId: this.props.match.params.consultationId }
				);
			}

			preloadedConsultation = preload(
				this.props.staticContext,
				"consultation",
				[],
				{ consultationId: this.props.match.params.consultationId, isReview: false }
			);

			if (preloadedChapter && preloadedDocuments && preloadedConsultation) {
				const allowComments = preloadedConsultation.supportsComments &&
					preloadedConsultation.consultationState.consultationIsOpen &&
					!preloadedConsultation.consultationState.userHasSubmitted;
				this.state = {
					chapterData: preloadedChapter,
					documentsData: preloadedDocuments,
					consultationData: preloadedConsultation,
					loading: false,
					hasInitialData: true,
					currentInPageNavItem: null,
					onboarded: false,
					allowComments: allowComments
				};
			}
		}
	}

	gatherData = async () => {
		const { consultationId, documentId, chapterSlug, reference } = this.props.match.params;

		let chapterData;
		let documentsData;

		if (reference) {
			chapterData = load("previewchapter", undefined, [], {
				consultationId,
				documentId,
				chapterSlug,
				reference
			})
				.then(response => response.data)
				.catch(err => {
					throw new Error("previewChapterData " + err);
				});

			documentsData = load("previewdraftdocuments", undefined, [], {
				consultationId,
				documentId,
				reference
			})
				.then(response => response.data)
				.catch(err => {
					throw new Error("previewdraftdocumentsData " + err);
				});
		} else {
			chapterData = load("chapter", undefined, [], {
				consultationId,
				documentId,
				chapterSlug
			})
				.then(response => response.data)
				.catch(err => {
					throw new Error("chapterData " + err);
				});

			documentsData = load("documents", undefined, [], { consultationId })
				.then(response => response.data)
				.catch(err => {
					throw new Error("documentsData " + err);
				});
		}

		const consultationData = load("consultation", undefined, [], {
			consultationId, isReview: false
		})
			.then(response => response.data)
			.catch(err => {
				throw new Error("consultationData " + err);
			});

		return {
			chapterData: await chapterData,
			documentsData: await documentsData,
			consultationData: await consultationData
		};
	};

	componentDidMount() {
		if (!this.state.hasInitialData) {
			this.gatherData()
				.then(data => {
					const allowComments = data.consultationData.supportsComments &&
						data.consultationData.consultationState.consultationIsOpen &&
						!data.consultationData.consultationState.userHasSubmitted;
					this.setState({
						...data,
						loading: false,
						hasInitialData: true,
						allowComments : allowComments
					});
					this.addChapterDetailsToSections(this.state.chapterData);
				})
				.catch(err => {
					throw new Error("gatherData in componentDidMount failed " + err);
				});
		}
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname;
		const newRoute = this.props.location.pathname;
		if (oldRoute === newRoute) return;

		this.setState({
			loading: true
		});

		this.gatherData()
			.then(data => {
				this.setState({
					...data,
					loading: false
				});
				this.addChapterDetailsToSections(this.state.chapterData);
				// once we've loaded, pull focus to the document container
				pullFocusByQuerySelector(".document-comment-container");
			})
			.catch(err => {
				throw new Error("gatherData in componentDidUpdate failed " + err);
	}

	getDocumentChapterLinks = (documentId: number) => {
		if (!documentId) return null;
		const isCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const isCurrentChapter = slug =>
			slug === this.props.match.params.chapterSlug;
		const createChapterLink = chapter => {
			return {
				label: chapter.title,
				url: `/${this.props.match.params.consultationId}/${
					this.props.match.params.documentId}/${chapter.slug}`,
				current: isCurrentChapter(chapter.slug),
				isReactRoute: true
			};
		};
		const documents = this.state.documentsData;
		const currentDocument = documents.filter(isCurrentDocument);
		return {
			title: "Chapters in this document",
			links: currentDocument[0].chapters.map(createChapterLink)
		};
	};

	getPreviewDocumentChapterLinks = (documentId: number) => {
		if (!documentId) return null;
		const isCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const isCurrentChapter = slug => slug === this.props.match.params.chapterSlug;
		const createChapterLink = chapter => {
			return {
				label: chapter.title,
				url: `/preview/${this.props.match.params.reference}/consultation/${this.props.match.params.consultationId}/document/${
					this.props.match.params.documentId}/chapter/${chapter.slug}`,
				current: isCurrentChapter(chapter.slug),
				isReactRoute: true
			};
		};
		const documents = this.state.documentsData;
		const currentDocument = documents.filter(isCurrentDocument);
		return {
			title: "Chapters in this document",
			links: currentDocument[0].chapters.map(createChapterLink)
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
				isReactRoute
			};
		};

		let filteredDocuments: DocumentsType = [];

		if (getCommentable) {
			filteredDocuments = documents
				.filter(isCommentable)
				.map(documentToLinkObject);
		} else {
			filteredDocuments = documents
				.filter(isSupporting)
				.map(documentToLinkObject);
		}

		return {
			title,
			links: filteredDocuments
		};
	};

	getDocumentChapterLinks = (documentId: number) => {
		if (!documentId) return null;

		const isCurrentDocument = d => d.documentId === parseInt(documentId, 0);

		const isCurrentChapter = slug =>
			slug === this.props.match.params.chapterSlug;

		const createChapterLink = chapter => {
			return {
				label: chapter.title,
				url: `/${this.props.match.params.consultationId}/${
					this.props.match.params.documentId}/${chapter.slug}`,
				current: isCurrentChapter(chapter.slug),
				isReactRoute: true
			};
		};

		const documents = this.state.documentsData;

		const currentDocument = documents.filter(isCurrentDocument);

		return {
			title: "Chapters in this document",
			links: currentDocument[0].chapters.map(createChapterLink)
		};
	};

	// Only Comment View
	generateScrollspy = (sections: Array<Object>): Array<Object> => {
		return sections.map(section => section.slug);
	};

	addChapterDetailsToSections = (chapterData) => {
		const { title, slug } = this.state.chapterData;
		const chapterDetails = { title, slug };
		chapterData.sections.unshift(chapterDetails);
		this.setState({ chapterData });
	};

	inPageNav = (e: HTMLElement) => {
		if (!e) return null;
		const currentInPageNavItem = e.getAttribute("id");
		this.setState({ currentInPageNavItem });
	};

	getCurrentDocumentTitle = (documents: Object, documentId: number) => {
		const matchCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const currentDocumentDetails = documents.filter(matchCurrentDocument)[0];
		return currentDocumentDetails.title;
	};

render() {
		if (!this.state.hasInitialData) return <h1>Loading...</h1>;

		const { title, reference, endDate } = this.state.consultationData;
		const { documentsData } = this.state;
		const { sections, content } = this.state.chapterData;
		const consultationId = parseInt(this.props.match.params.consultationId, 0);
		const documentId = parseInt(this.props.match.params.documentId, 0);

		return (
			<Fragment>
				<Helmet>
					<title>{title}</title>
				</Helmet>
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
										title={title}
										reference={reference}
										consultationState={this.state.consultationData.consultationState}/>
									{ /*}<h1 className="page-header__heading mt--0">{title}</h1>

									<p className="page-header__lead">
										[{reference}] Open until{" "}
										<Moment format="D MMMM YYYY" date={endDate}/>
									</p> */
									}
									{this.state.allowComments &&
										<button
											data-qa-sel="comment-on-whole-consultation"
											className="btn btn--cta"
											onClick={e => {
												e.preventDefault();
												this.props.onNewCommentClick({
													sourceURI: this.props.match.url,
													commentText: "",
													commentOn: "Consultation",
													quote: title
												});
											}}
										>
											Comment on whole consultation
										</button>
									}
									<h2 className="mb--b">
										{this.getCurrentDocumentTitle(documentsData, documentId)}
									</h2>
									{this.state.allowComments &&
										<button
											data-qa-sel="comment-on-consultation-document"
											className="btn btn--cta"
											onClick={e => {
												e.preventDefault();
												this.props.onNewCommentClick({
													sourceURI: this.props.match.url,
													commentText: "",
													commentOn: "Document",
													quote: this.getCurrentDocumentTitle(
														documentsData,
														documentId
													)
												});
											}}>
											Comment on this document
										</button>
									}
								</div>

								<StickyContainer className="grid">
									<div data-g="12 md:3 md:push:9" className="inPageNavColumn">
										<Sticky disableHardwareAcceleration>
											{({ style }) => (
												<div style={style}>
													{sections.length ? (
														<nav
															className="in-page-nav"
															aria-labelledby="inpagenav-title">
															<h2
																id="inpagenav-title"
																className="in-page-nav__title">
																On this page
															</h2>
															<Scrollspy
																componentTag="ol"
																items={this.generateScrollspy(sections)}
																currentClassName=""
																className="in-page-nav__list"
																role="menubar"
																onUpdate={e => {
																	this.inPageNav(e);
																}}>
																{sections.map((item, index) => {
																	const props = {
																		label: item.title,
																		to: `#${item.slug}`,
																		behavior: "smooth",
																		block: "start"
																	};
																	return (
																		<li role="presentation"
																			className="in-page-nav__item"
																			key={index}>
																			<HashLinkTop
																				{...props}
																				currentNavItem={
																					this.state.currentInPageNavItem
																				}
																			/>
																		</li>
																	);
																})}
															</Scrollspy>
														</nav>
													) : null}
												</div>
											)}
										</Sticky>
									</div>
									<div data-g="12 md:6" className="documentColumn">
										<div
											className={`document-comment-container ${
												this.state.loading ? "loading" : ""}`}
										>
											<Selection newCommentFunc={this.props.onNewCommentClick}
													   sourceURI={this.props.match.url}
													   allowComments={this.state.allowComments}>
												{processDocumentHtml(
													content,
													this.props.onNewCommentClick,
													this.props.match.url,
													this.state.allowComments
												)}
											</Selection>
										</div>
									</div>
									<div data-g="12 md:3 md:pull:9" className="navigationColumn">
										<StackedNav // "Chapters in this document"
											links={this.getDocumentChapterLinks(documentId)}
										/>
										<StackedNav
											links={this.getDocumentLinks(
												true,
												"Other commentable documents in this consultation",
												documentsData,
												documentId,
												consultationId
											)}
										/>
										<StackedNav
											links={this.getDocumentLinks(
												false,
												"Supporting documents",
												documentsData,
												documentId,
												consultationId
											)}
										/>
									</div>
								</StickyContainer>
							</main>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}	
}

export default withRouter(Document);

export default withRouter(Document);
