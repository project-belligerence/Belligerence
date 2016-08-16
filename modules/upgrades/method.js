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
	exports.getUpgradesEntityFunc = getUpgradesEntityFunc;
	exports.getUpgradesPlayer = getUpgradesPlayer;
	exports.getUpgradesPMC = getUpgradesPMC;
	exports.checkRanksRecursive = checkRanksRecursive;
	exports.getAssociatedUpgrades = getAssociatedUpgrades;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'type', 'kind', 'flavor_text', 'max_tier', 'base_cost'],
			allowedPostValues: {
				typeValues: ['player','pmc', 'both'],
				kindValues: ['misc', 'contract', 'logistics', 'offense', 'intelligence', 'certification']
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

				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (req.query.qType) { object.type = { $like: "%" + req.query.qType + "%" }; }
				if (req.query.qKind) { object.kind = { $like: "%" + req.query.qKind + "%" }; }
				if (req.query.qText) { object.flavor_text = { $like: "%" + req.query.qText + "%" }; }
				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }

				if (req.query.qMaxTier) { object.max_tier = { $between: [(req.query.qMaxTier.min || 0), (req.query.qMaxTier.max || 9999999)]}; }
				if (req.query.qCost) { object.base_cost = { $between: [(req.query.qCost.min || 0), (req.query.qCost.max || 9999999)]}; }

				if (req.query.SELF_MODE) {
					if (req.query.qRank) { object.rank = { $between: [(req.query.qRank.min || 0), (req.query.qRank.max || 9999999)]}; }
				}

				return object;
			}
		};
	}

	function getAssociatedUpgrades(upgrades, done) {
		var _ = require('lodash'),
				requiredHashes = [];

		for (var i in upgrades) {
			var
				requiredUpgrades = (upgrades[i].requiredUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].required_upgrades)),
				blacklistUpgrades = (upgrades[i].blacklistedUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].blacklisted_upgrades));

			for (var j in requiredUpgrades) {
				if (requiredUpgrades[j].length > 0) {
					requiredHashes.push(requiredUpgrades[j][0]);
				}
			}
			for (var j in blacklistUpgrades) {
				if (blacklistUpgrades[j].length > 0) {
					requiredHashes.push(blacklistUpgrades[j][0]);
				}
			}
		}
		requiredHashes = _.uniq(requiredHashes);

		API.methods.retrieveModelsRecursive(['upgrades'], {upgrades: requiredHashes}, ['nameField', 'hashField'], function(entries) {
			entries = API.methods.cloneArray((entries.upgrades || []));

			for (var i in upgrades) {
				var
					requiredUpgrades = (upgrades[i].requiredUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].required_upgrades)),
					blacklistUpgrades = (upgrades[i].blacklistedUpgradesField || API.methods.getDoublePseudoArray(upgrades[i].blacklisted_upgrades)),
					reqHashes = [],
					blackHashes = [],
					finalReq = [],
					finalBlack = []
				;

				for (var j in requiredUpgrades) {
					if (requiredUpgrades[j].length > 0) {
						reqHashes.push([[requiredUpgrades[j][0]], requiredUpgrades[j][1]]);
					}
				}
				for (var j in blacklistUpgrades) {
					if (blacklistUpgrades[j].length > 0) {
						blackHashes.push([[blacklistUpgrades[j][0]], blacklistUpgrades[j][1]]);
					}
				}

				var requiredUpgrades = [],
					blacklistedUpgrades = [];

				for (var j in entries) {
					var cEntry = (entries[j].dataValues);

					for (var h in reqHashes) {
						if (_.indexOf(reqHashes[h][0], cEntry.hashField) > -1) {
							var nObj = {};
							nObj.hashField = cEntry.hashField;
							nObj.nameField = cEntry.nameField;
							nObj.Rank = reqHashes[h][1];

							requiredUpgrades.push(nObj);
						}
					}

					for (var h in blackHashes) {
						if (_.indexOf(blackHashes[h][0], cEntry.hashField) > -1) {
							var nObj = {};
							nObj.hashField = cEntry.hashField;
							nObj.nameField = cEntry.nameField;
							nObj.Rank = blackHashes[h][1];

							blacklistedUpgrades.push(nObj);
						}
					}
				}

				if (upgrades[i].dataValues) {
					upgrades[i].dataValues.requiredUpgrades = requiredUpgrades;
					upgrades[i].dataValues.blacklistedUpgrades = blacklistedUpgrades;

					upgrades[i].dataValues = _.omit(upgrades[i].dataValues, ['requiredUpgradesField', 'blacklistedUpgradesField']);
				} else {
					upgrades[i].requiredUpgrades = requiredUpgrades;
					upgrades[i].blacklistedUpgrades = blacklistedUpgrades;

					upgrades[i] = _.omit(upgrades[i], ['required_upgrades', 'blacklisted_upgrades']);
				}
			}

			return done(upgrades);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash,
			CommentsMethods = require('./../index.js').getMethods().comments;

		mainModel.findOne({where: { "hashField": objectID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			CommentsMethods.getEntityComments(req, res, "upgrades_table", entry.hashField, function(comments) {
				entry.dataValues.comments = comments;

				getAssociatedUpgrades([entry], function(nEntries) {
					entry = nEntries;
					API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
				});
			});
		});
	}

	function getAll(req, res) {

		var MainTable = 'upgrades_table',
			entity = API.methods.getMainEntity(req),
			baseAttributes = "*",
			countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
						 	"WHERE comments_tables.subjectField = upgrades_table.hashField" +
							") AS totalComments";

		API.methods.generateRawQuery(req, res,
			MainTable,
			baseAttributes + ", " + countQuery + " ",
			"",
			'((type = "' + entity.entityType + '") OR (type = "both"))',
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

		req.query.SELF_MODE = true;

		getUpgradesEntityFunc(req, res, entity.entityModel, entity.entityHash, function(upgrades) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, upgrades);
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

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
			[req.body.kind, 'string', queryValues(req).allowedPostValues.kindValues],
			[[
				req.body.name,
				(req.body.icon || 'generic-upgrade'),
				req.body.flavortext
			], 'string'],
			[[
				req.body.maxtier,
				req.body.basecost,
				req.body.costmult
			], 'number'],
			[[req.body.flavortextupgrades], 'array']
		], true)) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.type) update.typeField = req.body.type;
			if (req.body.kind) update.kindField = req.body.kind;
			if (req.body.icon) update.iconName = req.body.icon;
			if (req.body.flavortext) update.flavortextField = req.body.flavortext;
			if (req.body.flavortextupgrades) update.flavortextUpgradesField = req.body.flavortextupgrades;
			if (req.body.maxtier) update.maxTier = req.body.maxtier;
			if (req.body.basecost) update.baseCost = req.body.basecost;
			if (req.body.costmult) update.costMultiplier = req.body.costmult;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) {
					API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
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
				update.iconName = (req.body.icon || entry.iconName);
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

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
			[req.body.kind, 'string', queryValues(req).allowedPostValues.kindValues],
			[[
				req.body.name,
				(req.body.icon || 'generic-upgrade'),
				req.body.flavortext
			], 'string'],
			[[
				req.body.maxtier,
				req.body.basecost,
				req.body.costmult
			], 'number'],
			[[req.body.flavortextupgrades], 'array']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.type) update.typeField = req.body.type;
			if (req.body.kind) update.kindField = req.body.kind;
			if (req.body.icon) update.iconName = req.body.icon;
			if (req.body.flavortext) update.flavortextField = req.body.flavortext;
			if (req.body.flavortextupgrades) update.flavortextUpgradesField = req.body.flavortextupgrades;
			if (req.body.maxtier) update.maxTier = req.body.maxtier;
			if (req.body.basecost) update.baseCost = req.body.basecost;
			if (req.body.costmult) update.costMultiplier = req.body.costmult;

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists('upgrade name'))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
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

})();