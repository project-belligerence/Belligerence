(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		SimpleMissionModel = require('./../index.js').getModels().simple_mission,
		GeneralMethods = require('./../index.js').getMethods().general_methods,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "SimpleMissions",
		mainModel = SimpleMissionModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.updateMissionStatus = updateMissionStatus;
	exports.signContract = signContract;
	exports.claimReward = claimReward;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};
				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll({where: {'missionStatus': {$lt: 99}}, order:[['requiredPrestige', "ASC"]] }).then(function(entries) {
			if (!API.methods.validate(req, res, [(entries.count > 0)], config.messages().no_entries)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[req.body.descriptionField, 'string'],
			[req.body.locationMap, 'string'],
			[req.body.locationGrid, 'string'],
			[req.body.typeField, 'string'],
			[req.body.costFunds, 'number'],
			[req.body.rewardFunds, 'number']
			// [req.body.codeInit, 'string'],
			// [req.body.codeComplete, 'string'],
			// [req.body.codeFail, 'string']
		], false)) { return 0; }

		var update = {};

		if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
		if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
		if (API.methods.isValid(req.body.requiredPrestige)) update.requiredPrestige = req.body.requiredPrestige;
		if (API.methods.isValid(req.body.locationMap)) update.locationMap = req.body.locationMap;
		if (API.methods.isValid(req.body.locationGrid)) update.locationGrid = req.body.locationGrid;
		if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
		if (API.methods.isValid(req.body.costFunds)) update.costFunds = req.body.costFunds;
		if (API.methods.isValid(req.body.rewardFunds)) update.rewardFunds = req.body.rewardFunds;
		if (API.methods.isValid(req.body.codeInit)) update.codeInit = req.body.codeInit;
		if (API.methods.isValid(req.body.codeComplete)) update.codeComplete = req.body.codeComplete;
		if (API.methods.isValid(req.body.codeFail)) update.codeFail = req.body.codeFail;

		mainModel.sync({force: false}).then(function() {
			mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
		});
	}

	function updateMissionStatus(req, res) {
		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};
			if (API.methods.isValid(req.body.missionStatus)) update.missionStatus = req.body.missionStatus;

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, "Mission status updated.", entry);
				});
			});
		});
	}

	function signContract(req, res) {
		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var mainEntity = API.methods.getMainEntity(req),
				update = { contractOwner: mainEntity.entityHash, missionStatus: 1 };

			if (!API.methods.validate(req, res, [(entry.contractOwner !== mainEntity.entityHash)], "This contract has been taken.")) { return 0; }

			GeneralMethods.spendFundsGeneralFunc(req, res, entry.costFunds, function(r) {
				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, "Contract signed.", entry);
					});
				});
			});
		});
	}

	function claimReward(req, res) {
		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var mainEntity = API.methods.getMainEntity(req);

			mainEntity.entityModel.findOne({where:{'hashField': mainEntity.entityHash}}).then(function(entity) {

				if (!API.methods.validate(req, res, [(entry.contractOwner === mainEntity.entityHash)], "You do not have the rights to claim this mission.")) { return 0; }
				if (!API.methods.validate(req, res, [(entry.missionStatus !== 2)], "The mission hasn't been completed.")) { return 0; }

				var update = { missionStatus: 99 };

				entity.addFunds(entry.rewardFunds, function(money) {
					entry.update(update).then(function() {
						mainModel.sync({force: false}).then(function() {
							API.methods.sendResponse(req, res, true, "Mission completed.", money);
						});
					});
				});

			});
		});
	}

})();