(function(){
	'use strict';

	module.exports = function (grunt) {
		require('load-grunt-tasks')(grunt);
		var config = require('./config');

		grunt.initConfig({

			pkg: grunt.file.readJSON('package.json'),

			express: {
				options: {
					port: config.port
				},
				web: {
					options: {
						script: config.files.app
					}
				}
			},

			watch: {
				gruntfile: {
					files: ['Gruntfile.js'],
					tasks: ['jshint']
				},

				js: {
					files: [
						'routes/**/*.js',
						'test/**/*.js',
						'modules/**/*.js',
						config.files.app,
						config.files.config
					],
					tasks: ['jshint']
				},

				server: {
					files: [
						'app.js',
						'config.js',
						'routes/**/*.js',
						'modules/**/*.js'
					],
					tasks: [ 'express:web' ],
					options: {
						nospawn: true,
						atBegin: true
					}
				},

				webpack: {
					files: [
						'public/**/*.js'
					]
				},

				livereload: {
					files: [
						config.folders.views + '/**/*.ejs',
						config.folders.public + '/js/**/*.js',
						config.folders.public + '/styles/*.css'
					],
					options: { livereload: true }
				}
			},

			webpack: {
				angularApp: {
				    context: __dirname,
				    entry: "./public/js",
				    output: {
				        path: __dirname + "/dist",
				        filename: "[name].bundle.js"
				    },

					// // webpack options
					// entry: "/public/js/app.js",
					// output: {
					// 	path: "/public/js/compiled",
					// 	filename: "[hash].js",
					// },

					stats: {
						// Configure the console output
						colors: false,
						modules: true,
						reasons: true
					},
					// stats: false disables the stats output

					storeStatsTo: "xyz", // writes the status to a variable named xyz
					// you may use it later in grunt i.e. <%= xyz.hash %>

					failOnError: false, // don't report error to grunt if webpack find errors
					// Use this if webpack errors are tolerable and grunt should continue

					watch: true, // use webpacks watcher
					// You need to keep the grunt process alive

				watchOptions: {
						aggregateTimeout: 500,
						poll: true
					},
					// Use this when you need to fallback to poll based watching (webpack 1.9.1+ only)

					keepalive: true, // don't finish the grunt task
					// Use this in combination with the watch option
				}
			},

			jshint: {
				all: [
					'routes/**/*.js',
					'test/**/*.js',
					'modules/**/*.js',
					'configs/*.js',
					'public/*js',
					config.files.app,
					config.files.config,
					config.files.gruntfile
				],
				options: { node: true }
			},

			parallel: {
				web: {
					options: { stream: true	},
					tasks: [
						{ grunt: true, args: ['watch:gruntfile'] },
						{ grunt: true, args: ['watch:server'] },
						{ grunt: true, args: ['watch:js']},
						{ grunt: true, args: ['watch:webpack']},
						{ grunt: true, args: ['watch:livereload']}
					]
				}
			}
		});

		grunt.registerTask('default', ['parallel:web']);
	};

})();
