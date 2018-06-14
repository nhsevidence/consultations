// @flow

import React, { Component, Fragment } from "react";
import { Helmet } from "react-helmet";
import { withRouter } from "react-router";
import { processPreviewHtml } from "../../document-processing/process-preview-html";
import { load } from "./../../data/loader";
import { PhaseBanner } from "./../PhaseBanner/PhaseBanner";
import { StackedNav } from "./../StackedNav/StackedNav";
import { projectInformation } from "../../constants";
import fakeChapterData from "./fake-chapter-data.json";

type PropsType = {
	staticContext?: any,
	match: any,
	location: any,
};

type StateType = {
	loading: boolean,
	documentsData: any, // the list of other documents in this consultation
	chapterData: any, // the current chapter's details - markup and sections,
	consultationData: any, // the top level info - title etc
	hasInitialData: boolean
};

export class DocumentPreview extends Component<PropsType, StateType> {
	constructor(props: PropsType) {
		super(props);

		this.state = {
			chapterData: null,
			documentsData: [],
			consultationData: null,
			loading: true,
			hasInitialData: false,
			currentInPageNavItem: null
		};

		// if (this.props) {
		// 	const preloadedChapter = preload(
		// 		this.props.staticContext,
		// 		"chapter",
		// 		[],
		// 		{ ...this.props.match.params }
		// 	);
		// 	const preloadedDocuments = preload(
		// 		this.props.staticContext,
		// 		"documents",
		// 		[],
		// 		{ consultationId: this.props.match.params.consultationId }
		// 	);
		// 	const preloadedConsultation = preload(
		// 		this.props.staticContext,
		// 		"consultation",
		// 		[],
		// 		{ consultationId: this.props.match.params.consultationId }
		// 	);
		//
		// 	if (preloadedChapter && preloadedDocuments && preloadedConsultation) {
		// 		this.state = {
		// 			chapterData: preloadedChapter,
		// 			documentsData: preloadedDocuments,
		// 			consultationData: preloadedConsultation,
		// 			loading: false,
		// 			hasInitialData: true,
		// 			currentInPageNavItem: null
		// 		};
		// 	}
		// }
	}

	// getChapterData = (chapterSlug: string) => {
	// 	const { consultationId, documentId } = this.props.match.params;
	//
	// };

	gatherData = async () => {
		const { consultationId } = this.props.match.params;

		const documentsData = load("documents", undefined, [], { consultationId })
			.then(response => response.data)
			.catch(err => {
				throw new Error("documentsData " + err);
			});

		const consultationData = load("consultation", undefined, [], { consultationId })
			.then(response => response.data)
			.catch(err => {
				throw new Error("consultationData " + err);
			});

		return {
			documentsData: await documentsData,
			consultationData: await consultationData
		};
	};

	getChapterData = (consultationId: number, documentId: number, chapterSlug: string) => {
		load("chapter", undefined, [], {
			consultationId,
			documentId,
			chapterSlug
		})
			.then(response => {
				this.setState({
					chapterData: response.data
				});
			})
			.catch(err => {
				throw new Error("chapterData " + err);
			});
	};

	componentDidMount() {
		if (!this.state.hasInitialData) {
			this.gatherData()
				.then(data => {
					const documentId = parseInt(this.props.match.params.documentId, 0);
					const consultationId = parseInt(this.props.match.params.consultationId, 0);
					const isCurrentDocument = d => d.documentId === documentId;
					const slug = data.documentsData.filter(isCurrentDocument)[0].chapters[0].slug;
					this.getChapterData(documentId, consultationId, slug);
					this.setState({
						...data,
						loading: false,
						hasInitialData: true
					});
				})
				.catch(err => {
					throw new Error("gatherData in componentDidMount failed " + err);
				});
		}
	}

	componentDidUpdate(prevProps: PropsType) {
		const oldRoute = prevProps.location.pathname;
		const newRoute = this.props.location.pathname;
		if (oldRoute !== newRoute) {
			this.setState({
				loading: true
			});
			this.gatherData()
				.then(data => {
					this.setState({
						...data,
						loading: false
					});
				})
				.catch(err => {
					throw new Error("gatherData in componentDidUpdate failed " + err);
				});
		}
	}

	getDocumentChapterLinks = (documentId: number) => {
		if (!documentId) return null;

		const isCurrentDocument = d => d.documentId === parseInt(documentId, 0);

		const isCurrentChapter = slug =>
			slug === this.props.match.params.chapterSlug;

		const createChapterLink = chapter => {
			return {
				label: chapter.title,
				url: `/preview/consultation/${this.props.match.params.consultationId}/document/${
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

	getCurrentDocumentTitle = (documents: Object, documentId: number) => {
		const matchCurrentDocument = d => d.documentId === parseInt(documentId, 0);
		const currentDocumentDetails = documents.filter(matchCurrentDocument)[0];
		return currentDocumentDetails.title;
	};

	generateScrollspy = (sections: Array<Object>): Array<Object> => {
		return sections.map(section => section.slug);
	};

	inPageNav = (e: HTMLElement) => {
		if (!e) return null;
		const currentInPageNavItem = e.getAttribute("id");
		this.setState({ currentInPageNavItem });
	};

	render() {
		if (!this.state.chapterData || !this.state.hasInitialData) return <h1>Loading...</h1>;
		const { title } = this.state.consultationData;
		const { documentsData } = this.state;
		// const { content } = this.state.chapterData; todo: put this back
		const content = fakeChapterData.Content;
		const documentId = parseInt(this.props.match.params.documentId, 0);

		return (
			<Fragment>
				<Helmet>
					<title>Preview of {title}</title>
				</Helmet>
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<PhaseBanner
								phase={projectInformation.phase}
								name={projectInformation.name}
								repo={projectInformation.repo}
							/>
							<main role="main">
								<div className="page-header">
									<p className="mb--0">Consultation <span className="tag">Preview</span></p>
									<h1 className="page-header__heading mt--0">{title}</h1>
									<p className="mb--0">Document <span className="tag">Preview</span></p>
									<h2 className="mt--0">
										{this.getCurrentDocumentTitle(documentsData, documentId)}
									</h2>
								</div>
								<div className="grid">
									<div data-g="12 md:3">
										<StackedNav links={this.getDocumentChapterLinks(documentId)} />
									</div>
									<div data-g="12 md:6" className="documentColumn">
										<div className={`document-comment-container ${this.state.loading ? "loading" : ""}`}>
											{processPreviewHtml(content)}
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

export default withRouter(DocumentPreview);
