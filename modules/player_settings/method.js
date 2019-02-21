(function(){
	'use strict';

	var PlayerModel = require('./../index.js').getModels().players,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.addAllowedMachine = addAllowedMachine;
	exports.removeAllowedMachine = removeAllowedMachine;
	exports.getSettingSelf = getSettingSelf;
	exports.updateSettingSelf = updateSettingSelf;
	exports.getMachineName = getMachineName;

	function getMachineName(req, res) {
		var os = require("os");
		var thing = (req.headers['x-forwarded-for'] || req.connection.remoteAddress);
		API.methods.sendResponse(req, res, true, "", thing);
	}

	function updateSettingSelf(req, res) {
		if (!API.methods.validateParameter(req, res, [[req.body.require_machine_validation, 'boolean']])) { return 0; }

		var playerHash = req.playerInfo.hashField;

		PlayerModel.findOne({ where: {"hashField": playerHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var object = {};

			if (req.body.require_machine_validation) object.requireMachineValidation = req.body.require_machine_validation;

			entry.updateSettings(object, function(items) {
				API.methods.sendResponse(req, res, true, "", items);
			});
		});
	}

	function getSettingSelf(req, res) {
		var playerHash = req.playerInfo.hashField;

		PlayerModel.findOne({ where: {"hashField": playerHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			entry.getSettings(function(items) {
				var filteredItems = require('lodash').omit(items.dataValues, ["id", "createdAt", "updatedAt"]);
				filteredItems.validMachines = API.methods.getPseudoArray(filteredItems.validMachines);
				API.methods.sendResponse(req, res, true, "", filteredItems);
			});
		});
	}

	function addAllowedMachine(req, res) {
		var os = require("os");

		req.body.machine = os.hostname();
		req.body.machine = req.body.machine.toUpperCase();

		PlayerModel.sync({force: false}).then(function() {
			PlayerModel.findOne({where:{'hashField': req.playerInfo.hashField}}).then(function(player) {
				if (!API.methods.validate(req, res, [player])) { return 0; }

				player.getSettings(function(settings) {
					var allowedMachines = settings.validMachines,
						object = {};

					if (!API.methods.validate(req, res, [!(API.methods.findInArray(req.body.machine, allowedMachines)[0])], config.messages().modules.settings.machine_included)) { return 0; }

					allowedMachines.push(req.body.machine);

					object.validMachines = allowedMachines;

					player.updateSettings(object, function(n_settings) {
						API.methods.sendResponse(req, res, true, config.messages().modules.settings.settings_updated, n_settings);
					});
				});
			});
		});
	}

	function removeAllowedMachine(req, res) {
		var os = require("os");

		req.body.machine = os.hostname();
		req.body.machine = req.body.machine.toUpperCase();

		PlayerModel.sync({force: false}).then(function() {
			PlayerModel.findOne({where:{'hashField': req.playerInfo.hashField}}).then(function(player) {
				if (!API.methods.validate(req, res, [player])) { return 0; }

				player.getSettings(function(settings) {
					var allowedMachines = settings.validMachines,
						machineIndex = API.methods.findInArray(req.body.machine, allowedMachines),
						object = {};

					if (!API.methods.validate(req, res, [(allowedMachines.length - 1) > 0], config.messages().modules.settings.min_machines)) { return 0; }
					if (!API.methods.validate(req, res, [(machineIndex[0])], config.messages().modules.settings.machine_not_included)) { return 0; }

					allowedMachines.splice(machineIndex[1], 1);

					object.validMachines = allowedMachines;

					player.updateSettings(object, function(n_settings) {
						API.methods.sendResponse(req, res, true, config.messages().modules.settings.settings_updated, n_settings);
					});
				});
			});
		});
	}

})();