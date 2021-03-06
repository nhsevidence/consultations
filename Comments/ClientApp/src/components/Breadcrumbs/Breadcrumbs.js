// @flow

import React, {PureComponent} from "react";
import {Link, withRouter} from "react-router-dom";
import {isHttpLink} from "../../helpers/utils";
import {tagManager} from "../../helpers/tag-manager";

type LinksType = {
	label: string,
	url: string,
	localRoute: boolean,
};

type PropsType = {
	links: Array<LinksType>,
};

export class Breadcrumbs extends PureComponent<PropsType> {

	trackBreadcrumb = (segment) => {
		tagManager({
			event: "generic",
			category: "Breadcrumb - guidancebreadcrumb",
			action: segment.url,
			label: this.props.location.pathname,
		});
	};

	render() {
		return (
			<nav aria-label="Breadcrumbs">
				<p className="visually-hidden">You are here:</p>
				<ol
					className="breadcrumbs"
					itemScope
					itemType="http://schema.org/BreadcrumbList"
				>
					{this.props.links.map((segment, index) => {
						const {label, url, localRoute} = segment;
						return (
							<li
								key={`${label}${index}`}
								className="breadcrumbs__crumb"
								itemProp="itemListElement"
								itemScope
								itemType="http://schema.org/ListItem"
								onClick={()=>this.trackBreadcrumb(segment)}
								role="presentation"
							>
								{(isHttpLink(url) || (url.indexOf("/") === 0 && !localRoute)) ?
									<a href={url} itemProp="item">
										<span itemProp="name">{label}</span>
									</a>
									:
									<Link to={url} itemProp="item">
										<span itemProp="name">{label}</span>
									</Link>
								}
								<meta itemProp="position" content={index}/>
							</li>
						);
					})}
				</ol>
			</nav>
		);
	}
}

export default withRouter(Breadcrumbs);
