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
						'dev/js/**/*.js',
						config.files.app,
						config.folders.config + '/**/*.js',
					],
					tasks: ['jshint']
				},

				sass: {
					files: [config.folders.dev + '/sass/**/*.scss'],
					tasks: ['sass:dist']
				},

				server: {
					files: [
						'.env',
						'app.js',
						'config.js',
						config.folders.config + '/**/*.js',
						'routes/**/*.js',
						'modules/**/*.js'
					],
					tasks: ['express:web'],
					options: {
						nospawn: true,
						atBegin: true
					}
				},

				livereload: {
					files: [
						config.folders.views,
						config.folders.views + '/**/*.ejs',
						config.folders.public + '/js/**/*.js',
						config.folders.public + '/styles/**/*.css'
					],
					options: { livereload: true }
				}
			},

			jshint: {
				all: [
					'routes/**/*.js',
					'test/**/*.js',
					'modules/**/*.js',
					config.folders.config + '/**/*.js',
					config.folders.dev + '/js/**/*js',
					config.files.app,
					config.files.config,
					config.files.gruntfile,

					'!dev/js/lib/**/*.js'
				],
				options: { node: true }
			},

			sass: {
				options: {
					sourceMap: false,
					outputStyle: 'compressed'
				},
				dist: {
					files: [{
						'public/styles/vendor.css': 'dev/sass/vendor.scss',
						'public/styles/main.css': 'dev/sass/main.scss'
					}]
				}
			},

			parallel: {
				web: {
					options: { stream: true	},
					tasks: [
						{ grunt: true, args: ['watch:gruntfile'] },
						{ grunt: true, args: ['watch:server'] },
						{ grunt: true, args: ['watch:js'] },
						{ grunt: true, args: ['watch:sass'] },
						{ grunt: true, args: ['watch:livereload'] }
					]
				}
			}
		});

		grunt.registerTask('default', ['parallel:web']);
	};

})();
