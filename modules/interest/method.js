(function(){
	'use strict';

	var InterestModel = require('./../index.js').getModels().interest,
		ContractsModel = require('./../index.js').getModels().contracts,
		MissionsModel = require('./../index.js').getModels().missions,
		UpgradesModel = require('./../index.js').getModels().upgrades,
		PlayerModel = require('./../index.js').getModels().players,
		FactionsModel = require('./../index.js').getModels().factions,
		ObjectivesModel = require('./../index.js').getModels().objectives,
		MapsModel = require('./../index.js').getModels().maps,
		UpgradesMethods = require('.//../index.js').getMethods().upgrades,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Interest",
		mainModel = InterestModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.deleteEntry = deleteEntry;
	exports.cleanUpInterest = cleanUpInterest;
	exports.cleanUpAllInterest = cleanUpAllInterest;
	exports.getMarkedInterests = getMarkedInterests;
	exports.getInterestedPlayers = getInterestedPlayers;
	exports.getMarkedInterestsFUNC = getMarkedInterestsFUNC;

	exports.countActive = countActive;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'side', 'percent', 'PosterId', 'MissionId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qSide)) { object.side = { $like: "%" + req.query.qSide + "%" }; }
				if (API.methods.isValid(req.query.qPercent)) { object.percent = { $like: "%" + req.query.qPercent + "%" }; }
				if (API.methods.isValid(req.query.qContracted)) { object.ContractedId = { $like: "%" + req.query.qContracted + "%" }; }
				if (API.methods.isValid(req.query.qMission)) { object.MissionId = { $like: "%" + req.query.qMission + "%" }; }

				return object;
			}
		};
	}

	initializeWebsocketEvents();

	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();
		config.websocket.registerEvent("NewParticipant", WebsocketEvent);
	}

	function countActive(req, res) {
		return new Promise(function(resolve, reject) {
			var playerId = (req.playerInfo.id || -1),
				queryInfo = { where: { PosterId: playerId }	};
			mainModel.count(queryInfo).then(function(count) { resolve({ active: count }); });
		});
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getLimited(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getInterestedPlayers(req, res) {
		MissionsModel.findOne({ where: { hashField: req.params.Hash, expiredField: false }}).then(function(mission) {
			if (!API.methods.validate(req, res, [mission],	config.messages().no_entry)) { return 0; }

			var queryInfo = {
				where: { MissionId: mission.id },
				attributes: ["createdAt", "percentField", "sideField", "PosterId"],
				include: [{
					model: PlayerModel, as: "Poster", order: "prestige",
					attributes: ["aliasField", "hashField", "playerPrestige", "sideField"]
				}]
			};

			mainModel.findAndCountAll(queryInfo).then(function(entries) {
				req.query.qIncludeUpgrades = true;

				var posterList = [], i;
				for (i = entries.rows.length - 1; i >= 0; i--) { posterList.push(entries.rows[i].Poster); }

				UpgradesMethods.handleAssociatedUpgrades(req, res, posterList).then(function(handledUpgrades) {
					for (i = entries.rows.length - 1; i >= 0; i--) {
						var cPoster = entries.rows[i];
						for (var k = handledUpgrades.length - 1; k >= 0; k--) {
							if (handledUpgrades[k][0]) {
								var cUpgrade = handledUpgrades[k][0].dataValues;
								if (cPoster.PosterId === cUpgrade.owned_upgrade.playerId) {
									entries.rows[i].dataValues.owned_upgrades = [cUpgrade];
								}
							}
						}
					}
					API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
				});
			});
		});
	}

	function getMarkedInterests(req, res) {
		getMarkedInterestsFUNC(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getMarkedInterestsFUNC(req, res, cb) {
		var playerId = (req.playerInfo.id || -1),
			queryInfo = {
				where: { PosterId: playerId },
				attributes: ["hashField", "PosterId", "MissionId", "sideField", "percentField"],
				include: [
					{ model: PlayerModel, as: "Poster", attributes: ["id", "aliasField", "hashField", "sideField", "playerPrestige"] },
					{
						model: MissionsModel,
						as: "Mission",
						attributes: ["hashField", "createdAt", "nameField", "difficultyField", "rewardAField", "rewardBField"],
						include: [
							{ model: ObjectivesModel, as: "Objective", attributes: ["nameField", "iconName", "hourLimitField"] },
							{ model: MapsModel, as: "Map", attributes: ["classnameField"] },
							{ model: FactionsModel, as: "FactionA", attributes: ["hashField", "nameField", "sideField"] },
							{ model: FactionsModel, as: "FactionB", attributes: ["hashField", "nameField", "sideField"] }
						]
					},
				]
			};

		if (req.query.qSimpleMode) {
			queryInfo.attributes = ["hashField", "id"];
			queryInfo.include = [];
		}

		mainModel.findAndCountAll(queryInfo).then(function(entries) { return cb(entries); });
	}

	function cleanUpInterest(freelancer, mission, callback) {
		mainModel.findOne({ where: { PosterId: freelancer.id, MissionId: mission.id }}).then(function(interest) {
			if (interest) interest.destroy();
			return callback(true);
		});
	}

	function cleanUpAllInterest(param, callback) {
		mainModel.findAll({ where: param }).then(function(interests) {
			Promise.all(interests.map(function(object) { object.destroy(); })).then(function() {
				new Promise(function(resolve, reject) {
					if (!param.PosterId) resolve(true);

					var whereQueryNegotiations = { where: { FreelancerId: param.PosterId }},
						NegotiationsModel = require('./../index.js').getModels().negotiations;

					NegotiationsModel.findAll(whereQueryNegotiations).then(function(negs) {
						Promise.all(negs.map(function(object) { object.destroy(); })).then(resolve);
					});
				}).then(callback);

				return callback();
			});
		});
	}

	function post(req, res) {
		var entity = API.methods.getMainEntity(req);
		if (!API.methods.validate(req, res, [!entity.hasPMC], "Only Freelancers can display interest in a Mission.")) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[[req.body.missionHash], 'string'],
			[[req.body.sideField, req.body.percentField], 'number']
		], true)) { return 0; }

		MissionsModel.findOne({ where: { hashField: req.body.missionHash, expiredField: false }}).then(function(mission) {
			if (!API.methods.validate(req, res, [mission],	config.messages().no_entry)) { return 0; }

			var params = {
				sideField: ((entity.entitySide > 0) ? entity.entitySide : parseInt(req.body.sideField)),
				PosterId: entity.entityId,
				MissionId: mission.id
			};

			mainModel.findOne({ where: params }).then(function(existing) {
				var targetObject = (existing ? existing : mainModel),
					targetFunc = (existing ? "update" : "create");

				params.percentField = API.methods.minMax(1, 100, (req.body.percentField || 1));

				mainModel.sync({force: false}).then(function() {
					targetObject[targetFunc](params).then(function(entry) {
						config.websocket.broadcastEvent("NewParticipant", [mission.hashField]);
						API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
					});
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash,
			entity = API.methods.getMainEntity(req);

		MissionsModel.findOne({ where: { hashField: objectID }, attributes: ["id", "hashField"]}).then(function(mission) {
			if (!API.methods.validate(req, res, [mission],	config.messages().no_entry)) { return 0; }

			mainModel.findOne({ where: { MissionId: mission.id, PosterId: entity.entityId }}).then(function(interest) {
				if (!API.methods.validate(req, res, [interest],	config.messages().no_entry)) { return 0; }
				if (!API.methods.validate(req, res, [(interest.PosterId === entity.entityId)], config.messages().bad_permission)) { return 0; }

				interest.destroy().then(function() {
					config.websocket.broadcastEvent("NewParticipant", [mission.hashField]);
					API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
				});
			});
		});
	}

})();