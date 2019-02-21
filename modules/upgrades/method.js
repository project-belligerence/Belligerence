(function(){
	'use strict';
	/* jshint shadow:true */

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		UpgradesModel = require('./../index.js').getModels().upgrades,
		PMCUpgrades = require('./../index.js').getModels().pmc_upgrades,
		PlayerUpgrades = require('./../index.js').getModels().player_upgrades,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Upgrades",
		mainModel = UpgradesModel;

	exports.getUpgradesData = getUpgradesData;
	exports.post = post;
	exports.duplicateUpgrade = duplicateUpgrade;
	exports.get = get;
	exports.getAll = getAll;
	exports.put = put;
	exports.putPMC = putPMC;
	exports.putPlayer = putPlayer;
	exports.postPMC = postPMC;
	exports.postPlayer = postPlayer;
	exports.getUpgradesSelf = getUpgradesSelf;
	exports.handleAssociatedUpgrades = handleAssociatedUpgrades;
	exports.getProminentUpgradesFUNC = getProminentUpgradesFUNC;
	exports.getProminentUpgradesSelf = getProminentUpgradesSelf;
	exports.getUpgradesEntityFunc = getUpgradesEntityFunc;
	exports.getUpgradesPlayer = getUpgradesPlayer;
	exports.getUpgradesPMC = getUpgradesPMC;
	exports.checkRanksRecursive = checkRanksRecursive;
	exports.getAssociatedUpgrades = getAssociatedUpgrades;
	exports.reSpecTree = reSpecTree;
	exports.deleteUpgrade = deleteUpgrade;
	exports.getAllSimple = getAllSimple;
	exports.getUpgradeTree = getUpgradeTree;
	exports.loopThroughRequired = loopThroughRequired;
	exports.checkUpgradeOwned = checkUpgradeOwned;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'type', 'kind', 'has_ui', 'flavor_text', 'max_tier', 'base_cost', 'cost_multiplier'],
			allowedPostValues: { typeValues: [0,1,2], kindValues: [0,1,2,3,4,5]
				/*
					Types of upgrades:

					> MISC: Whatever else I don't know what to do with.
					> CONTRACT: Basically an alliance to a certain entity. Usually comes with the
					blacklisted contract upgrades of the enemy factions.
					> LOGISTICS: Related to transporting stuff in and out of the battlefield.
					> OFFENSE: Upgrades that enable the owner to attack and destroy targets
					in various ways, like airdrops or deploying troops.
					> DEFENSE: Allows the owner to deploy counter-measures to defend themselves,
					like protecting against intelligence attacks, mass smoke screens, etc.
					> INTELLIGENCE: Spying, acquiring secret info about the desired players such as
					money spending or owned upgrades or items.
					> CERTIFICATION: Allows the player to purchase on certain stores for certain
					specialized items, from drones to fighter jets.
				*/
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qSlug)) { object.slug = { $like: "%" + req.query.qSlug + "%" }; }
				if (API.methods.isValid(req.query.qIngame)) { object.ingame = { $like: "%" + req.query.qIngame + "%" }; }
				if (API.methods.isValid(req.query.qType)) { object.type = { $like: "%" + req.query.qType + "%" }; }
				if (API.methods.isValid(req.query.qKind)) { object.kind = { $like: "%" + req.query.qKind + "%" }; }
				if (API.methods.isValid(req.query.qText)) { object.flavor_text = { $like: "%" + req.query.qText + "%" }; }
				if (API.methods.isValid(req.query.qParent)) { object.parent = { $like: "%" + req.query.qParent + "%" }; }

				if (API.methods.isValid(req.query.qHasUI)) { object.has_ui = { $like: API.methods.getBoolean(req.query.qHasUI, true) }; }

				if (API.methods.isValid(req.query.qExcludeHash)) { object.hashField = { $notLike: "%" + req.query.qExcludeHash + "%" }; }
				if (API.methods.isValid(req.query.qFilterTypes)) { object.type = { $in: [0, JSON.parse(req.query.qFilterTypes)] }; }

				if (API.methods.isValid(req.query.qMaxTier)) { req.query.qMaxTier = JSON.parse(req.query.qMaxTier); object.max_tier = { $between: [(req.query.qMaxTier.min || 0), (req.query.qMaxTier.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qCost)) { req.query.qCost = JSON.parse(req.query.qCost); object.base_cost = { $between: [(req.query.qCost.min || 0), (req.query.qCost.max || 9999999)]}; }

				if (req.query.SELF_MODE) {
					if (API.methods.isValid(req.query.qRank)) { req.query.qRank = JSON.parse(req.query.qRank); object.rank = { $between: [(req.query.qRank.min || 0), (req.query.qRank.max || 9999999)]}; }
				}

				return object;
			}
		};
	}

	initializeWebsocketEvents();

	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();
		config.websocket.registerEvent("NewUpgrade", WebsocketEvent);
	}

	function getUpgradesData(req, res) {
		var rObject = {};
		rObject.upgradesData = {
			upgradesOwner: config.enums.upgrades_owner,
			upgradesTypes: config.enums.upgrades_types
		};
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function handleAssociatedUpgrades(req, res, units, noAssign) {
		return new Promise(function(frs) {
			var unitPromises = [],
				qUnits = units, i;

			new Promise(function(rs) {
				if (!(req.query.qIncludeUpgrades)) return rs([]);

				for (i = 0; i < units.length; i++) {
					var entity = units[i], sentEntity = (entity.PMC ? entity.PMC : entity);

					if (entity.blockUpgrades) {	unitPromises.push([]); }
					else { unitPromises.push(getProminentUpgradesFUNC(req, res, sentEntity)); }
				}
				return Promise.all(unitPromises).then(rs);

			}).then(function(owned_upgrades) {
				if (!noAssign) {
					for (i = owned_upgrades.length - 1; i >= 0; i--) {
						var owned = owned_upgrades[i];
						qUnits[i].owned_upgrades = [];
						for (var j = owned.length - 1; j >= 0; j--) { qUnits[i].owned_upgrades.push(owned[j].dataValues); }
					}
				}
				return frs(owned_upgrades);
			});
		});
	}

	function getProminentUpgradesFUNC(req, res, entity, cb) {
		if (!API.methods.validate(req, res, [entity])) { return 0; }

		var OWNER_FUNC_QUERY = {
				where: { hashField: entity.hashField },
				attributes: ["id"],
				include: [
					{
						model: mainModel, where: {$or:{}},
						attributes: [
							"id", "hashField", "nameField", "slugField", "hasUIField",
							"typeField", "kindField", "iconName", "maxTier"
						]
					}
				],
				limit: 99
			},
			isPlayer = testPlayer(entity),
			entityValue = (isPlayer ? "player" : "pmc"),
			entityUpgradeModel = (isPlayer ? "player_upgrades" : "pmc_upgrades"),
			entityModel = (isPlayer ? PlayerModel : PMCModel);

		function testPlayer(e) { return (e.aliasField || e.friendAlias); }

		OWNER_FUNC_QUERY.include[0].where.$or["$upgrades." + entityUpgradeModel + ".prominent$"] = true;
		if (req.query.qVisible) {
			OWNER_FUNC_QUERY.include[0].where.$or["$upgrades." + entityUpgradeModel + ".visible$"] = true;
		}

		return entityModel.findOne(OWNER_FUNC_QUERY).then(function(entity_upgrades) {
			var entity_upgrade = (entity_upgrades ? entity_upgrades.upgrades : []);

			for (var i = entity_upgrade.length - 1; i >= 0; i--) {
				entity_upgrade[i].dataValues.owned_upgrade = entity_upgrade[i][entityValue + "_upgrades"];
				delete entity_upgrade[i].dataValues.pmc_upgrades;
				delete entity_upgrade[i].dataValues.player_upgrades;
			}

			return (cb ? cb(entity_upgrade) : entity_upgrade);
		});
	}

	function getAssociatedUpgrades(upgrades, done) {
		var i, j, _ = require('lodash'),
				requiredHashes = [];

		for (i in upgrades) {
			var requiredUpgrades = (upgrades[i].requiredUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].required_upgrades)),
				blacklistUpgrades = (upgrades[i].blacklistedUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].blacklisted_upgrades));

			for (j in requiredUpgrades) {
				if (requiredUpgrades[j].length > 0) {
					requiredHashes.push(requiredUpgrades[j][0]);
				}
			}
			for (j in blacklistUpgrades) {
				if (blacklistUpgrades[j].length > 0) {
					requiredHashes.push(blacklistUpgrades[j][0]);
				}
			}

			if (upgrades[i].parentUpgrade) requiredHashes.push(upgrades[i].parentUpgrade);
		}

		requiredHashes = _.uniq(requiredHashes);

		API.methods.retrieveModelsRecursive(['upgrades'], {upgrades: requiredHashes}, ['nameField', 'hashField', 'iconName', 'maxTier'], function(entries) {
			entries = API.methods.cloneArray((entries.upgrades || []));

			for (i in upgrades) {
				var
					requiredUpgrades = (upgrades[i].requiredUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].required_upgrades)),
					blacklistUpgrades = (upgrades[i].blacklistedUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].blacklisted_upgrades)),
					parentUpgrade = upgrades[i].parentUpgrade,
					reqHashes = [],
					blackHashes = [],
					finalReq = [],
					finalBlack = [],
					finalParent = null
				;

				for (j in requiredUpgrades) {
					if (requiredUpgrades[j].length > 0) {
						reqHashes.push([[requiredUpgrades[j][0]], requiredUpgrades[j][1]]);
					}
				}

				for (j in blacklistUpgrades) {
					if (blacklistUpgrades[j].length > 0) {
						blackHashes.push([[blacklistUpgrades[j][0]], blacklistUpgrades[j][1]]);
					}
				}

				var requiredUpgrades = [],
					blacklistedUpgrades = [];

				for (j in entries) {
					var cEntry = (entries[j].dataValues), h;

					for (h in reqHashes) {
						if (_.indexOf(reqHashes[h][0], cEntry.hashField) > -1) {
							var nObj = {};
							nObj.hashField = cEntry.hashField;
							nObj.nameField = cEntry.nameField;
							nObj.iconName = cEntry.iconName;
							nObj.maxTier = cEntry.maxTier;
							nObj.Rank = parseInt(reqHashes[h][1]);

							requiredUpgrades.push(nObj);
						}
					}

					for (h in blackHashes) {
						if (_.indexOf(blackHashes[h][0], cEntry.hashField) > -1) {
							var nObj = {};
							nObj.hashField = cEntry.hashField;
							nObj.nameField = cEntry.nameField;
							nObj.iconName = cEntry.iconName;
							nObj.maxTier = cEntry.maxTier;
							nObj.Rank = parseInt(blackHashes[h][1]);

							blacklistedUpgrades.push(nObj);
						}
					}

					if (cEntry.hashField === parentUpgrade) finalParent = { nameField: cEntry.nameField, hashField: cEntry.hashField, iconName: cEntry.iconName };
				}

				var hiddenUpgrades = ['requiredUpgradesField', 'blacklistedUpgradesField'],
					hiddenParent = ['parentUpgrade'],
					targetUpgrade = (upgrades[i].dataValues ? upgrades[i].dataValues : upgrades[i]);

					targetUpgrade.requiredUpgrades = requiredUpgrades;
					targetUpgrade.blacklistedUpgrades = blacklistedUpgrades;

					if (finalParent) { targetUpgrade.parentUpgrade = finalParent; }
					else { targetUpgrade = _.omit(targetUpgrade, hiddenParent); }

					targetUpgrade = _.omit(targetUpgrade, hiddenUpgrades);

					upgrades[i] = targetUpgrade;
			}

			return done(upgrades);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			getAssociatedUpgrades([entry], function(nEntries) {
				entry.requiredUpgrades = nEntries.requiredUpgrades;
				entry.blacklistedUpgrades = nEntries.blacklistedUpgrades;
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
			});
		});
	}

	function getAllSimple(req, res) {
		var UPGRADES_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req));
		UPGRADES_FUNC_QUERY.attributes = ["nameField", "hashField", "typeField", "kindField", "iconName", "maxTier"];

		mainModel.findAndCountAll(UPGRADES_FUNC_QUERY).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
		});
	}

	function getUpgradeTree(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 999;
		var UPGRADES_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		UPGRADES_FUNC_QUERY.attributes = [
			"hashField", "nameField", "slugField", "ingameVariable", "typeField", "kindField", "iconName", "maxTier",
			"parentUpgrade", "requiredUpgradesField", "blacklistedUpgradesField"
		];

		mainModel.findAndCountAll(UPGRADES_FUNC_QUERY).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
		});
	}

	function getAll(req, res) {

		var MainTable = 'upgrades_table',
			entity = API.methods.getMainEntity(req),
			isMod = (req.playerInfo.playerPrivilege <= config.privileges().tiers.moderator),
			queryLine = isMod ? '(type >= 0)' : '((type = "' + entity.entityType + '") OR (type = 0))',
			baseAttributes = "name as nameField, slug as slugField, ingame as ingameVariable, type as typeField, kind as kindField, " +
							 "icon as iconName, flavor_text as flavortextField, flavor_text_upgrades as flavortextUpgradesField, " +
							 "max_tier as maxTier, base_cost as baseCost, cost_multiplier as costMultiplier, parent as parentUpgrade, " +
							 "required_upgrades as requiredUpgradesField, blacklisted_upgrades as blacklistedUpgradesField, " +
							 "hashField as hashField",
			countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
						 	"WHERE comments_tables.subjectField = upgrades_table.hashField" +
							") AS totalComments";

		API.methods.generateRawQuery(req, res,
			MainTable,
			baseAttributes + ", " + countQuery + " ",
			"",
			queryLine,
			API.methods.generatePaginatedQuery(req, res, queryValues(req)),
		function(entries) {
			getAssociatedUpgrades(entries.rows, function(nEntries) {
				entries.rows = nEntries;
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
			});
		});
	}

	function getUpgradesPlayer(req, res) {
		if (!API.methods.validateParameter(req, res, [[req.params.Hash, 'string']], true)) { return 0; }

		getUpgradesEntityFunc(req, res, PlayerModel, req.params.Hash, function(upgrades) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, upgrades);
		});
	}

	function getUpgradesPMC(req, res) {
		if (!API.methods.validateParameter(req, res, [[req.params.Hash, 'string']], true)) { return 0; }

		getUpgradesEntityFunc(req, res, PMCModel, req.params.Hash, function(upgrades) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, upgrades);
		});
	}

	function getUpgradesSelf(req, res) {
		var entity = API.methods.getMainEntity(req);

		entity.entityModel.findOne({ where: { "hashField": entity.entityHash }}).then(function(owner) {
			if (!API.methods.validate(req, res, [owner])) { return 0; }

			var UPGRADES_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req));
			UPGRADES_FUNC_QUERY.attributes = ["nameField", "slugField", "hashField", "hasUIField", "typeField", "kindField", "iconName", "maxTier"];

			UPGRADES_FUNC_QUERY.limit = 99;

			owner.getUpgrades(UPGRADES_FUNC_QUERY).then(function(upgrades) {
				for (var i = upgrades.length - 1; i >= 0; i--) {
					upgrades[i].dataValues.owned_upgrade = upgrades[i][(entity.hasPMC ? "pmc" : "player") + "_upgrades"];
					delete upgrades[i].dataValues.pmc_upgrades;
					delete upgrades[i].dataValues.player_upgrades;
				}
				API.methods.sendResponse(req, res, true, config.messages().return_entry, upgrades);
			});
		});
	}

	function getProminentUpgradesSelf(req, res) {
		var entity = API.methods.getMainEntity(req);

		entity.entityModel.findOne({ where: { "hashField": entity.entityHash }}).then(function(owner) {
			if (!API.methods.validate(req, res, [owner])) { return 0; }

			getProminentUpgradesFUNC(req, res, owner, function(entity_upgrade) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entity_upgrade);
			});
		});
	}

	function checkUpgradeOwned(req, res) {
		var entity = API.methods.getMainEntity(req);

		mainModel.findOne({where: {"hashField": req.params.Hash}}).then(function(upgrade) {
			var fUpgrade = (upgrade || {hashField: "123"});

			entity.entityModel.findOne({where: { "hashField": entity.entityHash }}).then(function(owner) {
				if (!API.methods.validate(req, res, [owner])) { return 0; }

				owner.getUpgrades({where: { "hashField": fUpgrade.hashField	}}).then(function(owned_upgrade) {
					var ownedProp = ((entity.entityType === "player") ? "player_upgrades" : "pmc_upgrades"),
						fOwnedUpgrade = (owned_upgrade[0] || {player_upgrades: {rankField: 0}}),
						currentRank = fOwnedUpgrade[ownedProp].rankField,
						rObject = { valid: (currentRank >= req.params.Rank), rank: currentRank };

					API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
				});
			});
		});
	}

	function reSpecTree(req, res) {
		req.serverValues = {}; req.serverValues.contextLimit = 999;
		var UPGRADES_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		UPGRADES_FUNC_QUERY.attributes = ["hashField", "parentUpgrade"];

		mainModel.findAll(UPGRADES_FUNC_QUERY).then(function(entries) {
			if (!API.methods.validate(req, res, [entries])) { return 0; }

			var treeChildren = [];

			function getUpgradeChildren(hash, mainParent) {
				var i, nChildIndex = 0, totalChildren = 0;
				for (i in entries) if (entries.parentUpgrade === hash) totalChildren++;

				entries.forEach(function(e, i) {
					var cUpgrade = e;
					if (cUpgrade.parentUpgrade === hash) {
						treeChildren.push(cUpgrade.hashField);
						nChildIndex++;
						getUpgradeChildren(cUpgrade.hashField, false);
					}
				});
			}

			getUpgradeChildren(req.params.Hash, true);

			treeChildren.push(req.params.Hash);

			var entity = API.methods.getMainEntity(req);

			entity.entityModel.findOne({where: { "hashField": entity.entityHash }}).then(function(owner) {
				if (!API.methods.validate(req, res, [owner])) { return 0; }

				owner.getActiveContractsAmount(function(contracts) {
					if (!API.methods.validate(req, res, [(contracts <= 0)], config.messages().modules.upgrades.cannot_respec_contract)) { return 0; }

					owner.getUpgrades({where: { "hashField": treeChildren }}).then(function(owned_upgrades) {
						if (!API.methods.validate(req, res, [(owned_upgrades.length > 0)])) { return 0; }

						function calculateReSpecFunds(owner, owned, callback) {
							var returnedFunds = 0, indexDone = 0,
								Transactions = require('./../index.js').getMethods().transactions;

							owned.forEach(function(e, i) {
								var ownedUpgradesModel = (e.player_upgrades || e.pmc_upgrades);
								returnedFunds += ((e.baseCost * (ownedUpgradesModel.rankField || 1)) * e.costMultiplier);

								owner.removeUpgrade(e).then(function() {
									indexDone++;
									if ((indexDone) === owned.length) return callback(returnedFunds);
								});
							});
						}

						calculateReSpecFunds(owner, owned_upgrades, function(returnedFunds) {
							var nReturnedFunds = ((returnedFunds / 100) * config.numbers.modules.upgrades.respecFundsPercent);

							owner.addFunds(nReturnedFunds, function(money) {
								config.websocket.broadcastEvent("NewUpgrade", [entity.entityType, entity.entityHash]);

								API.methods.sendResponse(req, res, true, "", nReturnedFunds);
							});
						});
					});
				});
			});
		});
	}

	function getUpgradesEntityFunc(req, res, qModel, qHash, callback) {

		qModel.findOne({where: { "hashField": qHash }}).then(function(owner) {

			if (!API.methods.validate(req, res, [owner])) { return 0; }

			var newQuery = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
				newQueryCount = API.methods.generatePaginatedQuery(req, res, queryValues(req)),

				QueryTable = (qModel === PMCModel) ? 'pmc_upgrades' : 'player_upgrades',
				queryProp = (qModel === PMCModel) ? 'PMCId' : 'PlayerId',
				queryWhereDetails = "(" + QueryTable + "." + queryProp + " = " + owner.id + ")";

			if (!API.methods.validateParameter(req, res, [[[req.query.qProminent], 'number', [0,1]]])) { return 0; }

			if (!req.query.SELF_MODE) {	queryWhereDetails += " AND (visible = 1)"; }
			if (req.query.qProminent) { queryWhereDetails += " AND (prominent = " + (req.query.qProminent) + ")"; newQuery.limit = config.numbers.modules.upgrades.maxProminent; }

			API.methods.generateRawQuery(req, res,
					QueryTable,
					"*, " + QueryTable + ".createdAt AS ownedSince",
					"LEFT JOIN `upgrades_table` ON " + QueryTable + ".upgradeId = upgrades_table.id",
					queryWhereDetails,
					newQuery, function(data) {
				for (var i=0; i < data.rows.length; i++) { data.rows[i] = require('lodash').omit(data.rows[i], ['playerId', 'PMCId', 'id', 'upgradeId', 'flavor_text_upgrades']); }

				getAssociatedUpgrades(data.rows, function(nEntries) {
					data.rows = nEntries;
					API.methods.sendResponse(req, res, true, "", data);
				});
			});
		});
	}

	function checkRanksRecursive(req, res, entity, upgradesList, blacklistMode, done, loopNumber) {
		var loopNumberActual = (loopNumber || 0);

		if (loopNumberActual === 0) {
			return checkRanksRecursive(req, res, entity, API.methods.cloneArray(upgradesList), blacklistMode, done, (loopNumberActual + 1));
		} else {
			if (upgradesList.length > 0) {
				var ownedUpgradeModel = (entity.entityType == "player") ? PlayerUpgrades : PMCUpgrades,
					currentUpgrade = upgradesList[0];

					mainModel.findOne({where: {'hashField': currentUpgrade[0]}}).then(function(foundUpgrade) {
						var ownerQuery = (entity.entityType == "player") ? {'upgradeId': foundUpgrade.id, 'playerId': entity.entityId} : {'upgradeId': foundUpgrade.id, 'PMCId': entity.entityId};

						ownedUpgradeModel.findOne({where: ownerQuery}).then(function(ownedUpgrade) {
							if (blacklistMode) {
								if ((ownedUpgrade) && (ownedUpgrade.rankField >= currentUpgrade[1])) {
									return done([false, foundUpgrade.nameField, ownedUpgrade.rankField, currentUpgrade[1]]);
								}
							} else {
								if (!(ownedUpgrade)) {
									return done([false, foundUpgrade.nameField, "0", currentUpgrade[1]]);
								}
								if (ownedUpgrade.rankField < currentUpgrade[1]) {
									return done([false, foundUpgrade.nameField, ownedUpgrade.rankField, currentUpgrade[1]]);
								}
							}

							upgradesList.splice(0, 1);

							return checkRanksRecursive(req, res, entity, upgradesList, blacklistMode, done, (loopNumberActual + 1));
						});
					});
			} else { return done([true]);	}
		}
	}

	function hasUpgradeRank(req, res, upgradeHash, req_rank, done) {
		var entity = API.methods.getMainEntity(req),
			entityUpgradeModel = entity.hasPMC ? PMCUpgrades : PlayerUpgrades,
			ownerIdProperty = entity.hasPMC ? "PMCId" : "playerId";

		entity.entityModel.findOne({where: { "hashField": entity.entityHash }}).then(function(owner) {
			if (!API.methods.validate(req, res, [owner])) { return 0; }
			mainModel.findOne({where: { "hashField": upgradeHash }}).then(function(upgrade) {
				if (!API.methods.validate(req, res, [upgrade])) { return 0; }

				var ownedUpgradeWhere = {where: { "upgradeId": upgrade.id }};

				if (entity.hasPMC) { ownedUpgradeWhere.where.PMCId = owner.id;
				} else { ownedUpgradeWhere.where.playerId = owner.id; }

				entityUpgradeModel.findOne(ownedUpgradeWhere).then(function(owned_upgrade) {

					var rVal;

					if (owned_upgrade) {
						if (req_rank === -1) {
							rVal = true;
						} else {
							rVal = (owned_upgrade.rankField >= req_rank);
						}
					} else { rVal = false; }

					return done(rVal);
				});
			});
		});
	}

	function loopThroughRequired(upgrades) {
		var i, rV = [];
		for (i in upgrades) { rV.push([upgrades[i].hashField, upgrades[i].Rank]); }
		return rV;
	}

	function post(req, res) {
		var _ = require("lodash");
		var flavortextUpgrades = _.toArray(req.body.flavortextUpgradesField);

		if (!API.methods.validateParameter(req, res, [
			[req.body.typeField, 'number', queryValues(req).allowedPostValues.typeValues],
			[req.body.kindField, 'number', queryValues(req).allowedPostValues.kindValues],
			[[
				req.body.nameField,
				req.body.slugField,
				(req.body.iconName || 'generic'),
				req.body.flavortextField
			], 'string'],
			[[
				req.body.maxTier,
				req.body.baseCost,
				req.body.costMultiplier,
				req.body.hasUIField
			], 'number'],
			[[flavortextUpgrades], 'array']
		], true)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[[(req.body.ingameVariable || "")], 'string']
		])) { return 0; }

		var UPGRADE_FUNC_QUERY = { where: {} };
		UPGRADE_FUNC_QUERY.where.$or = [{'nameField': req.body.nameField}, {'slugField': req.body.slugField}];

		mainModel.findOne(UPGRADE_FUNC_QUERY).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			mainModel.findOne({where: {'hashField': req.body.parentUpgrade.hashField}}).then(function(parent) {
				var update = {};

				if (API.methods.isValid(req.body.requiredUpgrades)) {
					if (req.body.requiredUpgrades === []) {
						update.requiredUpgradesField = [];
					} else { update.requiredUpgradesField = loopThroughRequired(req.body.requiredUpgrades); }
				}

				if (API.methods.isValid(req.body.blacklistedUpgrades)) {
					if (req.body.blacklistedUpgrades === []) {
						update.blacklistedUpgradesField = [];
					} else { update.blacklistedUpgradesField = loopThroughRequired(req.body.blacklistedUpgrades); }
				}

				if (parent) update.parentUpgrade = parent.hashField;

				if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
				if (API.methods.isValid(req.body.slugField)) update.slugField = req.body.slugField;
				if (API.methods.isValid(req.body.ingameVariable)) update.ingameVariable = req.body.ingameVariable;
				if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
				if (API.methods.isValid(req.body.hasUIField)) update.hasUIField = req.body.hasUIField;
				if (API.methods.isValid(req.body.kindField)) update.kindField = req.body.kindField;
				if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;
				if (API.methods.isValid(req.body.flavortextField)) update.flavortextField = req.body.flavortextField;
				if (API.methods.isValid(flavortextUpgrades)) update.flavortextUpgradesField = flavortextUpgrades;
				if (API.methods.isValid(req.body.maxTier)) update.maxTier = req.body.maxTier;
				if (API.methods.isValid(req.body.baseCost)) update.baseCost = req.body.baseCost;
				if (API.methods.isValid(req.body.costMultiplier)) update.costMultiplier = req.body.costMultiplier;

				mainModel.sync({force: false}).then(function() {
					mainModel.create(update).then(function(entry) {
						API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
					});
				});
			});
		});
	}

	function put(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[req.body.typeField, 'number', queryValues(req).allowedPostValues.typeValues],
			[req.body.kindField, 'number', queryValues(req).allowedPostValues.kindValues],
			[[
				req.body.nameField,
				req.body.slugField,
				(req.body.iconName || 'generic'),
				req.body.flavortextField
			], 'string'],
			[[
				req.body.maxTier,
				req.body.baseCost,
				req.body.costMultiplier
			], 'number'],
			[[req.body.flavortextUpgradesField], 'array']
		])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[[(req.body.ingameVariable || "")], 'string']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			mainModel.findOne({where: {'hashField': req.body.parentUpgrade.hashField}}).then(function(parent) {
				var update = {};

				if (API.methods.isValid(req.body.requiredUpgrades)) {
					if (req.body.requiredUpgrades === []) {
						update.requiredUpgradesField = [];
					} else { update.requiredUpgradesField = loopThroughRequired(req.body.requiredUpgrades); }
				}

				if (API.methods.isValid(req.body.blacklistedUpgrades)) {
					if (req.body.blacklistedUpgrades === []) {
						update.blacklistedUpgradesField = [];
					} else { update.blacklistedUpgradesField = loopThroughRequired(req.body.blacklistedUpgrades); }
				}

				if (parent) update.parentUpgrade = parent.hashField;
				if (req.body.parentUpgrade === -1) update.parentUpgrade = "";

				if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
				if (API.methods.isValid(req.body.slugField)) update.slugField = req.body.slugField;
				if (API.methods.isValid(req.body.ingameVariable)) update.ingameVariable = req.body.ingameVariable;
				if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
				if (API.methods.isValid(req.body.hasUIField)) update.hasUIField = req.body.hasUIField;
				if (API.methods.isValid(req.body.kindField)) update.kindField = req.body.kindField;
				if (API.methods.isValid(req.body.iconName)) update.iconName = req.body.iconName;
				if (API.methods.isValid(req.body.flavortextField)) update.flavortextField = req.body.flavortextField;
				if (API.methods.isValid(req.body.flavortextUpgradesField)) update.flavortextUpgradesField = req.body.flavortextUpgradesField;
				if (API.methods.isValid(req.body.maxTier)) update.maxTier = req.body.maxTier;
				if (API.methods.isValid(req.body.baseCost)) update.baseCost = req.body.baseCost;
				if (API.methods.isValid(req.body.costMultiplier)) update.costMultiplier = req.body.costMultiplier;

				var UPGRADES_FUNC_QUERY = { where: {} };
				UPGRADES_FUNC_QUERY.where.$or = [{'nameField': req.body.nameField}, {'slugField': req.body.slugField}];

				mainModel.findOne(UPGRADES_FUNC_QUERY).then(function(duplicate) {
					if (!API.methods.validate(req, res, [(duplicate ? (entry.hashField === duplicate.hashField) : true)], config.messages().entry_exists(req.body.nameField))) { return 0; }

					entry.update(update).then(function() {
						mainModel.sync({force: false}).then(function() {
							API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
						});
					});
				});

			});
		});
	}

	function duplicateUpgrade(req, res) {

		if (!API.methods.validateParameter(req, res, [[req.body.name, 'string']], true)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
			[req.body.kind, 'string', queryValues(req).allowedPostValues.kindValues],
			[[(req.body.icon || 'generic-upgrade'),req.body.flavortext], 'string'],
			[[
				req.body.maxtier,
				req.body.basecost,
				req.body.costmult
			], 'number'],
			[[req.body.flavortextupgrades], 'array']
		])) { return 0; }

		mainModel.findOne({where:{nameField: req.body.name}}).then(function(clone) {
			if (!API.methods.validate(req, res, [!clone], config.messages().entry_exists(req.body.name))) { return 0; }

			mainModel.findOne({where:{hashField: req.params.Hash}}).then(function(entry) {
				if (!API.methods.validate(req, res, [entry])) { return 0; }
				var update = {};

				update.nameField = (req.body.name || entry.nameField);
				update.typeField = (req.body.type || entry.typeField);
				update.kindField = (req.body.kind || entry.kindField);
				update.ingameVariable = (req.body.ingame || entry.ingameVariable);
				update.iconName = (req.body.icon || entry.iconName);
				update.hasUIField = (req.body.has_ui || entry.hasUIField);
				update.flavortextField = (req.body.flavortext || entry.flavortextField);
				update.flavortextUpgradesField = (req.body.flavortextupgrades || entry.flavortextUpgradesField);
				update.maxTier = (req.body.maxtier || entry.maxTier);
				update.baseCost = (req.body.basecost || entry.baseCost);
				update.costMultiplier = (req.body.costmult || entry.costMultiplier);

				mainModel.sync({force: false}).then(function() {
					mainModel.create(update).then(function(nEntry) {
						API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
					});
				});
			});
		});
	}

	function postPlayer(req, res) {

		var ID = req.body.upgrade,
			ID2 = req.body.player;

		if(!API.methods.validate(req, res, [ID, ID2])) { return 0; }

		mainModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PlayerModel.findOne({where: {"hashField":ID2}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID2))) { return 0; }

			if (!API.methods.validate(req, res, [entry.dataValues.typeField === "player"], config.messages().no_entry)) { return 0; }

			player.addUpgrade(entry).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().new_entry);
			});
		});
		});
	}

	function putPlayer(req, res) {

		var ID = req.body.upgrade,
			ID2 = req.body.player,
			rank = req.body.rank;

		if (!API.methods.validate(req, res, [ID, ID2, rank])) { return 0; }

		if (!API.methods.validate(req, res, [(
			(req.playerInfo.hashField == ID2) ||
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		mainModel.findOne({where:{'hashField': ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PlayerModel.findOne({where:{'hashField': ID2}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID2))) { return 0; }

		PlayerUpgrades.findOne({where:{'upgradeId': entry.id, 'PlayerId': player.id}}).then(function(upgrade) {
			if (!API.methods.validate(req, res, [upgrade], 'The player does not own this upgrade.')) { return 0; }

			upgrade.update({rankField:(upgrade.rankField + parseInt(rank))}).then(function() {
				PlayerUpgrades.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), upgrade);
				});
			});
		});
		});
		});
	}

	function postPMC(req, res) {

		var ID = req.body.upgrade,
			ID2 = req.body.pmc;

		if(!API.methods.validate(req, res, [ID, ID2])) { return 0; }

		mainModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PMCModel.findOne({where: {"hashField":ID2}}).then(function(pmc) {
			if (!API.methods.validate(req, res, [pmc], config.messages().entry_not_found(ID2))) { return 0; }

			if (!API.methods.validate(req, res, [entry.dataValues.typeField === "pmc"], config.messages().no_entry)) { return 0; }

			if(!API.methods.validate(req, res, [(
				((req.playerInfo.PMCId == pmc.id) && (req.playerInfo.playerTier <= config.privileges().tiers.admin)) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

			pmc.addUpgrade(entry).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().new_entry);
			});
		});
		});
	}

	function putPMC(req, res) {
		var ID = req.body.upgrade,
			ID2 = req.body.pmc,
			rank = req.body.rank;

		if (!API.methods.validate(req, res, [ID, ID2, rank])) { return 0; }

		UpgradesModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID + ', Upgrade.'))) { return 0; }
		PMCModel.findOne({where: {"hashField":ID2}}).then(function(pmc) {
			if (!API.methods.validate(req, res, [pmc], config.messages().entry_not_found(ID2 + ', PMC.'))) { return 0; }

			if(!API.methods.validate(req, res, [(
				((req.playerInfo.PMCId == pmc.id) && (req.playerInfo.playerTier <= config.privileges().tiers.admin)) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

		PMCUpgrades.findOne({where:{'upgradeId': entry.id, 'PMCId': pmc.id}}).then(function(upgrade) {
			if (!API.methods.validate(req, res, [upgrade], 'The PMC does not own this upgrade.')) { return 0; }

			upgrade.update({rankField:(upgrade.rankField + parseInt(rank))}).then(function() {
				PMCUpgrades.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), upgrade);
				});
			});
		});
		});
		});
	}

	function deleteUpgrade(req, res) {
		var objectID = req.params.Hash;
		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();