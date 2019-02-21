(function(){
	'use strict';

	var ObjectivesModel = require('./../index.js').getModels().objectives,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Objectives",
		mainModel = ObjectivesModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.getSimpleList = getSimpleList;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.duplicateEntry = duplicateEntry;
	exports.getObjectiveList = getObjectiveList;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'classname', 'icon', 'task_icon', 'description', 'success_desc', 'failure_desc', 'hour_limit', 'difficulty', 'unit_limit', 'chance', 'asset_cost', 'asset_damage', 'base_reward', 'doctrines', 'locations', 'disabled_maps', 'capture', 'adversarial', 'active'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qId)) { object.id = { $like: "%" + req.query.qId + "%" }; }
				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qClassname)) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qSuccessDesc)) { object.success_desc = { $like: "%" + req.query.qSuccessDesc + "%" }; }
				if (API.methods.isValid(req.query.qFailedDesc)) { object.failed_desc = { $like: "%" + req.query.qFailedDesc + "%" }; }
				if (API.methods.isValid(req.query.qIcon)) { object.icon = { $like: "%" + req.query.qIcon + "%" }; }
				if (API.methods.isValid(req.query.qTaskIcon)) { object.task_icon = { $like: "%" + req.query.qTaskIcon + "%" }; }
				if (API.methods.isValid(req.query.qHourLimit)) { req.query.qHourLimit = JSON.parse(req.query.qHourLimit); object.hour_limit = { $between: [(req.query.qHourLimit.min || 1), (req.query.qHourLimit.max || 72)]}; }
				if (API.methods.isValid(req.query.qDifficulty)) { req.query.qDifficulty = JSON.parse(req.query.qDifficulty); object.difficulty = { $between: [(req.query.qDifficulty.min || -10), (req.query.qDifficulty.max || 10)]}; }
				if (API.methods.isValid(req.query.qUnitLimit)) { req.query.qUnitLimit = JSON.parse(req.query.qUnitLimit); object.unit_limit = { $between: [(req.query.qUnitLimit.min || -10), (req.query.qUnitLimit.max || 10)]}; }
				if (API.methods.isValid(req.query.qChance)) { req.query.qChance = JSON.parse(req.query.qChance); object.chance = { $between: [(req.query.qChance.min || -10), (req.query.qChance.max || 10)]}; }
				if (API.methods.isValid(req.query.qAssetCost)) { req.query.qAssetCost = JSON.parse(req.query.qAssetCost); object.asset_cost = { $between: [(req.query.qAssetCost.min || -10), (req.query.qAssetCost.max || 10)]}; }
				if (API.methods.isValid(req.query.qAssetDamage)) { req.query.qAssetDamage = JSON.parse(req.query.qAssetDamage); object.asset_damage = { $between: [(req.query.qAssetDamage.min || -10), (req.query.qAssetDamage.max || 10)]}; }
				if (API.methods.isValid(req.query.qBaseReward)) { req.query.qBaseReward = JSON.parse(req.query.qBaseReward); object.base_reward = { $between: [(req.query.qBaseReward.min || 0), (req.query.qBaseReward.max || 9999999999)]}; }
				if (API.methods.isValid(req.query.qDoctrineTypes)) { object.doctrines = { $like: "%" + req.query.qDoctrineTypes + "%" }; }
				if (API.methods.isValid(req.query.qLocationTypes)) { object.locations = { $like: "%" + req.query.qLocationTypes + "%" }; }
				if (API.methods.isValid(req.query.qDisabledMaps)) { object.disabled_maps = { $like: "%" + req.query.qDisabledMaps + "%" }; }
				if (API.methods.isValid(req.query.qCapture)) { object.capture = { $like: API.methods.getBoolean(req.query.qCapture, true) }; }
				if (API.methods.isValid(req.query.qAdversarial)) { object.adversarial = { $like: API.methods.getBoolean(req.query.qAdversarial, true) }; }
				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendRespwonse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getObjectiveList(req, res) {
		mainModel.findAll({attributes: ['nameField', 'id']}).then(function(entries) {
			var rObject = [];
			for (var i = 0; i < entries.length; i++) { rObject.push({text: entries[i].nameField, data: entries[i].id}); }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
		});
	}

	function getSimpleList(req, res) {
		mainModel.findAll({ where: { "id": req.body.list, "activeField": true }, attributes: ['id', "nameField", "iconName"] }).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
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
			[[req.body.nameField, req.body.classnameField, req.body.iconField], 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.descriptionField, req.body.successDescField, req.body.failureDescField], 'string', config.numbers.modules.players.bioLength],
			[[req.body.difficultyField, req.body.unitLimit, req.body.chanceField, req.body.baseRewardField, req.body.hourLimitField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'classnameField': req.body.classnameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.classnameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;
			if (API.methods.isValid(req.body.taskIconField)) update.taskIconField = req.body.taskIconField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.successDescField)) update.successDescField = req.body.successDescField;
			if (API.methods.isValid(req.body.failureDescField)) update.failureDescField = req.body.failureDescField;
			if (API.methods.isValid(req.body.hourLimitField)) update.hourLimitField = req.body.hourLimitField;
			if (API.methods.isValid(req.body.difficultyField)) update.difficultyField = req.body.difficultyField;
			if (API.methods.isValid(req.body.unitLimit)) update.unitLimit = req.body.unitLimit;
			if (API.methods.isValid(req.body.chanceField)) update.chanceField = req.body.chanceField;
			if (API.methods.isValid(req.body.assetCostField)) update.assetCostField = req.body.assetCostField;
			if (API.methods.isValid(req.body.assetDamageField)) update.assetDamageField = req.body.assetDamageField;
			if (API.methods.isValid(req.body.baseRewardField)) update.baseRewardField = req.body.baseRewardField;

			if (API.methods.isValid(req.body.doctrineTypes)) update.doctrineTypes = req.body.doctrineTypes;
			if (API.methods.isValid(req.body.locationTypes)) update.locationTypes = req.body.locationTypes;
			if (API.methods.isValid(req.body.disabledMaps)) update.disabledMaps = req.body.disabledMaps;

			if (API.methods.isValid(req.body.captureField)) update.captureField = req.body.captureField;
			if (API.methods.isValid(req.body.adversarialField)) update.adversarialField = req.body.adversarialField;
			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.nameField, req.body.classnameField, req.body.iconField], 'string', config.numbers.modules.messages.maxTitleLength],
			[[req.body.descriptionField, req.body.successDescField, req.body.failureDescField], 'string', config.numbers.modules.players.bioLength],
			[[req.body.difficultyField, req.body.unitLimit, req.body.chanceField, req.body.baseRewardField, req.body.hourLimitField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;
			if (API.methods.isValid(req.body.taskIconField)) update.taskIconField = req.body.taskIconField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.successDescField)) update.successDescField = req.body.successDescField;
			if (API.methods.isValid(req.body.failureDescField)) update.failureDescField = req.body.failureDescField;
			if (API.methods.isValid(req.body.hourLimitField)) update.hourLimitField = req.body.hourLimitField;
			if (API.methods.isValid(req.body.difficultyField)) update.difficultyField = req.body.difficultyField;
			if (API.methods.isValid(req.body.unitLimit)) update.unitLimit = req.body.unitLimit;
			if (API.methods.isValid(req.body.chanceField)) update.chanceField = req.body.chanceField;
			if (API.methods.isValid(req.body.assetCostField)) update.assetCostField = req.body.assetCostField;
			if (API.methods.isValid(req.body.assetDamageField)) update.assetDamageField = req.body.assetDamageField;
			if (API.methods.isValid(req.body.baseRewardField)) update.baseRewardField = req.body.baseRewardField;

			if (API.methods.isValid(req.body.doctrineTypes)) update.doctrineTypes = req.body.doctrineTypes;
			if (API.methods.isValid(req.body.locationTypes)) update.locationTypes = req.body.locationTypes;
			if (API.methods.isValid(req.body.disabledMaps)) update.disabledMaps = req.body.disabledMaps;

			if (API.methods.isValid(req.body.captureField)) update.captureField = req.body.captureField;
			if (API.methods.isValid(req.body.adversarialField)) update.adversarialField = req.body.adversarialField;
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

	function duplicateEntry(req, res) {
		mainModel.findOne({ where: { "hashField": req.params.Hash }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var _ = require("lodash"),
				update = _.omit(entry.dataValues, ["id", "hashField", "createdAt", "updatedAt"]);

			update.nameField += " (copy)";
			update.classnameField += "_copy";

			update.doctrineTypes = update.doctrineTypes.split(",");
			update.locationTypes = update.locationTypes.split(",");
			update.disabledMaps = update.disabledMaps.split(",");

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(nEntry) {
					API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
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

})();