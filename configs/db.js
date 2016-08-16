(function() {
	'use strict';

	module.exports = {
		name: "armadb",
		protocol: (process.env.DB_PROTOCOL || 'mysql'),
		server: (process.env.DB_SERVER || 'localhost'),
		path: (process.env.MONGOLAB_URI || 'mongodb://localhost/'),
		cred: {
			user: "admin",
			password: "awp123",
		},
		port: 3306,
		sessionDurationMinutes: 30,
		secretKey: (process.env.SECRET_KEY || 'ClearAsACrispSpringMorning'),
		hashSize: 20,
		queryPageLimit: 5,

		newConnection: function() { return this.protocol + '://'+ this.cred.user + ':' + this.cred.password + '@' + this.server + ":" + this.port + '/' + this.name; },
	}

})();