declare type ReviewFilterGroupType = {
	id: string,
	title: string,
	options: ReviewFilterOptionType[]
};

declare type ReviewFilterOptionType = {
	filteredResultCount: number,
	id: string,
	isSelected: boolean,
	label: string,
	unfilteredResultCount: number
};

// See https://github.com/ReactTraining/history#listening
declare type HistoryLocationType = {
	pathname: string,
	search: string,
	hash: string,
	state: ?any,
	key: ?string
};

declare type HistoryType = {
	push: (url: string) => void,
	listen: ((location: HistoryLocationType, action: "PUSH" | "REPLACE" | "POP" | null) => void) => void,
	location: HistoryLocationType
};

declare type DocumentType = {
	title: string,
	sourceURI: string,
	convertedDocument: boolean
};

declare type ConsultationStateType = {
	consultationIsOpen: boolean,
	hasQuestions: boolean,
	consultationHasEnded: boolean,
	hasUserSuppliedAnswers: boolean,
	hasUserSuppliedComments: boolean,
	hasAnyDocumentsSupportingComments: boolean,
	documentIdsWhichSupportComments: Array<number>,
	shouldShowDrawer: boolean,
	shouldShowCommentsTab: boolean,
	shouldShowQuestionsTab: boolean,
	supportsDownload: boolean,
	reference?: string,
	userHasSubmitted: boolean,
};

declare type ConsultationDataType = {
	consultationState: ConsultationStateType,
	supportsComments: boolean,
	reference: string,
};

declare type CommentType = {
	commentId: number,
	lastModifiedDate: Date,
	lastModifiedByUserId: string,
	commentText: string,
	locationId: number,
	sourceURI: string,
	htmlElementID: string,
	rangeStart: string,
	rangeStartOffset: string,
	rangeEnd: string,
	rangeEndOffset: string,
	quote: string,
	commentOn: string,
	show: boolean,
	status: StatusType,
	order: string,
	section: string,
};

type StatusType = {
	statusId: number,
	name: string
};

type AnswerType = {
	answerId: number,
	answerText: string,
	answerBoolean: boolean,
	questionId: number,
	lastModifiedDate: Date,
	lastModifiedByUserId: string,
	statusId: number,
	status: StatusType
};

type QuestionTypeType = {
	description: string,
	hasTextAnswer: boolean,
	hasBooleanAnswer: boolean
};

declare type QuestionType = {
	questionId: number,
	questionText: string,
	questionTypeId: number,
	questionOrder: number,
	lastModifiedDate: Date,
	lastModifiedByUserId: string,
	questionType: QuestionTypeType,
	answers: Array<AnswerType>,
	show: boolean,
	commentOn: string,
	sourceURI: string,
	quote: string,
	documentId: number,
	isSubmissionQuestion: boolean,
};

declare type CommentsAndQuestionsType = {
	comments: Array<CommentType>,
	questions: Array<QuestionType>,
	isAuthorised: boolean,
	signInURL: string,
	consultationState: ConsultationStateType,
};

declare type ReviewPageViewModelType = {
	commentsAndQuestions: CommentsAndQuestionsType,
	filters: Array<ReviewFilterGroupType>,
	//QuestionsOrComments[] and Documents[] are only for sending up to the backend. not to use in react.
};

declare type ContextType = any;

declare type ConsultationListRow = {
	title:string,
	startDate : Date,
	endDate : Date,
	submissionCount:number,
	consultationId :number,
	documentId:number,
	chapterSlug :string,
	gidReference :string,
	productTypeName :string,
	isOpen: boolean,
	isClosed: boolean,
	isUpcoming: boolean,
	show: boolean,
};

declare type OptionFilterGroup = {
	filterText:string,
	isSelected:boolean,
	filteredResultCount:number,
	unfilteredResultCount:number,
};

declare type TextFilterGroup = {
	filterText:string,
	isSelected:boolean,
	filteredResultCount:number,
	unfilteredResultCount:number,
};

declare type AppliedFilterType = {
	groupId: string,
	groupTitle: string,
	optionId: string,
	optionLabel: string,
};

declare type ErrorType = {
	hasError: boolean,
	message: string | null,
};
