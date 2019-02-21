(function(){
	'use strict';

	var AdvisoriesModel = require('./../index.js').getModels().advisories,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Advisories",
		mainModel = AdvisoriesModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getSimpleList = getSimpleList;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.duplicateEntry = duplicateEntry;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'classname', 'description', 'value', 'disabled_objectives', 'disabled_maps', 'global', 'active'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qClassname)) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (API.methods.isValid(req.query.qValue)) { req.query.qValue = JSON.parse(req.query.qValue); object.value = { $between: [(req.query.qValue.min || -10), (req.query.qValue.max || 10)]}; }

				if (API.methods.isValid(req.query.qDisabledObjectives)) { object.disabled_objectives = { $like: "%" + req.query.qDisabledObjectives + "%" }; }
				if (API.methods.isValid(req.query.qDisabledMaps)) { object.disabled_maps = { $like: "%" + req.query.qDisabledMaps + "%" }; }

				if (API.methods.isValid(req.query.qGlobal)) { object.global = { $like: API.methods.getBoolean(req.query.qGlobal, true) }; }
				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getSimpleList(req, res) {
		mainModel.findAll({ where: { "id": req.body.list, "activeField": true }, attributes: ['id', "nameField", "iconName"] }).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
		});
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;
		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.classnameField, req.body.iconName], 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.descriptionField, 'string', config.numbers.modules.players.bioLength],
			[req.body.valueField, 'number']
		])) { return 0; }

		mainModel.findOne({where:{'classnameField': req.body.classnameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.classnameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.valueField)) update.valueField = req.body.valueField;
			if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;

			if (API.methods.isValid(req.body.disabledObjectives)) update.disabledObjectives = req.body.disabledObjectives;
			if (API.methods.isValid(req.body.disabledMaps)) update.disabledMaps = req.body.disabledMaps;

			if (API.methods.isValid(req.body.globalField)) update.globalField = req.body.globalField;
			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.classnameField, req.body.iconName], 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.descriptionField, 'string', config.numbers.modules.players.bioLength],
			[req.body.valueField, 'number']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.valueField)) update.valueField = req.body.valueField;
			if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;

			if (API.methods.isValid(req.body.disabledObjectives)) update.disabledObjectives = req.body.disabledObjectives;
			if (API.methods.isValid(req.body.disabledMaps)) update.disabledMaps = req.body.disabledMaps;

			if (API.methods.isValid(req.body.globalField)) update.globalField = req.body.globalField;
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

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() { API.methods.sendResponse(req, res, true, config.messages().entry_deleted); });
		});
	}

	function duplicateEntry(req, res) {
		mainModel.findOne({ where: { "hashField": req.params.Hash }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var _ = require("lodash"),
				update = _.omit(entry.dataValues, ["id", "hashField", "createdAt", "updatedAt"]);

			update.nameField += " (copy)";
			update.classnameField += "_copy";

			update.disabledObjectives = update.disabledObjectives.split(",");
			update.disabledMaps = update.disabledMaps.split(",");

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(nEntry) {
					API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
				});
			});
		});
	}

})();