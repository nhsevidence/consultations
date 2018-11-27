// @flow

import React, {Fragment, PureComponent} from "react";
import {Link} from "react-router-dom";

type PropsType = {
	isAuthorised: boolean,
	responseCount?: number,
	consultationId: number,
}

export class HeaderButton extends PureComponent<PropsType> {

	render() {

		const showButton = ((this.props.isAuthorised) && 
							(typeof(this.props.responseCount) != undefined && this.props.responseCount != null && this.props.responseCount > 0));

		return (
			<Fragment>
				{showButton ? 
					<Link to={`/${this.props.consultationId}/review`}>Hello</Link>					
					: null}
			</Fragment>
		);
	}
}