(function(){
	'use strict';

	var ConflictsModel = require('./../index.js').getModels().conflicts,
		FactionsModel = require('./../index.js').getModels().factions,
		MapsModel = require('./../index.js').getModels().maps,
		MissionsModel = require('./../index.js').getModels().missions,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Conflicts",
		mainModel = ConflictsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getAllFunc = getAllFunc;
	exports.getActiveConflicts = getActiveConflicts;
	exports.getLimited = getLimited;
	exports.getMapsNoConflictFunc = getMapsNoConflictFunc;
	exports.getConflictLackMissionsFunc = getConflictLackMissionsFunc;
	exports.getActiveFactionConflicts = getActiveFactionConflicts;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.addBelligerent = addBelligerent;
	exports.removeBelligerent = removeBelligerent;
	exports.getConflictStatus = getConflictStatus;
	exports.getBelligerents = getBelligerents;
	exports.editBelligerent = editBelligerent;
	exports.generateConflictFunc = generateConflictFunc;
	exports.detectConflictsOverFunc = detectConflictsOverFunc;
	exports.makeFactionsInactiveFunc = makeFactionsInactiveFunc;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'MapId', 'status', 'victor', 'active'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {}, _ = require("lodash");

				if (API.methods.isValid(req.query.qId)) { object.id = { $like: "%" + req.query.qId + "%" }; }
				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qStatus)) { object.status = { $like: "%" + req.query.qStatus + "%" }; }
				if (API.methods.isValid(req.query.qVictor)) { object.victor = { $like: "%" + req.query.qVictor + "%" }; }
				if (API.methods.isValid(req.query.qLocation)) { object.MapId = { $like: "%" + req.query.qLocation + "%" }; }

				if (API.methods.isValid(req.query.qActive)) { object.active = { $like: API.methods.getBoolean(req.query.qActive, true) }; }

				return object;
			}
		};
	}

	function makeFactionsInactiveFunc(callback) {
		var ParticipantsModel = require('./../index.js').getModels().participants;

		ParticipantsModel.findAll({
			where: {
				"statusField": 0, "activeField": true,
				"deployedAssetsField": { $lte: 0 }
			}
		}).then(function(defeated_factions) {
			Promise.all(defeated_factions.map(function(object) {
				return object.update({ "statusField": 1, "activeField": false });
			})).then(function() { return callback(); });
		});
	}

	function detectConflictsOverFunc(callback) {
		var ParticipantsModel = require('./../index.js').getModels().participants,
			_ = require("lodash");

		ParticipantsModel.findAll({ where: { "leaderField": true } }).then(function(leaders) {
			var i, j, endedConflicts = [], endedConflictsFactions = [], winnerFactions = [];

			for (i = leaders.length - 1; i >= 0; i--) {
				if ((leaders[i].statusField > 0) && (!(leaders[i].activeField))) {
					var winnerFaction = -1;

					for (j = leaders.length - 1; j >= 0; j--) {
						if ((leaders[j].FactionId !== leaders[i].FactionId) && (leaders[j].ConflictId === leaders[i].ConflictId)) {
							winnerFaction = leaders[j].FactionId;
							winnerFactions.push(winnerFaction);
						}
					}

					endedConflicts.push(leaders[i].ConflictId);
					endedConflictsFactions.push([leaders[i].ConflictId, winnerFaction]);
				}
			}

			endedConflicts = _.uniq(endedConflicts);

			FactionsModel.findAll({
				where: { "id": winnerFactions }, attributes: ["id", "sideField"]
			}).then(function(winner_factions) {
				mainModel.findAll({ where: { id: endedConflicts	} }).then(function(ended_conflicts) {
					Promise.all(ended_conflicts.map(function(conflict) {
						var conflictWinner = -1,
							sideWinner = -1;

						for (i = endedConflictsFactions.length - 1; i >= 0; i--) {
							var cConflict = endedConflictsFactions[i];
							if (cConflict[0] === conflict.id) conflictWinner = cConflict[1];
						}
						for (i = winner_factions.length - 1; i >= 0; i--) {
							if (winner_factions[i].id === conflictWinner) sideWinner = winner_factions[i].sideField;
						}

						if ((sideWinner > -1) && (conflictWinner > -1)) {
							return conflict.update({ "activeField": 0, "statusField": 2, "victorField": sideWinner });
						} else { return true; }

					})).then(function() { return callback(); });
				});
			});
		});
	}

	function getMapsNoConflictFunc(callback) {
		mainModel.findAll({
			where: { "activeField": true, "statusField": 0 },
			attributes: ["id", "hashField", "MapId"]
		}).then(function(conflicts) {
			var activeMaps = [0], i;
			for (i = conflicts.length - 1; i >= 0; i--) { activeMaps.push(conflicts[i].MapId); }

			MapsModel.findAll({
				where: { "activeField": true, "id": { $notIn: activeMaps }},
				attributes: ["id", "hashField", "nameField", "demonymField"]
			}).then(function(maps) { return callback(maps); });
		});
	}

	function getConflictLackMissionsFunc(conflict, callback) {
		MissionsModel.findAll({	where: { "ConflictId": conflict.id, "expiredField": false }}).then(function(missions) {
			var rObject = {
				lackMissions: (missions.length < config.numbers.modules.missions.missionsPerConflict),
				toGenerate: (config.numbers.modules.missions.missionsPerConflict - missions.length)
			};
			return callback(rObject);
		});
	}

	function generateConflictFunc(selectedMap, currentLoop, _cb) {

		if (currentLoop >= 50) { return _cb(); }
		else {
			var i, _ = require("lodash");

			FactionsModel.findOne({
				where: {
					"activeField": true,
					"policyField": FactionsModel.getPolicies().Aggressive,
					"currentAssetsField": { $gte: config.numbers.modules.factions.minimumAssetsToStartConflict },
					"areasOfInterest": { $like: "%" + selectedMap.id + "%" }
				},
				attributes: ["id", "hashField", "nameField", "demonymField", "MapId", "currentAssetsField", "organizationField"]
			}).then(function(faction_a) {
				if (API.methods.isUndefinedOrNull(faction_a)) { currentLoop++; return generateConflictFunc(selectedMap, currentLoop, _cb); }

				FactionsModel.findOne({
					where: {
						"activeField": true,
						"policyField": FactionsModel.getPolicies().Defensive,
						"sideField": { $not: faction_a.sideField },
						"currentAssetsField": { $gte: config.numbers.modules.factions.minimumAssetsToDefendConflict },
						"MapId": selectedMap.id
					},
					attributes: ["id", "hashField", "nameField", "demonymField", "MapId", "currentAssetsField", "organizationField"]
				}).then(function(faction_b) {
					if (API.methods.isUndefinedOrNull(faction_b)) { currentLoop++; return generateConflictFunc(selectedMap, currentLoop, _cb); }

					var conflictName;

					if (!(API.methods.isUndefinedOrNull(faction_a.MapId)) && (faction_a.MapId === faction_b.MapId)) {
						conflictName = selectedMap.demonymField + " Civil War";
					} else {
						conflictName = faction_a.demonymField + "-" + faction_b.demonymField + " War for " + selectedMap.nameField;
					}

					var deployedAssetsA = ((faction_a.currentAssetsField / 100) * 30),
						deployedAssetsB = ((faction_b.currentAssetsField / 100) * 50),
						resolutionA = faction_a.organizationField + _.random(-5, 5),
						resolutionB = faction_b.organizationField + _.random(-5, 5);

					if (faction_a.MapId === selectedMap.id) resolutionA += config.numbers.modules.factions.homeMapResolutionBonus;
					if (faction_b.MapId === selectedMap.id) resolutionB += config.numbers.modules.factions.homeMapResolutionBonus;

					resolutionA = API.methods.minMax(-10, 10, resolutionA);
					resolutionB = API.methods.minMax(-10, 10, resolutionB);

					var newConflictObject = {
						nameField: conflictName,
						MapId: selectedMap.id
					};

					function participantObject(resolution, assets) {
						return {
							resolutionField: resolution,
							deployedAssetsField: assets,
							leaderField: true,
							techModifier: _.random(-10, 10),
							trainingModifier: _.random(-10, 10),
							intelModifier: _.random(-10, 10),
							munificenceModifier: _.random(-10, 10)
						};
					}

					mainModel.create(newConflictObject).then(function(new_conflict) {
						var participantA = new participantObject(resolutionA, deployedAssetsA),
							participantB = new participantObject(resolutionB, deployedAssetsB);

						new_conflict.addFaction(faction_a, participantA).then(function(participant_a) {
							new_conflict.addFaction(faction_b, participantB).then(function(participant_b) {

								faction_a.update({currentAssetsField: (faction_a.currentAssetsField - deployedAssetsA)}).then(function() {
									faction_b.update({currentAssetsField: (faction_b.currentAssetsField - deployedAssetsB)}).then(function() {

										var resultObj = {
											conflict_name: conflictName,
											chosen_map: selectedMap,
											chosen_faction_a: faction_a,
											assets_a: deployedAssetsA,
											resolution_a: resolutionA,
											chosen_faction_b: faction_b,
											assets_b: deployedAssetsB,
											resolution_b: resolutionB,
										};

										return _cb();
									});
								});
							});
						});
					});
				});
			});
		}
	}

	function getConflictStatus(req, res) {
		var configSides = mainModel.getStatus(), rObject = [];
		for (var keys in configSides) { rObject.push({text: keys, data: configSides[keys]}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getActiveFactionConflicts(req, res) {
		FactionsModel.findOne({ where: { "id": req.query.qFaction }}).then(function(faction) {

			var queryValueModel = {};

			queryValueModel.include = [
				{
					model: MapsModel,
					attributes: ["hashField", "nameField", "classnameField"]
				},
				{
					model: FactionsModel,
					attributes: ["hashField", "nameField", "sideField", "assetsField", "MapId"],
					where: { "$Factions.participant_table.leader$": true }
				}
			];

			queryValueModel.where = { activeField: true };

			faction.getConflicts(queryValueModel).then(function(entries) {

				var i, j, conflictIds = [];

				for (i = entries.length - 1; i >= 0; i--) {
					entries[i].dataValues.missionCount = 0;
					conflictIds.push(entries[i].id);
				}

				var missionQuery = {
					where: { "ConflictId": conflictIds },
					attributes: ["ConflictId"]
				};

				MissionsModel.findAll(missionQuery).then(function(mission_entries) {
					for (i = entries.length - 1; i >= 0; i--) {
						for (j = mission_entries.length - 1; j >= 0; j--) {
							if (entries[i].id === mission_entries[j].ConflictId) entries[i].dataValues.missionCount++;
						}
					}
					API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
				});
			});
		});
	}

	function getActiveConflicts(req, res) {
		var queryValueModel = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		queryValueModel.include = [
			{
				model: MapsModel,
				attributes: ["hashField", "nameField", "classnameField"]
			},
			{
				model: FactionsModel,
				attributes: ["hashField", "nameField", "sideField", "assetsField", "MapId"],
				where: { "$Factions.participant_table.leader$": 1 }
			}
		];

		queryValueModel.where.activeField = true;

		mainModel.findAndCountAll(queryValueModel).then(function(entries) {

			var i, j, conflictIds = [];

			for (i = entries.rows.length - 1; i >= 0; i--) {
				entries.rows[i].dataValues.missionCount = 0;
				conflictIds.push(entries.rows[i].id);
			}

			var missionQuery = {
				where: { "ConflictId": conflictIds },
				attributes: ["ConflictId"]
			};

			MissionsModel.findAll(missionQuery).then(function(mission_entries) {
				for (i = entries.rows.length - 1; i >= 0; i--) {
					for (j = mission_entries.length - 1; j >= 0; j--) {
						if (entries.rows[i].id === mission_entries[j].ConflictId) entries.rows[i].dataValues.missionCount++;
					}
				}
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function getAllFunc() {
		/*
			order: "rand()",
			limit: 1
		*/
		return mainModel.findAll({ where: { "activeField": true }, include: [FactionsModel] });
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;
		mainModel.findOne({ include: [MapsModel], where: {"hashField": objectID} }).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var factionQuery = { attributes: ['hashField', 'nameField', 'sideField', 'MapId', 'activeField', 'areasOfInterest', 'assetsField', 'currentAssetsField'] };

			entry.getFactions(factionQuery).then(function(factions) {
				entry.dataValues.factionsField = factions;
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
			});
		});
	}

	function getBelligerents(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({ where: {"hashField": objectID} }).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var factionQuery = { attributes: ['hashField', 'nameField', 'sideField', 'MapId', 'activeField', 'areasOfInterest', 'assetsField', 'currentAssetsField'] };

			entry.getFactions(factionQuery).then(function(factions) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, factions);
			});
		});
	}

	function addBelligerent(req, res) {

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var factionField = req.body.factionField;

			FactionsModel.findOne({where:{'hashField': factionField}}).then(function(faction) {
				if (!API.methods.validate(req, res, [faction], config.messages().entry_not_found(factionField))) { return 0; }

				entry.addFaction(faction).then(function() {
					mainModel.sync({force: false}).then(function() {
						mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry2) {
							API.methods.sendResponse(req, res, true, config.messages().return_entry, entry2);
						});
					});
				});
			});
		});
	}

	function editBelligerent(req, res) {
		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(conflict) {
			if (!API.methods.validate(req, res, [conflict], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var factionParams = req.body.factionField;

			FactionsModel.findOne({where:{'hashField': factionParams.hashField}}).then(function(faction) {
				if (!API.methods.validate(req, res, [faction], config.messages().entry_not_found(factionParams.nameField))) { return 0; }

				var ParticipantsModel = require('./../index.js').getModels().participants;

				ParticipantsModel.findOne({where: {"ConflictId": conflict.id, "FactionId": faction.id}}).then(function(participant) {
					if (!API.methods.validate(req, res, [faction], config.messages().entry_not_found(factionParams.nameField))) { return 0; }

					ParticipantsModel.findAll({where: {"FactionId": faction.id}}).then(function(conflicts) {

						var totalDeployedAssets = 0;
						for (var i = conflicts.length - 1; i >= 0; i--) {
							totalDeployedAssets += ((conflicts[i].ConflictId === conflict.id) ? factionParams.participant_table.deployedAssetsField : conflicts[i].deployedAssetsField);
						}
						var finalAssetCount = (Math.max((faction.assetsField - totalDeployedAssets), 0));

						faction.update({currentAssetsField: finalAssetCount}).then(function(faction_e) {
							FactionsModel.sync({force: false}).then(function() {
								participant.update(factionParams.participant_table).then(function(participant_e) {
									mainModel.sync({force: false}).then(function() {
										faction_e.dataValues.participant_table = participant_e;
										API.methods.sendResponse(req, res, true, config.messages().entry_updated(factionParams.nameField), faction_e);
									});
								});
							});
						});
					});
				});
			});
		});
	}

	function removeBelligerent(req, res) {

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var factionField = req.body.factionField;

			FactionsModel.findOne({where:{'hashField': factionField}}).then(function(faction) {
				if (!API.methods.validate(req, res, [faction], config.messages().entry_not_found(factionField))) { return 0; }

				entry.removeFaction(faction).then(function() {
					mainModel.sync({force: false}).then(function() {
						var ParticipantsModel = require('./../index.js').getModels().participants;

						ParticipantsModel.findAll({where: {"FactionId": faction.id}}).then(function(conflicts) {

							var totalDeployedAssets = 0;
							for (var i = conflicts.length - 1; i >= 0; i--) { totalDeployedAssets += conflicts[i].deployedAssetsField; }

							var finalAssetCount = (Math.max((faction.assetsField - totalDeployedAssets), 0));

							faction.update({currentAssetsField: finalAssetCount}).then(function() {
								FactionsModel.sync({force: false}).then(function() {
									mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry2) {
										API.methods.sendResponse(req, res, true, config.messages().return_entry, entry2);
									});
								});
							});
						});
					});
				});
			});
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[[req.body.statusField, req.body.victorField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.nameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.statusField)) update.statusField = req.body.statusField;
			if (API.methods.isValid(req.body.victorField)) update.victorField = req.body.victorField;

			if (API.methods.isValid(req.body.MapId)) update.MapId = ((req.body.MapId > 0) ? req.body.MapId : null);

			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[[req.body.statusField, req.body.victorField], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.statusField)) update.statusField = req.body.statusField;
			if (API.methods.isValid(req.body.victorField)) update.victorField = req.body.victorField;

			if (API.methods.isValid(req.body.MapId)) update.MapId = ((req.body.MapId > 0) ? req.body.MapId : null);

			if (API.methods.isValid(req.body.activeField)) update.activeField = req.body.activeField;

			var OBJECT_FUNC_QUERY = { where: {} };
			OBJECT_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }, { 'hashField': req.body.hashField }];

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

			entry.getFactions().then(function(factions) {
				for (var i = factions.length - 1; i >= 0; i--) {
					factions[i].update({
						currentAssetsField: (factions[i].currentAssetsField + factions[i].participant_table.deployedAssetsField)
					});
				}
				entry.destroy().then(function() { API.methods.sendResponse(req, res, true, config.messages().entry_deleted); });
			});
		});
	}

})();