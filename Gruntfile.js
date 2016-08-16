(function(){
	'use strict';

	module.exports = function (grunt) {
		require('load-grunt-tasks')(grunt);

		var config = {
			public: 'public',
			views: 'views',
			port: '8080'
		};

		grunt.initConfig({

			pkg: grunt.file.readJSON('package.json'),

			express: {
				options: {
					port: config.port
				},
				web: {
					options: {
						script: 'app.js'
					}
				}
			},

			watch: {
				gruntfile: {
					files:['Gruntfile.js'],
					tasks: ['jshint']
				},

				js: {
					files: [ 'routes/**/*.js', 'app.js', 'config.js', 'test/**/*.js', 'modules/**/*.js' ],
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

				livereload: {
					files: [
						config.views + '/**/*.ejs',
						config.public + '/js/**/*.js',
						config.public + '/styles/*.css'
					],
					options: { livereload: true }
				}
			},

			jshint: {
				all: [ 'routes/**/*.js', 'test/**/*.js', 'modules/**/*.js', 'modules/**/*.js', 'app.js', 'config.js', 'Gruntfile.js' ],
				options: { node: true }
			},

			parallel: {
				web: {
					options: { stream: true	},
					tasks: [
						{ grunt: true, args: ['watch:gruntfile'] },
						{ grunt: true, args: ['watch:server'] },
						{ grunt: true, args: ['watch:js']},
						{ grunt: true, args: ['watch:livereload']}
					]
				}
			}
		});

		grunt.registerTask('default', ['parallel:web']);
	};

})();
