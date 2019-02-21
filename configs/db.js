(function() {
	'use strict';

	module.exports = {
		name: process.env.DB_NAME,
		protocol: process.env.DB_PROTOCOL,
		server: process.env.DB_SERVER,
		cred: {
			user: process.env.DB_CRED_USER,
			password: process.env.DB_CRED_PASS,
		},
		port: process.env.DB_PORT,
		sessionDurationMinutes: process.env.SESSION_DURATION,
		secretKey: process.env.DB_SECRET_KEY,
		hashSize: 20,
		queryPageLimit: 5,
		SteamAPIKey: process.env.API_KEY_STEAM,

		newConnection: function() { return (this.protocol + '://'+ this.cred.user + ':' + this.cred.password + '@' + this.server + ":" + this.port + '/' + this.name); },
	};

})();