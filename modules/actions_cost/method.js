(function(){
	'use strict';

	var ActionsCostModel = require('./../index.js').getModels().actions_cost,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Actions Cost Table",
		mainModel = ActionsCostModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.setActive = setActive;
	exports.getProperty = getProperty;
	exports.getActive = getActive;

	exports.getActiveFunc = getActiveFunc;
	exports.getPropertyFunc = getPropertyFunc;

	function setActive(req, res) {
		if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)], config.messages().bad_permission)) { return 0; }

		var modifier = req.body.table;
		if (!API.methods.validate(req, res, [modifier])) { return 0; }

		mainModel.findOne({where: {"nameField": modifier }}).then(function(new_active) {
		if (!API.methods.validate(req, res, [new_active], config.messages().no_entry)) { return 0; }

			mainModel.findAll({where: {"activeField": true }}).then(function(active_mods) {
				mainModel.sync({force: false}).then(function() {
					for (var i=0; i < active_mods.length; i++) {
						active_mods[i].setActiveState(0);
					}
					new_active.setActiveState(true);

					API.methods.sendResponse(req, res, true, config.messages().modules.modifiers.activated(modifier), new_active.activeField);
				});
			});
		});
	}

	function getAll(req, res) {
		if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege <= config.privileges().tiers.owner)], config.messages().bad_permission)) { return 0; }

		mainModel.findAll().then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectName = req.params.Name;

		mainModel.findOne({where: {"nameField": objectName}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getActive(req, res) {
		mainModel.findOne({where: {"activeField": true}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getProperty(req, res) {
		var property = req.params.Data;
		mainModel.findOne({where: {"activeField": true}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			var r = entry[property];

			API.methods.sendResponse(req, res, !(API.methods.isUndefinedOrNull(r)), "Returning cost for " + property + ".", r);
		});
	}

	function getActiveFunc(req, res, callback) {
		mainModel.findOne({where: {"activeField": true}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			return callback(entry);
		});
	}

	function getPropertyFunc(req, res, property, callback) {
		mainModel.findOne({where: {"activeField": true}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			var r = entry[property];

			return callback(r);
		});
	}

	function post(req, res) {

		if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege <= config.privileges().tiers.owner)], config.messages().bad_permission)) { return 0; }

		if (!API.methods.validate(req, res, [req.body.name])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.c_InvitesPlayer) update.costInvitesPlayer = API.methods.minMax(0, 999999, req.body.c_InvitesPlayer);
			if (req.body.c_InvitesPMC) update.costInvitesPMC = API.methods.minMax(0, 999999, req.body.c_InvitesPMC);
			if (req.body.c_PostIntelBase) update.costPostIntelBase = API.methods.minMax(0, 999999, req.body.c_PostIntelBase);
			if (req.body.c_BuyPrestigePlayer) update.costBuyPrestigePlayer = API.methods.minMax(0, 999999, req.body.c_BuyPrestigePlayer);
			if (req.body.c_BuyPrestigePMC) update.costBuyPrestigePMC = API.methods.minMax(0, 999999, req.body.c_BuyPrestigePMC);
			if (req.body.c_UpgradeSizePMC) update.costUpgradeSizePMC = API.methods.minMax(0, 999999, req.body.c_UpgradeSizePMC);

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege <= config.privileges().tiers.owner)], config.messages().bad_permission)) { return 0; }

		mainModel.findOne({where:{'nameField': req.params.Name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.c_InvitesPlayer) update.costInvitesPlayer = API.methods.minMax(0, 999999, req.body.c_InvitesPlayer);
			if (req.body.c_InvitesPMC) update.costInvitesPMC = API.methods.minMax(0, 999999, req.body.c_InvitesPMC);
			if (req.body.c_PostIntelBase) update.costPostIntelBase = API.methods.minMax(0, 999999, req.body.c_PostIntelBase);
			if (req.body.c_BuyPrestigePlayer) update.costBuyPrestigePlayer = API.methods.minMax(0, 999999, req.body.c_BuyPrestigePlayer);
			if (req.body.c_BuyPrestigePMC) update.costBuyPrestigePMC = API.methods.minMax(0, 999999, req.body.c_BuyPrestigePMC);
			if (req.body.c_UpgradeSizePMC) update.costUpgradeSizePMC = API.methods.minMax(0, 999999, req.body.c_UpgradeSizePMC);

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists('name'))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
					});
				});
			});
		});
	}

})();