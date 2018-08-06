import { load } from "../data/loader";

export function saveCommentHandler(e: Event, comment: CommentType, self: any) {
    e.preventDefault();

    const isANewComment = comment.commentId < 0;
    const method = isANewComment ? "POST" : "PUT";
    const urlParameters = isANewComment ? [] : [comment.commentId];
    const endpointName = isANewComment ? "newcomment" : "editcomment";
    let error = "";

    load(endpointName, undefined, urlParameters, {}, method, comment, true)
        .then(res => {
            if (res.status === 201 || res.status === 200) {
                const index = self.state.comments
                    .map(function(comment) {
                        return comment.commentId;
                    })
                    .indexOf(comment.commentId);
                const comments = self.state.comments;
                comments[index] = res.data;
                self.setState({
                    comments,
                    error
                });
                if (typeof self.validationHander === "function") {
                    self.validationHander();
                }
            }
        })
        .catch(err => {
            console.log(err);
            if (err.response) {
                error = "save";
                self.setState({
                    error
                });                
            }
        });
};

export function deleteCommentHandler(e: Event, commentId: number, self: any) {
    e.preventDefault();
    if (commentId < 0) {
        removeCommentFromState(commentId, self);
    } else {
        load("editcomment", undefined, [commentId], {}, "DELETE")
            .then(res => {
                if (res.status === 200) {
                    removeCommentFromState(commentId, self);
                }
            })
            .catch(err => {
                console.log(err);
                if (err.response) {
                    const error = "delete";
                    self.setState({
                        error
                    });
                    
                }
            });
    }
};

export function saveAnswerHandler(e: Event, answer: AnswerType, self: any) {
    e.preventDefault();
    const isANewAnswer = answer.answerId < 0;
    const method = isANewAnswer ? "POST" : "PUT";
    const urlParameters = isANewAnswer ? [] : [answer.answerId];
    const endpointName = isANewAnswer ? "newanswer" : "editanswer";

    load(endpointName, undefined, urlParameters, {}, method, answer, true)
        .then(res => {
            if (res.status === 201 || res.status === 200) {
                const questionIndex = self.state.questions
                    .map(function(question) {
                        return question.questionId;
                    })
                    .indexOf(answer.questionId);
                const questions = self.state.questions;

                if (questions[questionIndex].answers === null || questions[questionIndex].answers.length < 1){
                    questions[questionIndex].answers = [res.data];
                } else{
                    const answerIndex = questions[questionIndex].answers
                        .map(function(answer) {
                            return answer.answerId;
                        }).indexOf(answer.answerId);

                    const answers = questions[questionIndex].answers;
                    answers[answerIndex] = res.data;
                    questions[questionIndex].answers = answers;
                }
                self.setState({
                    questions
                });
                if (typeof self.validationHander === "function") {
                    self.validationHander();
                }
            }
        })
        .catch(err => {
            console.log(err);
            if (err.response) alert(err.response.statusText);
        });
};

export function deleteAnswerHandler(e: Event, questionId: number, answerId: number, self: any) {
    e.preventDefault();
    //todo: call the delete answer api, then update the state on success.
    if (answerId < 0) {
        removeAnswerFromState(questionId, answerId);
    } else {
        load("editanswer", undefined, [answerId], {}, "DELETE")
            .then(res => {
                if (res.status === 200) {
                    removeAnswerFromState(questionId, answerId, self);
                }
            })
            .catch(err => {
                console.log(err);
                if (err.response) alert(err.response.statusText);
            });
    }
};

function removeCommentFromState(commentId: number, self: any) {
    let comments = self.state.comments;
    const error = "";
    comments = comments.filter(comment => comment.commentId !== commentId);
    self.setState({ comments, error });
    if ((comments.length === 0) && (typeof self.validationHander === "function")) {
        self.validationHander();
    }
};

function removeAnswerFromState(questionId: number, answerId: number, self: any) {
    let questions = self.state.questions;
    let questionToUpdate = questions.find(question => question.questionId === questionId);
    questionToUpdate.answers = questionToUpdate.answers.filter(answer => answer.answerId !== answerId);
    self.setState({ questions });
    if (typeof self.validationHander === "function") {
        self.validationHander();
    }
};