(function(){
	'use strict';

	var MissionsModel = require('./../index.js').getModels().missions,
		FactionsModel = require('./../index.js').getModels().factions,
		MapsModel = require('./../index.js').getModels().maps,
		LocationsModel = require('./../index.js').getModels().locations,
		ObjectivesModel = require('./../index.js').getModels().objectives,
		AdvisoriesModel = require('./../index.js').getModels().advisories,
		ConflictsModel = require('./../index.js').getModels().conflicts,
		ContractsModel = require('./../index.js').getModels().contracts,
		InterestMethods = require('.//../index.js').getMethods().interest,

		UpgradesMethods = require('./../index.js').getMethods().upgrades,

		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Missions",
		mainModel = MissionsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	exports.cleanUpMissionsFunc = cleanUpMissionsFunc;
	exports.generateMissionFunc = generateMissionFunc;
	exports.cleanUpMissions = cleanUpMissions;
	exports.getSignatureFee = getSignatureFee;
	exports.getMissionParticipants = getMissionParticipants;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'difficulty', 'unit_limit', 'reward_a', 'reward_b', 'expired', 'advisories', 'ObjectiveId', 'FactionAId', 'FactionBId', 'MapId', 'LocationId', 'ConflictId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {}, _ = require("lodash");

				if (API.methods.isValid(req.query.qId)) { object.id = { $like: "%" + req.query.qId + "%" }; }
				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qDifficulty)) { req.query.qDifficulty = JSON.parse(req.query.qDifficulty); object.difficulty = { $between: [(req.query.qDifficulty.min || 0), (req.query.qDifficulty.max || 9999999)]}; }

				if (API.methods.isValid(req.query.qReward)) { req.query.qReward = JSON.parse(req.query.qReward); object.reward_a = { $between: [(req.query.qReward.min || 0), (req.query.qReward.max || 9999999)]}; }

				if (API.methods.isValid(req.query.qObjectiveId)) { object.ObjectiveId = { $like: "%" + req.query.qObjectiveId + "%" }; }
				if (API.methods.isValid(req.query.qFactionAId)) { object.FactionAId = { $like: "%" + req.query.qFactionAId + "%" }; }
				if (API.methods.isValid(req.query.qFactionBId)) { object.FactionBId = { $like: "%" + req.query.qFactionBId + "%" }; }

				if (API.methods.isValid(req.query.qMapId)) { object.MapId = { $like: "%" + req.query.qMapId + "%" }; }
				if (API.methods.isValid(req.query.qLocationId)) { object.LocationId = { $like: "%" + req.query.qLocationId + "%" }; }
				if (API.methods.isValid(req.query.qConflictId)) { object.ConflictId = { $like: "%" + req.query.qConflictId + "%" }; }

				if (API.methods.isValid(req.query.qExpired)) { object.expired = { $like: API.methods.getBoolean(req.query.qExpired, true) }; }

				return object;
			},
			missionQuery: function(hash) {
				return {
					where: { "hashField": hash },
					include: [
						MapsModel, LocationsModel, ObjectivesModel, ConflictsModel,
						{ model: FactionsModel, as: 'FactionA' },
						{ model: FactionsModel, as: 'FactionB' }
					]
				};
			}
		};
	}

	initializeWebsocketEvents();

	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();
		config.websocket.registerEvent("NewParticipant", WebsocketEvent);
	}

	function getSignatureFee(req, res) {
		API.methods.sendResponse(req, res, true, "", config.numbers.modules.missions.signatureFee);
	}

	function getMissionName() {
		var _ = require("lodash"), firstWord, secondWord, thirdWord, fourthWord, templateString;

		switch (_.random(2)) {
			case 0: {
				firstWord = ["Garrotte", "Castle", "Tower", "Sword", "Moat", "Traveller", "Headwind", "Fountain", "Taskmaster", "Tulip", "Carnation", "Gaunt", "Goshawk", "Flashbulb", "Banker", "Piano", "Rook", "Knight", "Bishop", "Pyrite", "Granite", "Hearth", "Staircase"];
				templateString = "${ first }";
			} break;
			case 1: {
				firstWord = ["Dust", "Swamp", "Red", "Green", "Black", "Gold", "Silver", "Lion", "Bear", "Dog", "Tiger", "Eagle", "Fox", "North", "Moon", "Watch", "Under", "Key", "Court", "Palm", "Fire", "Fast", "Light", "Blind", "Spite", "Smoke", "Castle"];
				secondWord = ["bowl", "catcher", "fisher", "claw", "house", "master", "man", "fly", "market", "cap", "wind", "break", "cut", "tree", "woods", "fall", "force", "storm", "blade", "knife", "cut", "cutter", "taker", "torch"];
				templateString = "${ first }-${ second }";
			} break;
			case 2: {
				firstWord = ["Midnight", "Fallen", "Turbulent", "Nesting", "Daunting", "Dogged", "Darkened", "Shallow", "Second", "First", "Third", "Blank", "Absent", "Parallel", "Restless"];
				secondWord = ["Sky", "Moon", "Sun", "Hand", "Monk", "Priest", "Viper", "Snake", "Boon", "Cannon", "Market", "Rook", "Knight", "Bishop", "Command", "Mirror", "Crisis", "Spider", "Charter", "Court", "Hearth"];
				templateString = "${ first } ${ second }";
			} break;
		}

		var operationName = _.template(templateString)({
				first: _.sample(firstWord),
				second: _.sample(secondWord),
				third: _.sample(thirdWord),
				fourth: _.sample(fourthWord)
			});

		return operationName;
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = (req.query.limit || 8);

		var generatedReq = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		generatedReq.include = [
			{ model: MapsModel, attributes: ["hashField", "nameField", "classnameField"] },
		];

		var
			locationQuery = { model: LocationsModel, attributes: ["typeField"] },
			objectiveQuery = {
				model: ObjectivesModel,
				attributes: [
					"nameField", "iconName", "descriptionField", "hourLimitField",
					"difficultyField", "unitLimit", "adversarialField", "captureField"
				]
			},
			factionQuery = function(as) {
				return {
					model: FactionsModel, as: as,
					attributes: ["hashField", "nameField", "sideField"]
				};
			},
			factionAQuery = new factionQuery("FactionA"),
			factionBQuery = new factionQuery("FactionB");

		if (API.methods.isValid(req.query.qFactionASide)) {
			factionAQuery.where = { sideField: { $like: "%" + req.query.qFactionASide + "%" }};
		}

		if (API.methods.isValid(req.query.qFactionBSide)) {
			factionBQuery.where = { sideField: { $like: "%" + req.query.qFactionBSide + "%" }};
		}

		if (API.methods.isValid(req.query.qCapture)) {
			objectiveQuery.where = { captureField: { $like: API.methods.getBoolean(req.query.qCapture, true) }};
		}

		if (API.methods.isValid(req.query.qUnitLimit)) {
			var unitLimitQuery = JSON.parse(req.query.qUnitLimit);
			objectiveQuery.where = { unitLimit: { $between: [(unitLimitQuery.min || 0), (unitLimitQuery.max || 9999999)] }};
		}

		if (API.methods.isValid(req.query.qAdversarial)) {
			objectiveQuery.where = { adversarialField: { $like: API.methods.getBoolean(req.query.qAdversarial, true) }};
		}

		if (API.methods.isValid(req.query.qLocationTypes)) {
			var locationType = (typeof req.query.qLocationTypes === "string") ? [req.query.qLocationTypes] : req.query.qLocationTypes;
			locationQuery.where = {	typeField: { $in: locationType } };
		}

		if (req.query.sort === "unit_limit") {
			generatedReq.order = [[ObjectivesModel, 'unit_limit', req.query.order.toUpperCase()]];
		}

		generatedReq.include.push(objectiveQuery);
		generatedReq.include.push(locationQuery);
		generatedReq.include.push(factionAQuery);
		generatedReq.include.push(factionBQuery);

		mainModel.findAndCountAll(generatedReq).then(function(entries) {
			var ContractsMethods = require('.//../index.js').getMethods().contracts,
				missionsId = [], i, j;

			for (i = entries.rows.length - 1; i >= 0; i--) { missionsId.push(entries.rows[i].dataValues.id); }

			ContractsMethods.countMissionsUnitsFUNC(missionsId).then(function(contracts) {
				for (i = entries.rows.length - 1; i >= 0; i--) { entries.rows[i].dataValues.signedUnits = { a: 0, b: 0, error: 0 }; }
				for (i = entries.rows.length - 1; i >= 0; i--) {
					var cV = entries.rows[i].dataValues;

					for (var keys in contracts) {
						var contract = contracts[keys];

						for (j = contract.length - 1; j >= 0; j--) {
							if (cV.id === contract[j].MissionId) {
								entries.rows[i].dataValues.signedUnits[keys] += contract[j].signedUnits;
							}
						}
					}
				}
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne(queryValues(req).missionQuery(objectID)).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], "This Mission no longer exists.")) { return 0; }

			getMissionSlotsFUNC(entry, function(signedUnits) {
				entry.dataValues.signedUnits = signedUnits;

				UpgradesMethods.getAssociatedUpgrades([entry.FactionA], function(nEntries) {
					UpgradesMethods.getAssociatedUpgrades([entry.FactionB], function(nEntries) {
						API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
					});
				});
			});
		});
	}

	function getMissionParticipants(req, res) {
		var objectID = req.params.Hash;
		mainModel.findOne({ where: { hashField: objectID } }).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			getMissionSlotsFUNC(entry, function(slots) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, slots);
			});
		});
	}

	function getMissionSlotsFUNC(mission, callback) {
		var ContractsMethods = require('.//../index.js').getMethods().contracts;
		ContractsMethods.countMissionsUnitsFUNC([mission.id]).then(function(contracts) {
			var rObj = { a: 0, b: 0, error: 0 };
			for (var keys in contracts) {
				var contract = contracts[keys];
				for (var j = contract.length - 1; j >= 0; j--) {
					if (mission.id === contract[j].MissionId) rObj[keys] += (contract[j].signedUnits);
				}
			}
			return callback(rObj);
		});
	}

	function post(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string', config.numbers.modules.messages.maxTitleLength],
			[[
				req.body.difficultyField, req.body.rewardAField, req.body.rewardBField,
				req.body.ObjectiveId, req.body.FactionAId, req.body.FactionBId,
				req.body.MapId, req.body.LocationId, req.body.ConflictId
			], 'number']
		])) { return 0; }

		if (!API.methods.validate(req, res,	[req.body.FactionAId !== req.body.FactionBId], config.messages().no_entry)) { return 0; }

		mainModel.findOne({where:{'LocationId': req.body.LocationId}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], "A mission is already ongoing in this location.")) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.difficultyField)) update.difficultyField = req.body.difficultyField;
			if (API.methods.isValid(req.body.advisoriesField)) update.advisoriesField = req.body.advisoriesField;

			ObjectivesModel.findOne({ where: { id: req.body.ObjectiveId }}).then(function(objective_model) {
			FactionsModel.findOne({ where: { id: req.body.FactionAId }}).then(function(factiona_model) {
			FactionsModel.findOne({ where: { id: req.body.FactionBId }}).then(function(factionb_model) {
			MapsModel.findOne({ where: { id: req.body.MapId }}).then(function(map_model) {
			LocationsModel.findOne({ where: { id: req.body.LocationId }}).then(function(location_model) {
			ConflictsModel.findOne({ where: { id: req.body.ConflictId }}).then(function(conflict_model) {

				if (!API.methods.validate(req, res,
					[objective_model, factiona_model, factionb_model, map_model, location_model, conflict_model],
				config.messages().no_entry)) { return 0; }

				if (!API.methods.validate(req, res,	[location_model.MapId === map_model.id], "The Location and Map do not match.")) { return 0; }
				if (!API.methods.validate(req, res,	[factiona_model.id === factionb_model.id], "Both Factions are the same.")) { return 0; }
				if (!API.methods.validate(req, res,	[factiona_model.sideField === factionb_model.sideField], "Both Factions are on the same Side.")) { return 0; }

				var factionA = factiona_model,
					factionB = factionb_model,
					objective = objective_model;

				conflict_model.getFactions({attributes: ['id']}).then(function(participants) {
					var i, munifA, munifB;

					for (i = participants.length - 1; i >= 0; i--) {
						if (participants[i].id === factionA.id) { munifA = participants[i].participant_table.munificenceModifier; }
						if (participants[i].id === factionB.id) { munifB = participants[i].participant_table.munificenceModifier; }
					}

					var finalRewardValueA = (objective.baseRewardField * ((factionA.munificenceField + munifA) / 5)),
						finalRewardValueB = (objective.baseRewardField * ((factionB.munificenceField + munifB) / 5));

					update.rewardAField = finalRewardValueA;
					update.rewardBField = finalRewardValueB;

					if (API.methods.isValid(req.body.ObjectiveId)) update.ObjectiveId = req.body.ObjectiveId;
					if (API.methods.isValid(req.body.FactionAId)) update.FactionAId = req.body.FactionAId;
					if (API.methods.isValid(req.body.FactionBId)) update.FactionBId = req.body.FactionBId;
					if (API.methods.isValid(req.body.MapId)) update.MapId = req.body.MapId;
					if (API.methods.isValid(req.body.LocationId)) update.LocationId = req.body.LocationId;
					if (API.methods.isValid(req.body.ConflictId)) update.ConflictId = req.body.ConflictId;

					if (API.methods.isValid(req.body.rewardAField)) update.rewardAField = req.body.rewardAField;
					if (API.methods.isValid(req.body.rewardBField)) update.rewardBField = req.body.rewardBField;

					mainModel.sync({force: false}).then(function() {
						mainModel.create(update).then(function(entry) {
							API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
						});
					});
				});
			});
			});
			});
			});
			});
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string', config.numbers.modules.messages.maxTitleLength],
			[[
				req.body.difficultyField, req.body.rewardAField, req.body.rewardBField,
				req.body.ObjectiveId, req.body.FactionAId, req.body.FactionBId,
				req.body.MapId, req.body.LocationId, req.body.ConflictId
			], 'number']
		])) { return 0; }

		if (!API.methods.validate(req, res,	[req.body.FactionAId !== req.body.FactionBId], config.messages().no_entry)) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.difficultyField)) update.difficultyField = req.body.difficultyField;
			if (API.methods.isValid(req.body.advisoriesField)) update.advisoriesField = req.body.advisoriesField;

			ObjectivesModel.findOne({ where: { id: req.body.ObjectiveId }}).then(function(objective_model) {
			FactionsModel.findOne({ where: { id: req.body.FactionAId }}).then(function(factiona_model) {
			FactionsModel.findOne({ where: { id: req.body.FactionBId }}).then(function(factionb_model) {
			MapsModel.findOne({ where: { id: req.body.MapId }}).then(function(map_model) {
			LocationsModel.findOne({ where: { id: req.body.LocationId }}).then(function(location_model) {
			ConflictsModel.findOne({ where: { id: req.body.ConflictId }}).then(function(conflict_model) {

				if (!API.methods.validate(req, res,
					[objective_model, factiona_model, factionb_model, map_model, location_model, conflict_model],
				config.messages().no_entry)) { return 0; }

				if (!API.methods.validate(req, res,	[location_model.MapId === map_model.id], "The Location and Map do not match.")) { return 0; }
				if (!API.methods.validate(req, res,	[factiona_model.id !== factionb_model.id], "Both Factions are the same.")) { return 0; }
				if (!API.methods.validate(req, res,	[factiona_model.sideField !== factionb_model.sideField], "Both Factions are on the same Side.")) { return 0; }

				var factionA = factiona_model,
					factionB = factionb_model,
					objective = objective_model;

				conflict_model.getFactions({attributes: ['id']}).then(function(participants) {
					var i, munifA, munifB;

					for (i = participants.length - 1; i >= 0; i--) {
						if (participants[i].id === factionA.id) { munifA = participants[i].participant_table.munificenceModifier; }
						if (participants[i].id === factionB.id) { munifB = participants[i].participant_table.munificenceModifier; }
					}

					var finalRewardValueA = (objective.baseRewardField * ((factionA.munificenceField + munifA) / 5)),
						finalRewardValueB = (objective.baseRewardField * ((factionB.munificenceField + munifB) / 5));

					update.rewardAField = finalRewardValueA;
					update.rewardBField = finalRewardValueB;

					if (API.methods.isValid(req.body.ObjectiveId)) update.ObjectiveId = req.body.ObjectiveId;
					if (API.methods.isValid(req.body.FactionAId)) update.FactionAId = req.body.FactionAId;
					if (API.methods.isValid(req.body.FactionBId)) update.FactionBId = req.body.FactionBId;
					if (API.methods.isValid(req.body.MapId)) update.MapId = req.body.MapId;
					if (API.methods.isValid(req.body.LocationId)) update.LocationId = req.body.LocationId;
					if (API.methods.isValid(req.body.ConflictId)) update.ConflictId = req.body.ConflictId;

					if (API.methods.isValid(req.body.rewardAField)) update.rewardAField = req.body.rewardAField;
					if (API.methods.isValid(req.body.rewardBField)) update.rewardBField = req.body.rewardBField;

					mainModel.sync({force: false}).then(function() {
						entry.update(update).then(function(nEntry) {
							API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
						});
					});
				});
			});
			});
			});
			});
			});
			});
		});
	}

	function generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback) {
		currentLoop++;

		if (
			(currentLoop >= config.numbers.modules.missions.MAX_GENERATION_ATTEMPTS) ||
			(successful >= target)
		) { return callback(); }
		else {
			var i, j, _ = require("lodash"),
				validConflicts = [], activeLocations = [0], conflictQuery = {}, cFactions = _.shuffle(selectedConflict.Factions),
				factionA = null, factionB = null;

			for (i = cFactions.length - 1; i >= 0; i--) {
				if (
					(cFactions[i].participant_table.statusField === 0) &&
					(cFactions[i].participant_table.activeField)
				) { factionA = cFactions[i]; }
			}

			for (i = cFactions.length - 1; i >= 0; i--) {
				if (
					(cFactions[i].participant_table.statusField === 0) &&
					(cFactions[i].participant_table.activeField) &&
					(cFactions[i].sideField !== factionA.sideField)
				) { factionB = cFactions[i]; }
			}

			if (API.methods.isUndefinedOrNull(factionA)) return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);
			if (API.methods.isUndefinedOrNull(factionB)) return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);

			mainModel.findAll({attributes: ["nameField", "LocationId"] }).then(function(missionConflicts) {

				var curNameGen = getMissionName(),
					curMissionNames = [];

				conflictQuery.include = [FactionsModel];

				if (missionConflicts.length > 0) {
					for (i = missionConflicts.length - 1; i >= 0; i--) {
						API.methods.addIfNew(missionConflicts[i].LocationId, activeLocations);
						curMissionNames.push(missionConflicts.nameField);
					}
				}

				do { curNameGen = getMissionName(); } while (API.methods.inArray(curNameGen, curMissionNames));

				ObjectivesModel.findAll({
					where: {
						"assetCostField": { $lt: factionA.currentAssetsField },
						"doctrineTypes": { $like: "%" + factionA.tacticsField + "%" },
						"disabledMaps": { $notLike: "%" + selectedConflict.MapId + "%" },
						"adversarialField": adversarial,
						"activeField": true
					}, order: "rand()", limit: 1
				}).then(function(model_objective) {
					if (API.methods.isUndefinedOrNull(model_objective)) return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);

					var objectiveIds = [];
					for (i = model_objective.length - 1; i >= 0; i--) { objectiveIds.push(model_objective[i].id); }

					model_objective = model_objective[0];

					var objectiveChance = _.random(100);
					if (objectiveChance > model_objective.chanceField) return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);

					mainModel.findAll({
						where: {
							"ObjectiveId": objectiveIds,
							"ConflictId": selectedConflict.id,
							"expiredField": false
						}, attributes: ["id"]
					}).then(function(objectiveMissions) {
						if (adversarial && (objectiveMissions.length >= config.numbers.modules.missions.adversarialMissionsDay)) return callback();

						var locationQuery = {
							where: {
								"id": { $notIn: activeLocations },
								"MapId": selectedConflict.MapId,
								"typeField": { $in: model_objective.locationTypes },
								"ownerField": { $ne: factionA.sideField },
								"activeField": true
							}, order: "rand()", limit: 1
						};

						LocationsModel.findAll(locationQuery).then(function(model_location) {
							if (API.methods.isUndefinedOrNull(model_location)) return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);
							model_location = model_location[0];

							var factionATotalMunif = (factionA.munificenceField + factionA.participant_table.munificenceModifier),
								factionBTotalMunif = (factionB.munificenceField + factionB.participant_table.munificenceModifier),
								finalRewardValueA = (model_objective.baseRewardField * (factionATotalMunif / 5)),
								finalRewardValueB = (model_objective.baseRewardField * (factionBTotalMunif / 5)),
								locationBonus = API.methods.minMax(1, config.numbers.modules.locations.importanceBonusLimit, model_location.importanceField);

							finalRewardValueA += ((finalRewardValueA / 100) * (_.random(1, factionATotalMunif)));
							finalRewardValueA += ((finalRewardValueA * (locationBonus * config.numbers.modules.locations.importanceMultiplier)) / 100);

							finalRewardValueB += ((finalRewardValueB / 100) * (_.random(1, factionBTotalMunif)));
							finalRewardValueB += ((finalRewardValueB * (locationBonus * config.numbers.modules.locations.importanceMultiplier)) / 100);

							var newMissionObject = {
								nameField: curNameGen,
								difficultyField: model_objective.difficultyField,
								advisoriesField: [],
								ObjectiveId: model_objective.id,
								FactionAId: factionA.id,
								rewardAField: finalRewardValueA,
								rewardBField: finalRewardValueB,
								FactionBId: factionB.id,
								MapId: selectedConflict.MapId,
								LocationId: model_location.id,
								ConflictId: selectedConflict.id
							};

							mainModel.sync({force: false}).then(function() {
								mainModel.create(newMissionObject).then(function(entry) {
									successful++;
									return generateMissionFunc(adversarial, selectedConflict, currentLoop, successful, target, callback);
								});
							});
						});

					});
				});
			});
		}
	}

	function cleanUpMissionsFunc(callback) {
		var i, j, _ = require("lodash");

		ContractsModel.findAll({ attributes: ["MissionId"] }).then(function(contracted_missions) {
			var allContractedMissions = [];
			for (i = contracted_missions.length - 1; i >= 0; i--) { allContractedMissions.push(contracted_missions[i].MissionId); }

			var missionsQuery = {
				where: { expiredField: false },
				attributes: ['id', 'createdAt', 'ConflictId'],
				include: [
					{ model: ObjectivesModel, attributes: ['hourLimitField', 'assetCostField'] },
					{ model: FactionsModel, as: "FactionA", attributes: ['id', 'sideField'] },
					{ model: FactionsModel, as: "FactionB", attributes: ['id', 'sideField'] }
				]
			};

			mainModel.findAll(missionsQuery).then(function(all_missions) {
				var markedAsFailed = { all: [],	BLUFOR: [], OPFOR: [], INDFOR: [] },
					markedAsSucceeded = { BLUFOR: [], OPFOR: [], INDFOR: [] },
					markedForDeletion = [],

					markedConflicts = [],
					factionObjectiveDamage = [];

				for (i = all_missions.length - 1; i >= 0; i--) {
					var cMission = all_missions[i],
					hoursElapsed = API.methods.dateTimeDifference(cMission.createdAt, "hour"),
					overTimeLimit = ((cMission.Objective.hourLimitField - hoursElapsed) <= 0),
					isSigned = API.methods.inArray(cMission.id, allContractedMissions);

					if (overTimeLimit) {
						if (isSigned) {
							var sideA = API.methods.getSideName(cMission.FactionA.sideField),
								sideB = API.methods.getSideName(cMission.FactionB.sideField),
								objectiveCost = cMission.Objective.assetCostField,
								factionFoundIndex = -1,
								factionCostDamage = [cMission.FactionA.id, objectiveCost];

							markedAsFailed[sideA].push(cMission.id);
							markedAsSucceeded[sideB].push(cMission.id);
							markedAsFailed.all.push(cMission.id);

							markedConflicts.push(cMission.ConflictId);

							for (var j = factionObjectiveDamage.length - 1; j >= 0; j--) {
								if (factionObjectiveDamage[j][0] === cMission.FactionA.id) factionFoundIndex = j;
							}

							if (factionFoundIndex > -1) { factionObjectiveDamage[factionFoundIndex][1] += objectiveCost; }
							else { factionObjectiveDamage.push(factionCostDamage); }
						}
						else { markedForDeletion.push(cMission.id); }
					}
				}

				markedConflicts = _.uniq(markedConflicts);

				mainModel.findAll({ where: { "id": markedAsFailed.all }}).then(function(failed_missions) {

					Promise.all(failed_missions.map(function(object) { return object.update({ "expiredField": true }); })).then(function() {

						var failedContractsQuerySide = function(side) {	return { where: { "MissionId": markedAsFailed[side], "sideField": config.enums.sides[side] }}; },
							succeededContractsQuerySide = function(side) {	return { where: { "MissionId": markedAsSucceeded[side], "sideField": config.enums.sides[side] }}; };

						ContractsModel.findAll(failedContractsQuerySide("BLUFOR")).then(function(failed_contracts_BLU) {
						ContractsModel.findAll(failedContractsQuerySide("OPFOR")).then(function(failed_contracts_OP) {
						ContractsModel.findAll(failedContractsQuerySide("INDFOR")).then(function(failed_contracts_IND) {

						ContractsModel.findAll(succeededContractsQuerySide("BLUFOR")).then(function(succeeded_contracts_BLU) {
						ContractsModel.findAll(succeededContractsQuerySide("OPFOR")).then(function(succeeded_contracts_OP) {
						ContractsModel.findAll(succeededContractsQuerySide("INDFOR")).then(function(succeeded_contracts_IND) {

							var all_failed_contracts = _.concat(failed_contracts_BLU, failed_contracts_OP, failed_contracts_IND),
								all_succeeded_contracts = _.concat(succeeded_contracts_BLU, succeeded_contracts_OP, succeeded_contracts_IND);

							Promise.all(all_failed_contracts.map(function(object) {	return object.update({ "statusField": 2 });	})).then(function() {
							Promise.all(all_succeeded_contracts.map(function(object) {	return object.update({ "statusField": 1 });	})).then(function() {

								var ParticipantsModel = require('./../index.js').getModels().participants;

								ParticipantsModel.findAll({ where: { "ConflictId": markedConflicts }}).then(function(participants) {

									Promise.all(participants.map(function(object) {
										var matchedIndex = -1;
										for (i = factionObjectiveDamage.length - 1; i >= 0; i--) { if (factionObjectiveDamage[i][0] === object.FactionId) matchedIndex = i; }
										if (matchedIndex > -1) {
											var totalDamage = (object.deployedAssetsField - factionObjectiveDamage[matchedIndex][1]);
											return object.update({ "deployedAssetsField": totalDamage });
										} else { return true; }
									})).then(function() {
										InterestMethods.cleanUpAllInterest({ MissionId: markedForDeletion }, function() {
											mainModel.destroy({ where: { "id": markedForDeletion } }).then(function() { return callback(); });
										});
									});
								});
							});
							});
						});
						});
						});
						});
						});
						});
					});
				});
			});
		});
	}

	function cleanUpMissions(req, res) {
		cleanUpMissionsFunc(function() {
			API.methods.sendResponse(req, res, true, "Missions have been cleaned.");
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