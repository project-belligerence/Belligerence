(function() {
	'use strict';

	// SERVER DEPENDENCIES

	var 	express = require('express'),
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

			app = module.exports = express();

	// CONNECTS TO DATABASE
	var	sequelize = new Sequelize(config.db.newConnection());

	// ENVIRONMENTS
	app.set('port', process.env.PORT || config.port);
	app.set('view engine', 'ejs');
	app.use(morgan('dev'));

	app.set('views', __dirname + '/' + config.folders.views);
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'uploads')));

	// SETS UP ROUTES
	routes.setup(app, express);

	// CLOSES CONNECTION WITH DB WHEN TERMINATED
	process.on('SIGINT', config.methods.closeServer);

	// STARTS SERVER
	http.createServer(app).listen(app.get('port'), config.methods.openServer(app));

})();