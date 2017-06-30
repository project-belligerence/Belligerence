(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		Transactions = require('./../index.js').getMethods().transactions,
		Messages = require('./../index.js').getMethods().messages,
		Invites = require('./../index.js').getMethods().invites,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.buyItem = buyItem;
	exports.buyUpgrade = buyUpgrade;
	exports.spendFundsGeneralFunc = spendFundsGeneralFunc;
	exports.returnEntityAction = returnEntityAction;
	exports.paySystemAction = paySystemAction;
	exports.toggleUpgradeVisibility = toggleUpgradeVisibility;
	exports.toggleUpgradeProminence = toggleUpgradeProminence;
	exports.paySystemActionMultiplied = paySystemActionMultiplied;
	exports.setUpgradeVisibilityAll = setUpgradeVisibilityAll;

	exports.countMessagesInvitesReceived = countMessagesInvitesReceived;

	function countMessagesInvitesReceived(req, res) {
		var hasPMC = req.playerInfo.PMC, totalNum = {};

		Messages.countReceived(req, res).then(function(data) {
			totalNum.messages = data;

			Invites.getReceivedPlayerFunc(req, res, function(invitesPlayer) {
				totalNum.receivedPlayer = invitesPlayer.count;

				if (hasPMC) {
					Invites.getReceivedPMCFunc(req, res, function(invitesPMC) {
						totalNum.receivedPMC = invitesPMC.count;

						API.methods.sendResponse(req, res, true, "", totalNum);
					});
				} else {
					API.methods.sendResponse(req, res, true, "", totalNum);
				}
			});

		});
	}

	function returnEntityAction(req, property) {
		return (config.properties.actionCost[property] + (API.methods.getMainEntity(req).entityTypeName));
	}

	function toggleUpgradeVisibility(req, res) {
		toggleUpgradePropertyFunc(req, res, 'visibility', function(phrase) {
			API.methods.sendResponse(req, res, true, config.messages().modules.upgrades.upgrade_toggled(phrase));
		});
	}

	function toggleUpgradeProminence(req, res) {
		toggleUpgradePropertyFunc(req, res, 'prominence', function(phrase) {
			API.methods.sendResponse(req, res, true, config.messages().modules.upgrades.upgrade_prominence_toggled(phrase));
		});
	}

	function toggleUpgradePropertyFunc(req, res, property, done) {
		if (!API.methods.validateParameter(req, res, [[req.body.upgrade, 'string']], true)) { return 0; }

		var entity = API.methods.getMainEntity(req);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		var entityUpgrade = entity.hasPMC ? require('./../index.js').getModels().pmc_upgrades : require('./../index.js').getModels().player_upgrades,
			UpgradesModel = require('./../index.js').getModels().upgrades;

		UpgradesModel.findOne({where: {hashField: req.body.upgrade}}).then(function(upgrade) {
			if (!API.methods.validate(req, res, [upgrade])) { return 0; }

			var whereObject = {upgradeId: upgrade.id};
				whereObject[entity.hasPMC ? 'PMCId' : 'PlayerId'] = entity.entityId;

			entityUpgrade.findOne({where: whereObject}).then(function(ownedUpgrade) {
				if (!API.methods.validate(req, res, [ownedUpgrade])) { return 0; }

				var sProperty = (function(v){
						switch(v) {
							case 'visibility': { return 'visibleField'; } break;
							case 'prominence': { return 'prominentField'; } break;
						}
					})(property),
					toggled = !(ownedUpgrade[sProperty]),
					object = {};
					object[sProperty] = toggled;

				ownedUpgrade.update(object).then(function() {
					var phrase = ownedUpgrade[sProperty] ? 'shown to' : 'hidden from';
					return done(phrase);
				});
			});
		});
	}

	function setUpgradeVisibilityAll(req, res) {

		if (!API.methods.validateParameter(req, res, [[req.body.status, 'boolean']], true)) { return 0; }

		var entity = API.methods.getMainEntity(req),
			vStatus = API.methods.getBoolean(req.body.status);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		var entityUpgrade = entity.hasPMC ? require('./../index.js').getModels().pmc_upgrades : require('./../index.js').getModels().player_upgrades,
			whereCondition = entity.hasPMC ? { PMCId: entity.entityId } : { PlayerId: entity.entityId };

		entityUpgrade.update({visibleField: vStatus}, { where: whereCondition}).then(function() {
			var phrase = (vStatus) ? 'shown to' : 'hidden from';
			API.methods.sendResponse(req, res, true, config.messages().modules.upgrades.upgrade_toggled(phrase));
		});
	}

	function spendFundsGeneralFunc(req, res, amount, callback) {

		var hasPMC = req.playerInfo.PMC,
			purchaseType = hasPMC ? "pmc" : "player",
			purchaserModel = hasPMC ? PMCModel : PlayerModel,
			purchaserHash = hasPMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField;

		if (hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		purchaserModel.findOne({ where: {"hashField": purchaserHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			entry.spendFunds(amount, function(r) {
				if (!API.methods.validate(req, res, [r.valid], config.messages().modules.economy.no_fundsF(r))) { return 0; }

				return callback(r);
			});
		});
	}

	function buyItem(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.store, 'string'],
			[req.body.items, 'array'],
		], true)) { return 0; }

		var hasPMC = req.playerInfo.PMC,
			purchaseType = hasPMC ? "pmc" : "player",
			purchaserModel = hasPMC ? PMCModel : PlayerModel,
			purchaserHash = hasPMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField,
			boughtItems = req.body.items,
			takenItems = [];

		if (hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		for (var i=0; i < boughtItems.length; i++) {
			if (boughtItems[i][1] > 0) {
				var addItem = true;
				for (var j=0; j < takenItems.length; j++) {
					if (boughtItems[i][0] == takenItems[j][0]) { addItem = false; }
				}
				if (addItem) { API.methods.addIfNew(boughtItems[i], takenItems); }
			}
		}

		if (!API.methods.validate(req, res, [(takenItems.length > 0)])) { return 0; }

		purchaserModel.findOne({ where: {"hashField": purchaserHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			if (!(hasPMC)) {
				if(!API.methods.validate(req, res, [
					(entry.contractType === config.enums.contract.FREELANCER)
				], config.messages().modules.pmc.action_not_allowed_soldiers)) { return 0; }
			}

			Transactions.purchaseItem(req, res, entry, purchaseType, takenItems, req.body.store, function(r) {
				if (!API.methods.validate(req, res, [r.valid], config.messages().modules.economy.no_fundsF(r))) { return 0; }

				API.methods.sendResponse(req, res, true, config.messages().modules.economy.success, r);
			});
		});
	}

	function buyUpgrade(req, res) {
		if (!API.methods.validateParameter(req, res, [[req.body.upgrade, 'string']], true)) { return 0; }

		var hasPMC = req.playerInfo.PMC,
			purchaseType = hasPMC ? "pmc" : "player",
			purchaserModel = hasPMC ? PMCModel : PlayerModel,
			purchaserHash = hasPMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField;

		if (hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		purchaserModel.findOne({ where: {"hashField": purchaserHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			if (!(hasPMC)) {
				if(!API.methods.validate(req, res, [
					(entry.contractType === config.enums.contract.FREELANCER)
				], config.messages().modules.pmc.action_not_allowed_soldiers)) { return 0; }
			}

			Transactions.purchaseUpgrade(req, res, entry, purchaseType, req.body.upgrade, function(r) {
				if (!API.methods.validate(req, res, [r.valid], config.messages().modules.economy.no_fundsF(r))) { return 0; }

				API.methods.sendResponse(req, res, true, config.messages().modules.economy.success, r);
			});
		});
	}

	function paySystemActionMultiplied(req, res, property, multiplier, callback) {
		var ActionsCostMethod = require('./../index.js').getMethods().actions_cost;

		ActionsCostMethod.getPropertyFunc(req, res, returnEntityAction(req, property), function(cost) {
			spendFundsGeneralFunc(req, res, (cost * multiplier), function(r) {
				return callback(r);
			});
		});
	}

	function paySystemAction(req, res, property, callback) {
		var ActionsCostMethod = require('./../index.js').getMethods().actions_cost;

		ActionsCostMethod.getPropertyFunc(req, res, returnEntityAction(req, property), function(cost) {
			spendFundsGeneralFunc(req, res, cost, function(r) {
				return callback(r);
			});
		});
	}

})();