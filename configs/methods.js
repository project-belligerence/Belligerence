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
				session = require('express-session'),
				RedisStore = require('connect-redis')(session),
				SteamStrategy = require('passport-steam').Strategy,
				steam_API_Key = process.env.API_KEY_STEAM,

				baseURL = (process.env.PROTOCOL + "://" + process.env.ADDRESS + ":" + process.env.APP_PORT + "/"),

				redisConnect = { url: process.env.REDISTOGO_URL, logErrors: true },

				sessionObject = {
					secret: process.env.STEAM_SESSION_SECRET,
					name: process.env.STEAM_SESSION_NAME,
					resave: false,
					saveUninitialized: true,
					https: true,
					proxy: true
				};

			passport.serializeUser(function(user, done) { done(null, user);	});
			passport.deserializeUser(function(obj, done) { done(null, obj);	});

			if (process.env.NODE_ENV === "production") {
				baseURL = (process.env.PROTOCOL + "://" + process.env.ADDRESS + "/");
				sessionObject.store = new RedisStore(redisConnect);
			}

			passport.use(new SteamStrategy({
				apiKey: steam_API_Key,
				returnURL: baseURL + "auth/steam/return",
				realm: baseURL
		  	},
		  	function(identifier, profile, done) {
				process.nextTick(function () {
					profile.identifier = identifier;
					return done(null, profile);
				});
			}));

			app.use(session(sessionObject));

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