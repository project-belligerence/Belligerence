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
		aws: {
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			region: process.env.AWS_REGION,
			bucket: process.env.AWS_S3_BUCKET_NAME
		},
		port: parseInt(process.env.DB_PORT),
		sessionDurationMinutes: parseInt(process.env.SESSION_DURATION),
		secretKey: process.env.DB_SECRET_KEY,
		hashSize: 20,
		queryPageLimit: 5,
		SteamAPIKey: process.env.API_KEY_STEAM,

		newConnection: function(options) {
			var Sequelize = require('sequelize'), URI;

			if (process.env.CLEARDB_DATABASE_URL) URI = process.env.CLEARDB_DATABASE_URL;
			if (process.env.JAWSDB_URL) URI = process.env.JAWSDB_URL;

			if (URI) { return new Sequelize(URI, options); }
			else { return new Sequelize(this.name, this.cred.user, this.cred.password, options); }
		},

		connectToDatabase: function() {
			var options = {
				port: parseInt(process.env.DB_PORT),
				host: this.server,

				dialect: process.env.DB_PROTOCOL,
				pool: {
					maxConnections: parseInt(process.env.DB_MAX_POOL),
					max: parseInt(process.env.DB_MAX_POOL),
					minConnections: 0,
					min: 0,
					maxIdleTime: 10000,
					acquire: 30000
				}
			},
			sequelize = this.newConnection(options),
			debugDB = false;

			if (debugDB) { setInterval(function () { sequelize.query('SELECT SLEEP(1);'); }, 2000); }

			return sequelize;
		}
	};

})();