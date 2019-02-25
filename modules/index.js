(function(){

	'use strict';

	var fs        = require("fs"),
		path      = require("path"),
		Sequelize = require("sequelize"),
		config    = require(__dirname + '/../config.js'),
		sequelize = config.db.connectToDatabase(),
		ssaclAttributeRoles = require('ssacl-attribute-roles'),

		folders = fs.readdirSync(__dirname).filter(function(file) {
			return (file.indexOf(".") !== 0) && (file !== "index.js");
  		});

  		ssaclAttributeRoles(sequelize);

  	function getModels() {
  		var db = {};

	  	folders.forEach(function(file) {
	  		var modPath = path.join(__dirname, file),
	  			folder = file;
	  		fs.readdirSync(modPath).filter(function(file) { return (file == "model.js"); })
	  		.forEach(function(file) {
	  			var modelImport = sequelize.import(path.join(modPath, file));
	  			db[folder] = modelImport;
			});
	  	});

		Object.keys(db).forEach(function(modelName) {
			if ("associate" in db[modelName]) {
				db[modelName].associate(db);
			}
		});

		db.sequelize = sequelize;
		db.Sequelize = Sequelize;

		// sequelize.sync();

		return db;
  	}

  	function getMethods() {
  		var methods	= {};

	  	folders.forEach(function(file) {
	  		var modPath = path.join(__dirname, file),
	  			folder = file;

	  		fs.readdirSync(modPath).filter(function(file) { return (file == "method.js"); })
	  		.forEach(function(file) {
	  			methods[folder] = require(path.join(modPath, file));
			});
	  	});

		return methods;
  	}

	module.exports = {
		getModels: getModels,
		getMethods: getMethods
	};

})();