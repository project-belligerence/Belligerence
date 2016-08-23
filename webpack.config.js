(function() {
	'use strict';

	var
		debug = process.env.NODE_ENV !== "production",
		webpack = require('webpack')
	;

	var
		uglifyConfig = {
			sourceMap: false,
			comments: false,
			compress: {
				warnings: false,
			}
		},

  		buildConfig = {
			context: __dirname,
			devtool: debug ? "inline-sourcemap" : null,
			entry: {
				app: "./public/js/app.js",
				vendors: ['angular', 'lodash']
			},
			output: {
				path: __dirname + "/public/js",
				filename: "scripts.min.js"
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
				new webpack.optimize.CommonsChunkPlugin("vendors", "[name].[chunkhash].bundle.js", Infinity)
			],
  		}
  	;

  	for (let i in buildConfig.entry.vendors) {
  		var v = buildConfig.entry.vendors[i];
  		buildConfig.entry.vendors[i] = v + "/" + v + ".min";
  	}

	if (true) buildConfig.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));

	module.exports = buildConfig;

})();