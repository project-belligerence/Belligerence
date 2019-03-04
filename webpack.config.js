(function() {
	'use strict';

	var
		path = require('path'),
		dotenv = require('dotenv').config(),
		debug = (process.env.NODE_ENV !== "production"),
		webpack = require('webpack'),
		BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
	;

	var
		uglifyConfig = {
			comments: false,
			compress: { warnings: false	}
		},

  		buildConfig = {
  			caching: false,
			context: __dirname,
			devtool: (debug ? "inline-sourcemap" : null),
			entry: {
				app: "./dev/js/app.js",
				vendors: [
					'angular',
					'angular-loading-bar',
					'angular-animate',
					'angular-ui-router',
					'angular-cookies',
					'angular-touch',
					'angular-ui-router-default',
					'ng-file-upload',
					'ng-tags-input',
					'angular-timeago',
					'angular-bootstrap-colorpicker',
					'angularjs-slider',
					'angular-websocket',
					'validator'
				]
			},
			output: {
				path: __dirname + "/public/js",
				filename: "app.min.js"
			},
			resolve: {
				alias: {}
			},
			module: {
				noParse: [],
				loaders: []
			},
			plugins: [
				new webpack.optimize.DedupePlugin(),
				new webpack.optimize.OccurenceOrderPlugin(),
				new webpack.ProvidePlugin({
					$: "jquery",
					jQuery: "jquery",
					"window.jQuery":"jquery",
					_: "lodash",
					validator: "validator",
					masonry: "masonry-layout",
					SimpleCryptoJS: "simple-crypto-js",
					matrixTransform: "2d-css-matrix-parse",
					moment: "moment",
					webNotificationAPI: "simple-web-notification",
					AOS: "aos"
				}),
				new webpack.optimize.CommonsChunkPlugin("vendors", "[name].bundle.js", Infinity)

				// new BundleAnalyzerPlugin()
			],
  		}
  	;

	buildConfig.entry.vendors.push('bootstrap/dist/js/bootstrap.min');
	buildConfig.entry.vendors.push('angular-ui-bootstrap/dist/ui-bootstrap-tpls');

	if (!debug) buildConfig.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));

	module.exports = buildConfig;

})();