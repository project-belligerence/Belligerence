(function(){
	'use strict';

	var LocationsModel = require('./../index.js').getModels().locations,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Locations",
		mainModel = LocationsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.getLocationTypes = getLocationTypes;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'classname', 'grid_ref', 'position', 'type', 'size', 'elevation', 'importance', 'tenability', 'owner', 'insertable', 'extractable', 'active', 'MapId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qClassname)) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (API.methods.isValid(req.query.qType)) { object.type = { $like: "%" + req.query.qType + "%" }; }

				if (API.methods.isValid(req.query.qSize)) { req.query.qSize = JSON.parse(req.query.qSize); object.size = { $between: [(req.query.qSize.min || 0), (req.query.qSize.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qElevation)) { req.query.qElevation = JSON.parse(req.query.qElevation); object.elevation = { $between: [(req.query.qElevation.min || 0), (req.query.qElevation.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qImportance)) { req.query.qImportance = JSON.parse(req.query.qImportance); object.importance = { $between: [(req.query.qImportance.min || 0), (req.query.qImportance.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qTenability)) { req.query.qTenability = JSON.parse(req.query.qTenability); object.tenability = { $between: [(req.query.qTenability.min || 0), (req.query.qTenability.max || 9999999)]}; }

				if (API.methods.isValid(req.query.qOwner)) { object.owner = { $like: "%" + req.query.qOwner + "%" }; }
				if (API.methods.isValid(req.query.qMap)) { object.MapId = { $like: "%" + req.query.qMap + "%" }; }

				if (API.methods.isValid(req.query.qInsertable)) { object.insertable = { $like: API.methods.getBoolean(req.query.qInsertable, true) }; }
				if (API.methods.isValid(req.query.qExtractable)) { object.extractable = { $like: API.methods.getBoolean(req.query.qExtractable, true) }; }

				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function getLocationTypes(req, res) {
		var configSides = mainModel.getLocationTypes(), rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 12;

		var MapsModel = require('./../index.js').getModels().maps,
			queryValue = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		queryValue.include = [{ model: MapsModel, as: 'Map', attributes: ['nameField', 'classnameField'] }];

		mainModel.findAndCountAll(queryValue).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
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
			[req.body.name, 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.classname, 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.gridref, req.body.position, req.body.type], 'string'],
			[[req.body.size, req.body.elevation, req.body.importance, req.body.tenability, req.body.owner], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.nameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.gridRef)) update.gridRef = req.body.gridRef;
			if (API.methods.isValid(req.body.positionField)) update.positionField = req.body.positionField;
			if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
			if (API.methods.isValid(req.body.sizeField)) update.sizeField = req.body.sizeField;
			if (API.methods.isValid(req.body.elevationField)) update.elevationField = req.body.elevationField;
			if (API.methods.isValid(req.body.importanceField)) update.importanceField = req.body.importanceField;
			if (API.methods.isValid(req.body.tenabilityField)) update.tenabilityField = req.body.tenabilityField;
			if (API.methods.isValid(req.body.ownerField)) update.ownerField = req.body.ownerField;
			if (API.methods.isValid(req.body.insertableField)) update.insertableField = req.body.insertableField;
			if (API.methods.isValid(req.body.extractableField)) update.extractableField = req.body.extractableField;
			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.name, 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.classname, 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.gridref, req.body.position, req.body.type], 'string'],
			[[req.body.size, req.body.elevation, req.body.importance, req.body.tenability, req.body.owner], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'classnameField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.gridRef)) update.gridRef = req.body.gridRef;
			if (API.methods.isValid(req.body.positionField)) update.positionField = req.body.positionField;
			if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
			if (API.methods.isValid(req.body.sizeField)) update.sizeField = req.body.sizeField;
			if (API.methods.isValid(req.body.elevationField)) update.elevationField = req.body.elevationField;
			if (API.methods.isValid(req.body.importanceField)) update.importanceField = req.body.importanceField;
			if (API.methods.isValid(req.body.tenabilityField)) update.tenabilityField = req.body.tenabilityField;
			if (API.methods.isValid(req.body.ownerField)) update.ownerField = req.body.ownerField;
			if (API.methods.isValid(req.body.insertableField)) update.insertableField = req.body.insertableField;
			if (API.methods.isValid(req.body.extractableField)) update.extractableField = req.body.extractableField;
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