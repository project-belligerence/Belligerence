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
				baseURL = (process.env.PROTOCOL + "://" + process.env.ADDRESS + "/"),

				redisConnect = { url: process.env.REDISTOGO_URL, logErrors: true };

			passport.serializeUser(function(user, done) { done(null, user);	});
			passport.deserializeUser(function(obj, done) { done(null, obj);	});

			console.log("=========== ATTEMPTING TO CREATE STRATEGY WITH:");
			console.log(config.db.SteamAPIKey);

			passport.use(new SteamStrategy({
				returnURL: "https://belligerence.herokuapp.com/auth/steam/return",
				realm: "https://belligerence.herokuapp.com/",
				apiKey: config.db.SteamAPIKey,
				https: true,
				proxy: true
		  	},
		  	function(identifier, profile, done) {
				process.nextTick(function () {
					console.log("==========", identifier, profile);
					profile.identifier = identifier;
					return done(null, profile);
				});
			}));

			app.use(session({
				secret: process.env.STEAM_SESSION_SECRET,
				name: process.env.STEAM_SESSION_NAME,
				store: new RedisStore(redisConnect),
				resave: false,
				saveUninitialized: true
			}));

			app.use(passport.initialize());
			app.use(passport.session());

			console.log("=========== PASSPORT CREATOR:");
			console.log(passport);

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