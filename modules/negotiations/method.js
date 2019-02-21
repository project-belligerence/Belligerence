(function(){
	'use strict';

	var NegotiationsModel = require('./../index.js').getModels().negotiations,
		ContractsModel = require('./../index.js').getModels().contracts,
		ContractsMethods = require('./../index.js').getMethods().contracts,
		MissionsModel = require('./../index.js').getModels().missions,
		ObjectivesModel = require('./../index.js').getModels().objectives,
		FactionsModel = require('./../index.js').getModels().factions,
		MapsModel = require('./../index.js').getModels().maps,
		PlayerModel = require('./../index.js').getModels().players,
		PMCModel = require('./../index.js').getModels().pmc,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Negotiations",
		mainModel = NegotiationsModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.deleteEntry = deleteEntry;
	exports.counterOffer = counterOffer;
	exports.acceptContract = acceptContract;
	exports.getNegotiationsSelf = getNegotiationsSelf;
	exports.getNegotiationsSelfFUNC = getNegotiationsSelfFUNC;
	exports.getNegotiation = getNegotiation;

	exports.countActive = countActive;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'side', 'percent', 'turn', 'OutfitId', 'FreelancerId', 'MissionId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qSide)) { object.side = { $like: "%" + req.query.qSide + "%" }; }
				if (API.methods.isValid(req.query.qPercent)) { object.percent = { $like: "%" + req.query.qPercent + "%" }; }
				if (API.methods.isValid(req.query.qTurn)) { object.turn = { $like: "%" + req.query.qTurn + "%" }; }
				if (API.methods.isValid(req.query.qOutfit)) { object.OutfitId = { $like: "%" + req.query.qOutfit + "%" }; }
				if (API.methods.isValid(req.query.qFreelancer)) { object.FreelancerId = { $like: "%" + req.query.FreelancerB + "%" }; }
				if (API.methods.isValid(req.query.qMission)) { object.MissionId = { $like: "%" + req.query.qMission + "%" }; }

				return object;
			}
		};
	}

	initializeWebsocketEvents();

	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();
		config.websocket.registerEvent("SendNegotiation", WebsocketEvent);
		config.websocket.registerEvent("CancelNegotiation", WebsocketEvent);
	}

	function countActive(req, res) {
		return new Promise(function(resolve, reject) {
			var entity = API.methods.getMainEntity(req),
				whereQuery = { where: {}, attributes: ["turnField"] },
				selfProp = (entity.hasPMC ? "OutfitId" : "FreelancerId");

			whereQuery.where[selfProp] = entity.entityId;

			mainModel.findAll(whereQuery).then(function(entries) {
				var negotiations = { active: 0, waiting: 0 };

				for (var i = entries.length - 1; i >= 0; i--) {
					var cI = entries[i],
						prop = (((entity.hasPMC ? 0 : 1) === cI.turnField) ? "active" : "waiting");
					negotiations[prop]++;
				}
				return resolve(negotiations);
			});
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

	function getNegotiation(req, res) {
		getModel("qOutfit", PMCModel, function(mOutfit) {
			getModel("qFreelancer", PlayerModel, function(mFreelancer) {
				getModel("qMission", MissionsModel, function(mMission) {
					var whereQuery = {
						where: { OutfitId: mOutfit.id, FreelancerId: mFreelancer.id, MissionId: mMission.id	},
						include: [
							{ model: PlayerModel, as: "Freelancer", attributes: ["hashField", "aliasField", "sideField"] },
							{ model: PMCModel, as: "Outfit", attributes: ["hashField", "display_name", "sideField"] },
							{
								model: MissionsModel, as: "Mission",
								attributes: ["hashField", "createdAt", "nameField", "difficultyField", "rewardAField", "rewardBField"],
								include: [
									{ model: ObjectivesModel, as: "Objective", attributes: ["nameField", "iconName", "hourLimitField"] },
									{ model: MapsModel, as: "Map", attributes: ["nameField", "classnameField"] },
									{ model: FactionsModel, as: "FactionA", attributes: ["hashField", "nameField", "sideField"] },
									{ model: FactionsModel, as: "FactionB", attributes: ["hashField", "nameField", "sideField"] }
								]
							},
						]
					};
					mainModel.findOne(whereQuery).then(function(entry) {
						API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
					});
				});
			});
		});

		function getModel(q, model, callback) {
			if (API.methods.isValid(req.query[q])) {
				model.findOne({where: { "hashField": req.query[q] }}).then(function(r) { return callback(r); });
			} else { return callback([]); }
		}
	}

	function getNegotiationsSelf(req, res) {
		getNegotiationsSelfFUNC(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
		});
	}

	function getNegotiationsSelfFUNC(req, res, cb) {
		var entity = API.methods.getMainEntity(req),
			whereQuery = {
				where: {},
				include: [
					{
						model: MissionsModel,
						as: "Mission",
						attributes: ["hashField", "createdAt", "nameField", "difficultyField", "rewardAField", "rewardBField"],
						include: [
							{ model: ObjectivesModel, as: "Objective", attributes: ["nameField", "iconName", "hourLimitField"] },
							{ model: MapsModel, as: "Map", attributes: ["nameField", "classnameField"] },
							{ model: FactionsModel, as: "FactionA", attributes: ["nameField", "sideField", "hashField"] },
							{ model: FactionsModel, as: "FactionB", attributes: ["nameField", "sideField", "hashField"] }
						]
					},
					{
						model: PMCModel, as: "Outfit",
						attributes: ["id", "displaynameField", "hashField", "sideField", "PMCPrestige", "sizeTier"],
						include: [{model: PlayerModel, attributes: ["contractType"] }]
					},
					{
						model: PlayerModel, as: "Freelancer",
						attributes: ["id", "aliasField", "hashField", "sideField", "playerPrestige"]
					}
				]},
			selfProp = (entity.hasPMC ? "OutfitId" : "FreelancerId");

		whereQuery.where[selfProp] = entity.entityId;
		if (req.query.qMission) whereQuery.where.MissionId = req.query.qMission;

		if (req.query.qLast) whereQuery.order = [["updatedAt", "DESC"]];
		if (req.query.qSimpleMode) {
			whereQuery.attributes = ["hashField", "id"];
			whereQuery.include = [];
		}

		mainModel.findAndCountAll(whereQuery).then(function(entries) { return cb(entries); });
	}

	function post(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validate(req, res, [entity.hasPMC], "You must be part of an Outfit to open an Negotiation.")) { return 0; }

		if (entity.hasPMC) var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));

		if (!API.methods.validateParameter(req, res, [
			[[req.body.missionHash, req.body.freelancerHash], 'string'],
			[req.body.percentField, 'number']
		], true)) { return 0; }

		MissionsModel.findOne({ where: { hashField: req.body.missionHash }}).then(function(mission_model) {
		PMCModel.findOne({ where: { hashField: entity.entityHash }}).then(function(outfit_model) {
		PlayerModel.findOne({ where: { hashField: req.body.freelancerHash }}).then(function(freelancer_model) {

			if (!API.methods.validate(req, res,
				[mission_model, outfit_model, freelancer_model],
			config.messages().no_entry)) { return 0; }

			if (!API.methods.validate(req, res,	[freelancer_model.contractType === config.enums.contract.FREELANCER], "The Contracted player is not a Freelancer.")) { return 0; }

			var duplicateNegotiationQuery = {
				where: { 'OutfitId': outfit_model.id, 'FreelancerId': freelancer_model.id, 'MissionId': mission_model.id }
			}, duplicateContractQuery = { where: { 'EmployerId': outfit_model.id, 'MissionId': mission_model.id } };

			mainModel.findOne(duplicateNegotiationQuery).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], "This Negotiation is already ongoing.")) { return 0; }

				ContractsModel.findOne(duplicateContractQuery).then(function(original_contract) {
					if (!API.methods.validate(req, res, [original_contract], "Your Outfit must sign a Contract to this Mission before hiring any Freelancers.")) { return 0; }

					duplicateContractQuery.where.ContractedId = freelancer_model.id;

					ContractsModel.findOne(duplicateContractQuery).then(function(duplicate_contract) {
						if (!API.methods.validate(req, res, [!duplicate_contract], "This Freelancer has already been hired for this Mission.")) { return 0; }

						ContractsMethods.getContractedPercentageFunc(outfit_model.id, mission_model.id, function(percentage) {

							if (!API.methods.validate(req, res,	[API.methods.inArray(freelancer_model.sideField, [config.enums.sides.NEUTRAL, original_contract.sideField])], "The Freelancer has an incompatible Side alignment to this Contract.")) { return 0; }

							var update = {};
							if (API.methods.isValid(req.body.percentField)) update.percentField = API.methods.minMax(1, 100, req.body.percentField);

							if (!API.methods.validate(req, res,	[((percentage + update.percentField) <= 100)], "Cannot sign a Contract for over 100% of the Mission reward.")) { return 0; }

							update.turnField = 1;
							update.sideField = outfit_model.sideField;
							update.OutfitId = outfit_model.id;
							update.FreelancerId = freelancer_model.id;
							update.MissionId = mission_model.id;

							mainModel.sync({force: false}).then(function() {
								mainModel.create(update).then(function(entry) {
									config.websocket.broadcastEvent("SendNegotiation", ["player", freelancer_model.hashField]);
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
	}

	function counterOffer(req, res) {
		var entity = API.methods.getMainEntity(req),
			objectID = req.params.Hash;

		if (!API.methods.validateParameter(req, res, [[req.body.percentField, 'number']], true)) { return 0; }

		if (entity.hasPMC) var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));

		var negotiationQuery = { where: { "hashField": objectID } },
			entityModel = (entity.hasPMC ? "Outfit": "Freelancer");

		negotiationQuery.where[entityModel + "Id"] = entity.entityId;

		negotiationQuery.include = [
			{ model: PMCModel, as: "Outfit", attributes: ["hashField"] },
			{ model: PlayerModel, as: "Freelancer", attributes: ["hashField"] }
		];

		mainModel.findOne(negotiationQuery).then(function(negotiation) {
			if (!API.methods.validate(req, res, [negotiation], config.messages().no_entry)) { return 0; }

			var duplicateContractQuery = { where: { 'EmployerId': negotiation.OutfitId, 'MissionId': negotiation.MissionId, 'ContractedId': null } },
				ownTurn = (entity.hasPMC ? 0 : 1),
				update = {};

			ContractsModel.findOne(duplicateContractQuery).then(function(original_contract) {
				if (!API.methods.validate(req, res, [original_contract], "The Outfit is not signed to this Mission.")) { return 0; }

				if (!API.methods.validate(req, res, [(ownTurn === negotiation.turnField)], "You must wait for your turn before changing the offer.")) { return 0; }
				if (entity.hasPMC) var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));
				if (API.methods.isValid(req.body.percentField)) update.percentField = API.methods.minMax(1, 100, req.body.percentField);

				ContractsMethods.getContractedPercentageFunc(negotiation.OutfitId, negotiation.id, function(percentage) {
					if (!API.methods.validate(req, res,	[((percentage + update.percentField) <= 100)], "Cannot sign a Contract for over 100% of the Mission reward.")) { return 0; }

					update.turnField = ((negotiation.turnField === 1) ? 0 : 1);
					update.roundField = (negotiation.roundField + 1);

					mainModel.sync({force: false}).then(function() {
						negotiation.update(update).then(function(nEntry) {

							var wsModel = ["pmc", "player"][negotiation.turnField],
								wsHash = [negotiation.Outfit.hashField, negotiation.Freelancer.hashField][[negotiation.turnField]];

							config.websocket.broadcastEvent("SendNegotiation", [wsModel, wsHash]);

							API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
						});
					});
				});
			});
		});
	}

	function acceptContract(req, res) {
		var entity = API.methods.getMainEntity(req),
			objectID = req.params.Hash;

		var negotiationQuery = { where: { "hashField": objectID } },
			entityModel = (entity.hasPMC ? "Outfit": "Freelancer");

		negotiationQuery.where[entityModel + "Id"] = entity.entityId;

		mainModel.findOne(negotiationQuery).then(function(negotiation) {
			if (!API.methods.validate(req, res, [negotiation], config.messages().no_entry)) { return 0; }

			var ownTurn = (entity.hasPMC ? 0 : 1), update = {};

			if (!API.methods.validate(req, res, [(ownTurn === negotiation.turnField)], "You must wait for your turn before changing the offer.")) { return 0; }
			if (entity.hasPMC) var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));

			var duplicateContractQuery = { where: { 'EmployerId': negotiation.OutfitId, 'MissionId': negotiation.MissionId, 'ContractedId': null } };

			ContractsModel.findOne(duplicateContractQuery).then(function(original_contract) {
				if (!API.methods.validate(req, res, [original_contract], "The Outfit is not signed to this Mission.")) { return 0; }

				ContractsMethods.getContractedPercentageFunc(negotiation.OutfitId, negotiation.id, function(percentage) {
					if (!API.methods.validate(req, res,	[((percentage + negotiation.percentField) <= 100)], "Cannot sign a Contract for over 100% of the Mission reward.")) { return 0; }

					mainModel.sync({force: false}).then(function() {
						MissionsModel.findOne({ where: { id: negotiation.MissionId }}).then(function(mission_model) {
						PMCModel.findOne({ where: { id: negotiation.OutfitId }}).then(function(outfit_model) {
						PlayerModel.findOne({ where: { id: negotiation.FreelancerId }}).then(function(freelancer_model) {

							var contractParams = {
								sideField: negotiation.sideField,
								percentField: negotiation.percentField,
								EmployerHash: outfit_model.hashField,
								ContractedHash: freelancer_model.hashField,
								MissionHash: mission_model.hashField
							};

							ContractsMethods.addContractFunc(req, res, contractParams, function(contract) {
								PlayerModel.findOne({ where: { id: contract.ContractedId }}).then(function(freelancer) {
									freelancer.update({ sideField: contract.sideField }).then(function() {
										negotiation.destroy().then(function() {
											API.methods.sendResponse(req, res, true, "Contract accepted.", contract);
										});
									});
								});
							}, true);
						});
						});
						});
					});
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({
			where: { "hashField": objectID },
			include: [
				{ model: PlayerModel, as: "Freelancer", attributes: ["hashField"] },
				{ model: PMCModel, as: "Outfit", attributes: ["hashField"] }
			]
		}).then(function(negotiation) {
			if (!API.methods.validate(req, res, [negotiation], config.messages().no_entry)) { return 0; }

			var entity = API.methods.getMainEntity(req),
				negotiation_id = (entity.hasPMC ? negotiation.OutfitId : negotiation.FreelancerId),
				validUnit = (entity.entityId === negotiation_id);

			if (!API.methods.validate(req, res, [validUnit])) { return 0; }
			if (!API.methods.validate(req, res, [(entity.hasPMC ? (negotiation.roundField >= 1) : true)], config.messages().no_entry)) { return 0; }
			if (entity.hasPMC) API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator);

			negotiation.destroy().then(function() {
				var cancelModel = ((entity.entityHash === negotiation.Outfit.hashField) ? "Freelancer" : "Outfit");
				config.websocket.broadcastEvent("CancelNegotiation", [negotiation[cancelModel].hashField]);

				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();