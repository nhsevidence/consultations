module.exports = function (api) {
	api.cache(true);
	return {
		presets: ["react-app"],
		plugins: [
			"@babel/plugin-transform-modules-commonjs",
			"babel-plugin-lodash",
		]
	};
};
