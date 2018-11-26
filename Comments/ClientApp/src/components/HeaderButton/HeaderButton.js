// @flow

import React, {Fragment, PureComponent} from "react";
import Moment from "react-moment";

type PropsType = {
	isAuthorised: boolean,
	responseCount?: number,
}

export class HeaderButton extends PureComponent<PropsType> {

	render() {
		return (
			<div>
				{this.props.isAuthorised && this.props.responseCount > 0 ?
					<button>Hello
					</button>
					: null}
			</div>
		);
	}

}
