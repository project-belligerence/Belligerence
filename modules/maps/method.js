(function(){
	'use strict';

	var MapsModel = require('./../index.js').getModels().maps,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Maps",
		mainModel = MapsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.getClimates = getClimates;
	exports.getMapList = getMapList;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'demonym', 'classname', 'square_km', 'climate', 'active'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qId)) { object.id = { $like: "%" + req.query.qId + "%" }; }
				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qDemonym)) { object.demonym = { $like: "%" + req.query.qDemonym + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qClassname)) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (API.methods.isValid(req.query.qClimate)) { object.climate = { $like: "%" + req.query.qClimate + "%" }; }

				if (API.methods.isValid(req.query.qSquareKM)) { req.query.qSquareKM = JSON.parse(req.query.qSquareKM); object.square_km = { $between: [(req.query.qSquareKM.min || 0), (req.query.qSquareKM.max || 9999999)]}; }

				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function getClimates(req, res) {
		var configSides = mainModel.getClimates(), rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [(entries.length > 0)], config.messages().no_entries)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getMapList(req, res) {
		mainModel.findAll({attributes: ['nameField', 'hashField', 'classnameField', 'id']}).then(function(entries) {
			var rObject = [];
			for (var i = 0; i < entries.length; i++) { rObject.push({text: entries[i].nameField, data: entries[i].id, hash: entries[i].hashField, class: entries[i].classnameField}); }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"classnameField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.demonymField], 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.classnameField, 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.squarekmField, req.body.climateField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.nameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.demonymField)) update.demonymField = req.body.demonymField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.squarekmField)) update.squarekmField = req.body.squarekmField;
			if (API.methods.isValid(req.body.climateField)) update.climateField = req.body.climateField;
			if (API.methods.isValid(req.body.latitudeField)) update.latitudeField = req.body.latitudeField;
			if (API.methods.isValid(req.body.longitudeField)) update.longitudeField = req.body.longitudeField;
			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.demonymField], 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.classnameField, 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.squarekmField, req.body.climateField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'classnameField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.demonymField)) update.demonymField = req.body.demonymField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.squarekmField)) update.squarekmField = req.body.squarekmField;
			if (API.methods.isValid(req.body.climateField)) update.climateField = req.body.climateField;
			if (API.methods.isValid(req.body.latitudeField)) update.latitudeField = req.body.latitudeField;
			if (API.methods.isValid(req.body.longitudeField)) update.longitudeField = req.body.longitudeField;
			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			var OBJECT_FUNC_QUERY = { where: {} };
			OBJECT_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }, { 'classnameField': req.body.classnameField }];

			mainModel.findOne(OBJECT_FUNC_QUERY).then(function(duplicate) {
				if (!API.methods.validate(req, res, [(duplicate ? (entry.id === duplicate.id) : true)], config.messages().entry_exists(req.body.nameField))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), entry);
					});
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"classnameField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() { API.methods.sendResponse(req, res, true, config.messages().entry_deleted); });
		});
	}

})();