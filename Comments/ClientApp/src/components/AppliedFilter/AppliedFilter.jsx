// @flow

import React, { Component } from "react";
//import stringifyObject from "stringify-object";

import { removeQueryParameter } from "./../../helpers/utils";
import { withHistory } from "./../HistoryContext/HistoryContext";

type PropsType = {
	appliedFilter: AppliedFilterType,
	history: HistoryType,
	path: string,
	onRemoveFilter: Function,
};

export class AppliedFilter extends Component<PropsType> {
	constructor(props: PropsType) {
		super(props);

		this.handleRemoveFilterLinkClick = this.handleRemoveFilterLinkClick.bind(this);
	}

	//handleRemoveFilterLinkClick: () => void;
	handleRemoveFilterLinkClick(e: DOMEvent) {
		e.preventDefault();
		this.props.history.push(this.getHref());
		if (typeof this.props.onRemoveFilter === "function") {
			this.props.onRemoveFilter(e.currentTarget.getAttribute("data-option-id"));
		}
	}

	getHref() {
		return removeQueryParameter(
			this.props.path,
			this.props.appliedFilter.groupId,
			this.props.appliedFilter.optionId,
		);
	}

	render() {
		const filterTitle = `${this.props.appliedFilter.groupTitle}: ${
			this.props.appliedFilter.optionLabel
		}`;

		return (
			<li className="results-info__filter">
				<span className="tag tag--outline" data-qa-sel="filter-keyword">
					{filterTitle}
					<a
						href={this.getHref()}
						className="tag__remove gtm-topic-list-applied-filter"
						title={filterTitle}
						onClick={this.handleRemoveFilterLinkClick}
						data-option-id={this.props.appliedFilter.optionId}
					>
						<span className="icon icon--remove" aria-hidden="true" />
						<span className="visually-hidden">
							Remove ‘{filterTitle}’ filter
						</span>
					</a>
				</span>
			</li>
		);
	}
}

export default withHistory(AppliedFilter);
