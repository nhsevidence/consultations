// @flow

import React, {Fragment, PureComponent} from "react";
import Moment from "react-moment";

type PropsType = {
	title: string,
	endDate?: any,
	match?: any,
	subtitle1?: string,
	subtitle2?: string,
	consultationState?: {
		endDate: string,
		consultationIsOpen: boolean,
		consultationHasNotStartedYet: ?boolean,
	},
}

export class HeaderButton extends PureComponent<PropsType> {

	render() {
		return (
			<div>hello</div>	
		);
	}

}
