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

		newConnection: function() {
			if (process.env.CLEARDB_DATABASE_URL) return process.env.CLEARDB_DATABASE_URL;
			if (process.env.JAWSDB_URL) return process.env.JAWSDB_URL;

			return (this.protocol + '://'+ this.cred.user + ':' + this.cred.password + '@' + this.server + ":" + this.port + '/' + this.name);
		},

		connectToDatabase: function() {
			var Sequelize = require('sequelize'),
				options = {
					port: process.env.DB_PORT,
					dialect: process.env.DB_PROTOCOL,
					host: process.env.ADDRESS,
					pool: { max: process.env.DB_MAX_POOL, min: 1, idle: 1000 },
					sync: { force: true }
				},
				sequelize = new Sequelize(this.server, this.cred.user, this.cred.password, options),
				debugDB = false;

				//this.newConnection()

			if (debugDB) { setInterval(function () { sequelize.query('SELECT SLEEP(1);'); }, 2000); }

			return sequelize;
		}
	};

})();