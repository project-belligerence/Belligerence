(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		PlayerMethods = require('./../index.js').getMethods().players,
		Transactions = require('./../index.js').getMethods().transactions,
		ConflictsMethods = require('./../index.js').getMethods().conflicts,
		MissionsMethods = require('./../index.js').getMethods().missions,
		FactionsMethods = require('./../index.js').getMethods().factions,
		ContractsMethods = require('./../index.js').getMethods().contracts,
		Messages = require('./../index.js').getMethods().messages,
		Invites = require('./../index.js').getMethods().invites,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.buyItem = buyItem;
	exports.buyUpgrade = buyUpgrade;
	exports.spendFundsGeneralFunc = spendFundsGeneralFunc;
	exports.returnEntityAction = returnEntityAction;
	exports.paySystemAction = paySystemAction;
	exports.toggleUpgradeProminence = toggleUpgradeProminence;
	exports.paySystemActionMultiplied = paySystemActionMultiplied;
	exports.setUpgradeVisibilityAll = setUpgradeVisibilityAll;
	exports.getSteamSession = getSteamSession;
	exports.destroySteamSession = destroySteamSession;
	exports.getSteamValid = getSteamValid;
	exports.generateConflictsFunc = generateConflictsFunc;
	exports.generateMissionsFunc = generateMissionsFunc;
	exports.generateAdversarialMissionFunc = generateAdversarialMissionFunc;
	exports.handleConflictResultsFunc = handleConflictResultsFunc;
	exports.cleanUpMissionsFunc = cleanUpMissionsFunc;
	exports.getSteamValidFunc = getSteamValidFunc;
	exports.getCurrentFundsSelf = getCurrentFundsSelf;
	exports.getSides = getSides;
	exports.getRegions = getRegions;
	exports.getRegionsFunc = getRegionsFunc;
	exports.recoverFactionAssetsFunc = recoverFactionAssetsFunc;
	exports.getAllOperationsSelf = getAllOperationsSelf;
	exports.resetSideAlignment = resetSideAlignment;
	exports.getSideAlignment = getSideAlignment;
	exports.upgradePrestigeRank = upgradePrestigeRank;
	exports.getPrestigeRankCost = getPrestigeRankCost;

	exports.countMessagesInvitesReceived = countMessagesInvitesReceived;
	exports.countActiveOperations = countActiveOperations;

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

	function countActiveOperations(req, res) {
		var ContractsMethods = require('./../index.js').getMethods().contracts,
			NegotiationsMethods = require('./../index.js').getMethods().negotiations,
			InterestsMethods = require('./../index.js').getMethods().interest,

			contractsCount = ContractsMethods.countActive(req, res),
			negotiationsCount = NegotiationsMethods.countActive(req, res),
			interestsCount = InterestsMethods.countActive(req, res),

			allPromises = [contractsCount, negotiationsCount, interestsCount];

		Promise.all(allPromises).then(function(values) {
			var rObj = { contracts: values[0], negotiations: values[1], interests: values[2] };
			API.methods.sendResponse(req, res, true, "", rObj);
		});
	}

	function getAllOperationsSelf(req, res) {
		var ContractsMethods = require('./../index.js').getMethods().contracts,
			NegotiationsMethods = require('./../index.js').getMethods().negotiations,
			InterestsMethods = require('./../index.js').getMethods().interest;

		req.query = {};
		req.query.simpleMode = true;

		ContractsMethods.getSignedContractsFUNC(req, res, function(contracts) {
		NegotiationsMethods.getNegotiationsSelfFUNC(req, res, function(negotiations) {
		InterestsMethods.getMarkedInterestsFUNC(req, res, function(interests) {
			var rObj = { contracts: contracts.rows,	negotiations: negotiations.rows, interests: interests.rows };
			API.methods.sendResponse(req, res, true, "", rObj);
		});
		});
		});
	}

	function recoverFactionAssetsFunc(callback) {
		FactionsMethods.recoverFactionAssetsFunc(function() { return callback(); });
	}

	function handleConflictResultsFunc(callback) {
		ConflictsMethods.makeFactionsInactiveFunc(function() {
			ConflictsMethods.detectConflictsOverFunc(function() { return callback(); });
		});
	}

	function cleanUpMissionsFunc(callback) {
		MissionsMethods.cleanUpMissionsFunc(function() { return callback(); });
	}

	function generateConflictsFunc() {
		ConflictsMethods.getMapsNoConflictFunc(generateConflictMapLoopFunc);
	}

	function generateMissionsFunc(callback) {
		ConflictsMethods.getAllFunc().then(function(conflicts) {
			missionGenerationLoopFunc(conflicts, function() { return callback(); });
		});
	}

	function generateAdversarialMissionFunc(callback) {
		ConflictsMethods.getAllFunc().then(function(conflicts) {
			missionAdversarialGenerationLoopFunc(conflicts, function() {
				config.websocket.broadcastEvent("RefreshMissions");
				return callback();
			});
		});
	}

	function missionAdversarialGenerationLoopFunc(conflicts_list, callback) {
		if (conflicts_list.length === 0) { return callback(); }
		else {
			var selectedConflict = conflicts_list[0],
				adversarialsN = config.numbers.modules.missions.adversarialMissionsDay;

			MissionsMethods.generateMissionFunc(true, selectedConflict, 0, 0, adversarialsN, function() {
				conflicts_list.splice(0, 1);
				return missionAdversarialGenerationLoopFunc(conflicts_list, callback);
			});
		}
	}

	function missionGenerationLoopFunc(conflicts_list, callback) {
		if (conflicts_list.length === 0) { return callback(); }
		else {
			var selectedConflict = conflicts_list[0];

			ConflictsMethods.getConflictLackMissionsFunc(selectedConflict, function(conflictMissions) {
				var nullFunc = function(a,b,c,d,e,cb){return cb(true);},
					genFunc = (conflictMissions.lackMissions ? MissionsMethods.generateMissionFunc : nullFunc);

				genFunc(false, selectedConflict, 0, 0, conflictMissions.toGenerate, function() {
					conflicts_list.splice(0, 1);
					return missionGenerationLoopFunc(conflicts_list, callback);
				});
			});
		}
	}

	function generateConflictMapLoopFunc(maps_list) {
		if (maps_list.length === 0) { return true; }
		else {
			var selectedMap = maps_list[0];

			ConflictsMethods.generateConflictFunc(selectedMap, 0, function() {
				maps_list.splice(0, 1);
				return generateConflictMapLoopFunc(maps_list);
			});
		}
	}

	function getSteamSession(req, res) { API.methods.sendResponse(req, res, true, "Current Steam Session", req.user); }
	function destroySteamSession(req, res) { req.logout(); API.methods.sendResponse(req, res, true, "Destroyed Steam Session", req.user); }

	function getSteamValidFunc(req, res, callback) {
		if (!API.methods.validateParameter(req, res, [[[req.body.id], 'number']], true)) { return 0; }
		var requestify = require('requestify');

		var reqId = req.body.id,
			reqGame = "107410",
			reqAPI = config.db.SteamAPIKey,
			baseURL = "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid";

		req.body.property = "steam_id";
		req.body.value = req.body.id;

		PlayerMethods.findPlayerByPropertyFunc(req, res, function(data) {
			if (!API.methods.validate(req, res, [!data.exists], "This Steam ID is already registered.")) { return 0; }

			requestify.get((baseURL + '=' + reqGame + '&key=' + reqAPI + '&steamid=' + reqId), { timeout: 10000 }).then(function(response) {
				var doneResponse = response.getBody().playerstats.stats[0].value;
				return callback([true, doneResponse]);
			}).fail(function(response) {
				return callback([false, -1]);
			});
		});
	}

	function getSteamValid(req, res) {
		getSteamValidFunc(req, res, function(data) { API.methods.sendResponse(req, res, data[0], "", data[1]); });
	}

	function returnEntityAction(req, property) {
		return (config.properties.actionCost[property] + (API.methods.getMainEntity(req).entityTypeName));
	}

	function toggleUpgradeVisibility(req, res) {
		toggleUpgradePropertyFunc(req, res, (req.body.mode), function(phrase) {
			API.methods.sendResponse(req, res, true, config.messages().modules.upgrades.upgrade_toggled(phrase));
		});
	}

	function toggleUpgradeProminence(req, res) {
		toggleUpgradePropertyFunc(req, res, (req.body.mode), function(upgrade) {
			API.methods.sendResponse(req, res, true, "", upgrade);
		});
	}

	function setUpgradeVisibilityAll(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		var entityUpgradeModel = (entity.hasPMC ? "pmc_upgrades" : "player_upgrades"),
			entityUpgrade = require('./../index.js').getModels()[entityUpgradeModel],
			UpgradesModel = require('./../index.js').getModels().upgrades,
			whereCondition = { prominentField: false };
		whereCondition[(entity.hasPMC ? "PMCId" : "PlayerId")] = entity.entityId;

		entityUpgrade.update({ visibleField: false }, { where: whereCondition }).then(function() {
			var phrase = 'hidden from';
			API.methods.sendResponse(req, res, true, config.messages().modules.upgrades.upgrade_toggled(phrase));
		});
	}

	function toggleUpgradePropertyFunc(req, res, property, cb) {
		if (!API.methods.validateParameter(req, res, [[req.body.upgrade, 'string'], [property, 'number']], true)) { return 0; }

		var entity = API.methods.getMainEntity(req);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		var entityUpgradeModel = (entity.hasPMC ? "pmc_upgrades" : "player_upgrades"),
			entityUpgrade = require('./../index.js').getModels()[entityUpgradeModel],
			UpgradesModel = require('./../index.js').getModels().upgrades;

		UpgradesModel.findOne({ where: {hashField: req.body.upgrade} }).then(function(upgrade) {
			if (!API.methods.validate(req, res, [upgrade])) { return 0; }

			var entityUpgradeQuery = { where: {}, order: [["updatedAt", "DESC"]] };
			entityUpgradeQuery.where[(entity.hasPMC ? 'PMCId' : 'PlayerId')] = entity.entityId;

			entityUpgrade.findAll(entityUpgradeQuery).then(function(ownedUpgrades) {

				var proccessPromise = new Promise(function(rs, rj) {
					var i, sUpgrade;

					switch(property) {
						case (1): {
							var areVisible = [];

							for (i = ownedUpgrades.length - 1; i >= 0; i--) {
								if ((ownedUpgrades[i].upgradeId === upgrade.id)) { sUpgrade = ownedUpgrades[i]; }
								else if ((ownedUpgrades[i].visibleField) && (areVisible.length < 4)) {
									areVisible.push(ownedUpgrades[i]);
								}
							}

							return Promise.all(ownedUpgrades.map(function(object) {
								if (object.upgradeId !== sUpgrade.upgradeId) return object.update({ visibleField: (object.prominentField) });
							})).then(function() {
								return Promise.all(areVisible.map(function(object) {
									if (object) return object.update({ visibleField: true });
								})).then(function() {
									sUpgrade.update({ visibleField: !(sUpgrade.visibleField) }).then(rs);
								});
							});
						} break;

						case (2): {
							var nonProminent = [];

							for (i = ownedUpgrades.length - 1; i >= 0; i--) {
								if ((ownedUpgrades[i].upgradeId === upgrade.id)) { sUpgrade = ownedUpgrades[i]; }
								else if (ownedUpgrades[i].prominentField) { nonProminent.push(ownedUpgrades[i]); }
							}
							return Promise.all(nonProminent.map(function(object) {
								if (object) return object.update({ prominentField: false, visibleField: false });
							})).then(function() {
								sUpgrade.update({ prominentField: !(sUpgrade.prominentField), visibleField: !(sUpgrade.prominentField) }).then(rs);
							});
						} break;
					}
				}, function(){});

				proccessPromise.then(cb);

			});
		});
	}

	function getSides(req, res) {
		var configSides = config.enums.sides, rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getRegionsFunc(req, res) {
		return [
			"International",
			"Western Europe", "Eastern Europe",
			"British Isles",
			"NA - West Coast",
			"NA - East Coast",
			"Latin America",
			"East Asia", "South Asia",
			"Middle East",
			"Africa"
		];
	}

	function getRegions(req, res) {
		API.methods.sendResponse(req, res, true, config.messages().return_entry, getRegionsFunc());
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

	function getCurrentFundsSelf(req, res) {
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
			API.methods.sendResponse(req, res, true, "You have the following amount.", entry.currentFunds);
		});
	}

	function buyItem(req, res) {
		var bodyCart = req.body.cart;

		if (!API.methods.validateParameter(req, res, [[[bodyCart], 'array']], true)) { return 0; }

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

			var purchaserOptions = { entry: entry, purchaseType: purchaseType };

			buyItemRecursive(req, res, bodyCart, purchaserOptions, {}, 0, function(r) {
				if (!API.methods.validate(req, res, [r.valid], config.messages().modules.economy.no_fundsF(r))) { return 0; }

				API.methods.sendResponse(req, res, true, config.messages().modules.economy.success, r);
			});
		});
	}

	function buyItemRecursive(req, res, cartArray, purchaserOptions, lastPurchase, totalCost, done) {
		if (cartArray.length > 0) {
			var loopCart = cartArray,
				loopCost = totalCost,
				currentCart = loopCart[0],
				currentStore = currentCart.store,
				boughtItems = currentCart.items,
				entry = purchaserOptions.entry,
				purchaseType = purchaserOptions.purchaseType,
				takenItems = [];

			if (!API.methods.validateParameter(req, res, [[currentStore, 'string'], [boughtItems, 'object']], true)) { return 0; }

			for (var i in boughtItems) { takenItems.push([boughtItems[i].item, boughtItems[i].amount]); }
			if (!API.methods.validate(req, res, [(takenItems.length > 0)])) { return 0; }

			Transactions.purchaseItem(req, res, entry, purchaseType, takenItems, currentStore, function(r) {
				if (!API.methods.validate(req, res, [r.valid], config.messages().modules.economy.no_fundsF(r))) { return 0; }

				loopCost += r.neededFunds;
				loopCart.splice(0, 1);

				return buyItemRecursive(req, res, cartArray, purchaserOptions, r, loopCost, done);
			});

		} else {
			lastPurchase.neededFunds = totalCost;
			return done(lastPurchase);
		}
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

	function resetSideAlignment(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		return ContractsMethods.countActive(req, res).then(function(data) {
			if (!API.methods.validate(req, res, [(data.active <= 0)], config.messages().modules.contracts.active_contracts)) { return 0; }

			entity.entityModel.findOne({ where: { id: entity.entityId }}).then(function(entity_object) {
				entity_object.update({ sideField: 0 }).then(function() {

					entity.entityModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().modules.alignment.side_changed);
					});
				});
			});
		});
	}

	function getSideAlignment(req, res) {
		var entity = API.methods.getMainEntity(req);
		API.methods.sendResponse(req, res, true, "Entity Side Alignment.", { side: entity.entitySide });
	}

	function upgradePrestigeRank(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (entity.hasPMC) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		entity.entityModel.findOne({ where: { id: entity.entityId }}).then(function(entity_object) {
			var rankProp = ["playerPrestige", "PMCPrestige"][(entity.hasPMC ? 1 : 0)],
				entityRank = entity_object[rankProp],
				upgradeMultiplier = config.numbers.modules.modifiers.prestigeRankUpMultiplier,
				finalMultiValue = (entityRank * upgradeMultiplier);

			if (!API.methods.validate(req, res, [(entityRank < 5)], config.messages().modules.rank.max_rank)) { return 0; }

			var upgradeObj = {};
			upgradeObj[rankProp] = (entityRank + 1);

			paySystemActionMultiplied(req, res, 'buyPrestige', finalMultiValue, function(success) {
				entity_object.update(upgradeObj).then(function() {
					entity.entityModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().modules.rank.rank_upgraded, success);
					});
				});
			});
		});
	}

	function getPrestigeRankCost(req, res) {
		getPrestigeRankCostFUNC(req, res, function(cost) { API.methods.sendResponse(req, res, true, "", cost); });
	}

	function getPrestigeRankCostFUNC(req, res, cb) {
		var entity = API.methods.getMainEntity(req);

		entity.entityModel.findOne({ where: { id: entity.entityId }}).then(function(entity_object) {
			var ActionsCostMethod = require('./../index.js').getMethods().actions_cost,
				rankProp = ["playerPrestige", "PMCPrestige"][(entity.hasPMC ? 1 : 0)],
				entityRank = entity_object[rankProp],
				upgradeMultiplier = config.numbers.modules.modifiers.prestigeRankUpMultiplier,
				finalMultiValue = (entityRank * upgradeMultiplier);

			ActionsCostMethod.getPropertyFunc(req, res, returnEntityAction(req, 'buyPrestige'), function(cost) {
				return cb((cost * finalMultiValue));
			});
		});
	}

})();