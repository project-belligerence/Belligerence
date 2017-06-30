(function() {
	'use strict';

	var
		path = require('path'),
		debug = (process.env.NODE_ENV !== "production"),
		webpack = require('webpack'),
		BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
	;

	var
		uglifyConfig = {
			sourceMap: false,
			comments: false,
			compress: { warnings: false	}
		},

  		buildConfig = {
  			caching: true,
			context: __dirname,
			devtool: debug ? "inline-sourcemap" : null,
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

					'validator',
					'babel-polyfill',
					'oidc-client'
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
					oidc: "oidc-client"
				}),
				new webpack.optimize.CommonsChunkPlugin("vendors", "[name].bundle.js", Infinity)
				// new BundleAnalyzerPlugin()
			],
  		}
  	;

	buildConfig.entry.vendors.push('bootstrap/dist/js/bootstrap.min');
	// buildConfig.entry.vendors.push('bootstrap/dist/js/npm');

  	buildConfig.entry.vendors.push('jquery/dist/jquery');

  	buildConfig.entry.vendors.push('lodash/lodash.min');

  	buildConfig.entry.vendors.push('angular-ui-bootstrap/dist/ui-bootstrap-tpls');

	if (true) buildConfig.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));

	module.exports = buildConfig;

})();