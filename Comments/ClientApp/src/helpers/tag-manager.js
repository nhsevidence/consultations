export const tagManager = (props) => {
	if (!props) return;
	if (window && window.dataLayer) {
		window.analyticsGlobals = Object.assign({}, window.analyticsGlobals, props);
		window.dataLayer.push(props);
	}
};
