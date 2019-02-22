(function() {
	'use strict';

	// SERVER DEPENDENCIES

	var 	express = require('express'),
			dotenv = require('dotenv').config(),
			Sequelize = require('sequelize'),

			methodOverride = require('method-override'),
			http = require('http'),
			path = require('path'),
			morgan = require('morgan'),
			favicon = require('serve-favicon'),

			config = require('./config.js'),
			routes = require('./routes/routes.js'),
			models = require('./modules/index.js').getModels(),

			env = process.env.NODE_ENV || config.env,

			app = module.exports = express(),

			// Runs scheduled tasks.
			scheduled = config.scheduled();

	// CONNECTS TO DATABASE
	var	sequelize = new Sequelize(config.db.newConnection());

	// SETUP PASSPORT
	config.methods.setupPassportSteam(app);

	// ENVIRONMENTS
	app.set('port', process.env.APP_PORT || config.port);
	app.set('view engine', 'ejs');
	app.use(morgan('dev'));

	app.set('views', __dirname + '/' + config.folders.views);
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'uploads')));

	// SETS UP ROUTES
	routes.setup(app, express);

	// STARTS SERVER
	var serverObject = http.createServer(app).listen(app.get('port'), config.methods.openServer(app));

	// INITIALIZES WEBSOCKET
	config.websocket.init(serverObject);

	// CLOSES CONNECTION WITH DB WHEN TERMINATED
	process.on('SIGINT', config.methods.closeServer);

})();