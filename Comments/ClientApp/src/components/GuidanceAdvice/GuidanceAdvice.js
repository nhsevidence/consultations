import React, { Component } from "react";

export class GuidanceAdvice extends Component {
	render() {
		return (
			<aside className="GuidanceAdvice">
				<div className="container">
					<div className="grid">
						<div data-g="12">
							<p className="GuidanceAdvice__Statement">
								<span style={{color: "red"}} className="icon icon--warning" aria-hidden="true"/> The content on this page is not
								current guidance and is only available for the purposes of the consultation process.
							</p>
						</div>
					</div>
				</div>
			</aside>
		);
	}
}
