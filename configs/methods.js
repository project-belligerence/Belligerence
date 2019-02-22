(function() {
	'use strict';

	module.exports = {
		generateResponse: function(message, data, success, code) {
			this.header = 'Server response.';
			this.message = message || 'No message specified.';
			this.success = (success === undefined) ? true : success;
			this.count = (data ? (data.count || 0) : 0);
			this.data = ((data.rows || data) || '');
			this.code = (this.success ? (code || 200) : (code || 400));
		},
		setupPassportSteam: function(app) {
			var config = require('./../config.js'),
				passport = require('passport'),
				util = require('util'),
				session = require('express-session'),
				SteamStrategy = require('passport-steam').Strategy,
				baseURL = (process.env.PROTOCOL + "://" + process.env.ADDRESS + "/");

			passport.serializeUser(function(user, done) { done(null, user);	});
			passport.deserializeUser(function(obj, done) { done(null, obj);	});

			passport.use(new SteamStrategy({
				returnURL: ("https://belligerence.herokuapp.com/auth/steam/return"),
				realm: "https://belligerence.herokuapp.com/",
				apiKey: config.db.SteamAPIKey
		  	},
		  	function(identifier, profile, done) {
				process.nextTick(function () {
					profile.identifier = identifier;
					return done(null, profile);
				});
			}));

			app.use(session({ secret: process.env.STEAM_SESSION_SECRET, name: process.env.STEAM_SESSION_NAME, resave: true,	saveUninitialized: true	}));

			app.use(passport.initialize());
			app.use(passport.session());
		},
		closeServer: function() {
			console.log("SERVER STOPPED.");
			process.exit(0);
		},
		openServer: function(app) {
			console.log('Express server listening on port ' + app.get('port') + '.');
		}
	};

})();