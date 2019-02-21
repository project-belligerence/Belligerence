(function(){
	'use strict';

	var ContractsModel = require('./../index.js').getModels().contracts,
		MissionsModel = require('./../index.js').getModels().missions,
		PlayerModel = require('./../index.js').getModels().players,
		FactionsModel = require('./../index.js').getModels().factions,
		InterestModel = require('./../index.js').getModels().interest,
		MapsModel = require('./../index.js').getModels().maps,
		ObjectivesModel = require('./../index.js').getModels().objectives,
		PMCModel = require('./../index.js').getModels().pmc,
		UpgradesMethods = require('.//../index.js').getMethods().upgrades,
		InterestMethods = require('.//../index.js').getMethods().interest,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Contracts",
		mainModel = ContractsModel;

	exports.post = post;
	exports.addContractFunc = addContractFunc;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.deleteEntry = deleteEntry;
	exports.getContractedPercentage = getContractedPercentage;
	exports.getContractedPercentageFunc = getContractedPercentageFunc;
	exports.getMissionContracts = getMissionContracts;
	exports.getSignedContracts = getSignedContracts;
	exports.getSignedContractsFUNC = getSignedContractsFUNC;
	exports.redeemContract = redeemContract;
	exports.getLastSignedContract = getLastSignedContract;
	exports.countMissionsUnitsFUNC = countMissionsUnitsFUNC;

	exports.countActive = countActive;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'side', 'percent', 'status', 'EmployerId', 'ContractedId', 'MissionId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qSide)) { object.side = { $like: "%" + req.query.qSide + "%" }; }
				if (API.methods.isValid(req.query.qPercent)) { object.percent = { $like: "%" + req.query.qPercent + "%" }; }
				if (API.methods.isValid(req.query.qStatus)) { object.status = { $like: "%" + req.query.qStatus + "%" }; }
				if (API.methods.isValid(req.query.qEmployer)) { object.EmployerId = { $like: "%" + req.query.qEmployer + "%" }; }
				if (API.methods.isValid(req.query.qContracted)) { object.ContractedId = { $like: "%" + req.query.qContracted + "%" }; }
				if (API.methods.isValid(req.query.qMission)) { object.MissionId = { $like: "%" + req.query.qMission + "%" }; }

				return object;
			}
		};
	}

	initializeWebsocketEvents();

	function initializeWebsocketEvents() {
		var WebsocketEvent = new config.websocket.WebsocketEventObject();
		config.websocket.registerEvent("NewContract", WebsocketEvent);
		config.websocket.registerEvent("NewParticipant", WebsocketEvent);
	}

	function countActive(req, res) {
		return new Promise(function(resolve, reject) {
			var entity = API.methods.getMainEntity(req),
				whereQuery = { where: { redeemedField: false }, attributes: ["statusField"] };

			if (entity.hasPMC) {
				Object.assign(whereQuery.where, { EmployerId: entity.entityId });
				Object.assign(whereQuery.where, { ContractedId: null });
			} else {
				Object.assign(whereQuery.where, { ContractedId: entity.entityId });
			}

			mainModel.findAll(whereQuery).then(function(data) {
				var contracts = [0, 0, 0];
				for (var i = data.length - 1; i >= 0; i--) { contracts[data[i].statusField]++; }

				return resolve({
					active: contracts[0],
					completed: contracts[1],
					failed: contracts[2]
				});
			});
		});
	}

	function getContractedPercentage(req, res) {
		PMCModel.findOne({ where: { "hashField": req.query.qEmployer }}).then(function(employer_model) {
			if (!API.methods.validate(req, res, [employer_model], config.messages().no_entry)) { return 0; }

			MissionsModel.findOne({ where: { "hashField": req.query.qMission }}).then(function(mission) {
				if (!API.methods.validate(req, res, [mission], config.messages().no_entry)) { return 0; }

				getContractedPercentageFunc(employer_model.id, mission.id, function(percentage) {
					API.methods.sendResponse(req, res, true, config.messages().return_entries, { percentage: percentage });
				});
			});
		});
	}

	function getContractedPercentageFunc(employer, mission, callback) {
		mainModel.findAll({ where: { "EmployerId": employer, "MissionId": mission, "ContractedId": { $ne: null }}}).then(function(contracts) {
			var totalContractPercentage = 0;
			for (var i = contracts.length - 1; i >= 0; i--) { totalContractPercentage += contracts[i].percentField; }
			return callback(totalContractPercentage);
		});
	}

	function getMissionContracts(req, res) {
		MissionsModel.findOne({ where: { hashField: req.params.Hash }, attributes: ["id"] }).then(function(mission_model) {
			if (!API.methods.validate(req, res, [mission_model], config.messages().no_entry)) { return 0; }

			var entity = API.methods.getMainEntity(req),
				whereQuery = {
					MissionId: mission_model.id,
					statusField: 0
				},
				mainQuery = {
					where: whereQuery,
					include: [
						{
							model: PMCModel, as: "Employer",
							attributes: ["displaynameField", "hashField", "sideField", "PMCPrestige", "sizeTier"],
							include: [{model: PlayerModel, attributes: ["contractType"] }]
						},
						{
							model: PlayerModel, as: "Contracted",
							attributes: ["aliasField", "hashField", "sideField", "playerPrestige"]
						}
					]
				};

			if (req.query.qSimpleMode) mainQuery.attributes = ["hashField", "MissionId", "sideField"];

			mainModel.findAndCountAll(mainQuery).then(function(entries) {
				var pgradesMethods = require('.//../index.js').getMethods().upgrades, i, cI,
					contracts = [], employers = [], contractors = [], entriesRow = API.methods.cloneArray(entries.rows);

				req.query.qIncludeUpgrades = true;

				for (i = entriesRow.length - 1; i >= 0; i--) {
					cI = entriesRow[i];
					if (!(cI.ContractedId)) {
						cI.dataValues.Contractors = [];
						contracts.push(cI.dataValues);
						employers.push(cI.dataValues.Employer.dataValues);
					} else if (cI.percentField < 100) {
						contractors.push(cI.dataValues.Contracted.dataValues);
					}
				}

				UpgradesMethods.handleAssociatedUpgrades(req, res, employers, true).then(function(employer_upgrades) {
					UpgradesMethods.handleAssociatedUpgrades(req, res, contractors, true).then(function(contracted_upgrades) {
						for (i = contracts.length - 1; i >= 0; i--) {
							cI = contracts[i];

							cI.Employer.dataValues.owned_upgrades = employer_upgrades[i];

							for (var j = entriesRow.length - 1; j >= 0; j--) {
								var cJ = entriesRow[j].dataValues;

								if (cJ.ContractedId && (cJ.MissionId === cI.MissionId) && (cI.EmployerId === cJ.EmployerId)) {
									for (var k = contracted_upgrades.length - 1; k >= 0; k--) {
										if (contracted_upgrades[k].length > 0) {
											var cU = contracted_upgrades[k][0].dataValues;
											if (cU.owned_upgrade) {
												if (cJ.ContractedId === cU.owned_upgrade.playerId) cJ.Contracted.dataValues.owned_upgrades = [cU];
											}
										}
									}
									cI.Contractors.push(cJ.Contracted);
								}
							}
						}

						API.methods.sendResponse(req, res, true, config.messages().return_entries, contracts);
					});
				});
			});
		});
	}

	function countMissionsUnitsFUNC(missionsId) {
		return new Promise(function(resolve, reject) {

			var whereQuery = { MissionId: missionsId, statusField: 0 },
				mainQuery = {
					where: whereQuery,
					include: [
						{
							model: MissionsModel, as: "Mission", attributes: ["nameField"],
							include: [
								{ model: FactionsModel, as: "FactionA", attributes: ['sideField'] },
								{ model: FactionsModel, as: "FactionB", attributes: ['sideField'] }
							]
						},
						{
							model: PMCModel, as: "Employer", attributes: ["id", "displaynameField"],
							include: [{ model: PlayerModel, attributes: ["contractType"] }]
						},
						{ model: PlayerModel, as: "Contracted", attributes: ["id"] }
					],
					attributes: ["id", "sideField", "MissionId", "ContractedId", "EmployerId"]
				};

			mainModel.findAndCountAll(mainQuery).then(function(entries) {
				var i, j, cI, entriesRow = API.methods.cloneArray(entries.rows),
					contracts = { a:[], b:[], error: [] };

				for (i = entriesRow.length - 1; i >= 0; i--) {
					cI = entriesRow[i];

					if (!(cI.ContractedId)) {
						var factionSide = matchSide(cI.dataValues.Mission, cI.dataValues);
						contracts[factionSide].push({
							MissionId: cI.dataValues.MissionId,
							EmployerId: cI.dataValues.EmployerId,
							signedUnits: cI.dataValues.Employer.players.length
						});
					}
				}

				for (var keys in contracts) {
					var contractSide = contracts[keys];

					for (i = contractSide.length - 1; i >= 0; i--) {
						cI = contractSide[i];
						for (j = entriesRow.length - 1; j >= 0; j--) {
							var cJ = entriesRow[j].dataValues;
							if (cJ.ContractedId && (cJ.MissionId === cI.MissionId) && (cI.EmployerId === cJ.EmployerId)) {
								contractSide[i].signedUnits++;
							}
						}
					}
				}

				resolve(contracts);
			});
		});
	}

	function matchSide(mission, contract) {
		var sides = ["A", "B"];
		for (var i = sides.length - 1; i >= 0; i--) {
			if (contract.sideField === mission["Faction" + sides[i]].sideField) return sides[i].toLowerCase();
		}
		return "error";
	}

	function getLastSignedContract(req, res) {
		var entity = API.methods.getMainEntity(req),
			whereQuery = { redeemedField: false };

		if (entity.hasPMC) { Object.assign(whereQuery, { EmployerId: entity.entityId }); }
		else { Object.assign(whereQuery, { ContractedId: entity.entityId }); }

		var mainQuery = getGeneralQuery(whereQuery, [["createdAt", "DESC"]]);

		if (req.query.qSimpleMode) mainQuery.attributes = ["hashField", "MissionId", "sideField"];

		mainModel.findOne(mainQuery).then(function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entry);
		});
	}

	function getSignedContracts(req, res) {
		getSignedContractsFUNC(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getSignedContractsFUNC(req, res, cb) {
		var entity = API.methods.getMainEntity(req),
			missionsQuery = {
				where: {
					redeemedField: false
				}, attributes: ["MissionId", "EmployerId"]
			};

		if (entity.hasPMC) {
			Object.assign(missionsQuery.where, { EmployerId: entity.entityId });
			Object.assign(missionsQuery.where, { ContractedId: null });
		} else {
			Object.assign(missionsQuery.where, { ContractedId: entity.entityId });
		}

		mainModel.findAll(missionsQuery).then(function(mission_list) {
			var _ = require("lodash"), i, missionsList = [], employersList = [];

			for (i = mission_list.length - 1; i >= 0; i--) { API.methods.addIfNew(mission_list[i].MissionId, missionsList);	}
			for (i = mission_list.length - 1; i >= 0; i--) { API.methods.addIfNew(mission_list[i].EmployerId, employersList); }

			var whereQuery = {
				MissionId: missionsList,
				EmployerId: employersList
			}, mainQuery = getGeneralQuery(whereQuery);

			if (req.query.qSimpleMode) mainQuery.attributes = ["hashField", "MissionId", "sideField"];

			mainModel.findAndCountAll(mainQuery).then(function(entries) {
				var contracts = [], cI, entriesRow = API.methods.cloneArray(entries.rows);

				for (i = entriesRow.length - 1; i >= 0; i--) {
					cI = entriesRow[i];
					if (!(cI.ContractedId)) {
						cI.dataValues.Contractors = [];
						Object.assign(cI.dataValues, { selfHash: cI.hashField });
						contracts.push(cI.dataValues);
					}
				}

				for (i = contracts.length - 1; i >= 0; i--) {
					cI = contracts[i];
					for (var j = entriesRow.length - 1; j >= 0; j--) {
						var cJ = entriesRow[j].dataValues;
						if ((cJ.id !== cI.id) && (cJ.MissionId === cI.MissionId) && (cJ.EmployerId === cJ.EmployerId)) {
							Object.assign(cJ.Contracted.dataValues, { percentField: cJ.percentField });
							Object.assign(cJ.Contracted.dataValues, { selfHash: cJ.hashField });
							if (entity.entityId === cJ.ContractedId) cI.redeemedField = cJ.redeemedField;
							cI.Contractors.push(cJ.Contracted);
						}
					}
				}

				return cb({ count: contracts.length, rows: contracts });
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

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validateParameter(req, res, [
			[[req.body.MissionHash], 'string'],
			[[req.body.sideField], 'number']
		], true)) { return 0; }

		if (!API.methods.validate(req, res, [entity.hasPMC], "You must be part of an Outfit to sign a Contract.")) { return 0; }

		var params = {
			sideField: ((entity.entitySide > 0) ? entity.entitySide : parseInt(req.body.sideField)),
			EmployerHash: entity.entityHash,
			ContractedHash: req.body.ContractedHash,
			MissionHash: req.body.MissionHash,
			isInterest: (((req.body.roundField || -1) < 0) && req.body.ContractedHash)
		};

		if (!req.body.ContractedHash) params.percentField = 100;

		addContractFunc(req, res, params, function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
		});
	}

	function addContractFunc(req, res, params, callback, ignoreUpgrade) {
		var missionQuery = {
				where: { hashField: params.MissionHash },
				include: [
					ObjectivesModel,
					{ model: FactionsModel, as: 'FactionA' },
					{ model: FactionsModel, as: 'FactionB' }
				]
			},
			outfitQuery = {
				where: { hashField: params.EmployerHash },
				include: [{ model: PlayerModel, attributes: ["contractType"] }]
			};

		if (!ignoreUpgrade) ignoreUpgrade = false;

		MissionsModel.findOne(missionQuery).then(function(mission_model) {
		PMCModel.findOne(outfitQuery).then(function(employer_model) {
		PlayerModel.findOne({ where: { hashField: params.ContractedHash }}).then(function(contracted_model) {

			if (!API.methods.validate(req, res, [mission_model, employer_model], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [(mission_model.expiredField === false)], "This Mission has expired and is no longer available.")) { return 0; }

			var duplicateContractQuery = {
				where: { 'EmployerId': employer_model.id, 'MissionId': mission_model.id, 'statusField': 0 }
			};

			if (params.ContractedHash) {
				if (!API.methods.validate(req, res, [contracted_model],	config.messages().no_entry)) { return 0; }
				duplicateContractQuery.where.ContractedId = contracted_model.id;
			}

			mainModel.findOne(duplicateContractQuery).then(function(contract) {
				if (!API.methods.validate(req, res, [!contract], "This Contract has already been signed.")) { return 0; }

				if (!mission_model.Objective.adversarialField && (params.sideField === mission_model.FactionB.sideField)) {
					if (!API.methods.validate(req, res,	[false], "You may only sign a Contract with the Mission's client.")) { return 0; }
				}

				if (!API.methods.validate(req, res,	[API.methods.inArray(params.sideField, [mission_model.FactionA.sideField, mission_model.FactionB.sideField])], "Invalid Side.")) { return 0; }

				if (params.ContractedHash) {
					if (!API.methods.validate(req, res,	[contracted_model.contractType === config.enums.contract.FREELANCER], "The Contracted player is not a Freelancer.")) { return 0; }
					if (!API.methods.validate(req, res,	[API.methods.inArray(contracted_model.sideField, [config.enums.sides.NEUTRAL, params.sideField])], "The Contracted has an incompatible Side Alignment to this Contract.")) { return 0; }
				}

				if (!API.methods.validate(req, res,	[API.methods.inArray(employer_model.sideField, [config.enums.sides.NEUTRAL, params.sideField])], "The Employer has an incompatible Side alignment to this Contract.")) { return 0; }

				var ContractsMethods = require('.//../index.js').getMethods().contracts;

				ContractsMethods.countMissionsUnitsFUNC([mission_model.id]).then(function(mission_contracts) {
					var missionContracts = { a: 0, b: 0, error: 0 };

					for (var keys in mission_contracts) {
						var curContract = mission_contracts[keys];
						for (var j = curContract.length - 1; j >= 0; j--) {
							if (mission_model.id === curContract[j].MissionId) missionContracts[keys] += curContract[j].signedUnits;
						}
					}

					var matchedSide = matchSide(mission_model, params),
						currentUnits = missionContracts[matchedSide],
						maxUnits = mission_model.Objective.unitLimit,
						newUnits = (params.ContractedHash ? employer_model.players.length : 1),
						isFull = (((maxUnits - currentUnits) - newUnits) < 0);

					if (!API.methods.validate(req, res, [!(isFull)], "The maximum amount of Contractors has been reached.")) { return 0; }

					var clientFaction = null, clientReward = 0, i;

					if (mission_model.FactionA.sideField === params.sideField) { clientFaction = mission_model.FactionA; clientReward = mission_model.rewardAField; }
					if (mission_model.FactionB.sideField === params.sideField) { clientFaction = mission_model.FactionB; clientReward = mission_model.rewardBField; }

					if (!API.methods.validate(req, res,	[clientFaction])) { return 0; }

					var entity = API.methods.getMainEntity(req);

					UpgradesMethods.checkRanksRecursive(req, res, entity, clientFaction.requiredUpgradesField, false, function(whiteRank) {
					UpgradesMethods.checkRanksRecursive(req, res, entity, clientFaction.blacklistedUpgradesField, true, function(blackRank) {

						if (!ignoreUpgrade) {
							if (!API.methods.validate(req, res, [whiteRank[0]], config.messages().modules.upgrades.contract_upgrade_low_rank((whiteRank[1] || 'Unknown'), (whiteRank[2] || 'Unknown'), (whiteRank[3] || 'Unknown')))) { return 0; }
							if (!API.methods.validate(req, res, [blackRank[0]], config.messages().modules.upgrades.contract_upgrade_high_rank((blackRank[1] || 'Unknown'), (blackRank[2] || 'Unknown'), (blackRank[3] || 'Unknown')))) { return 0; }
						}

						getContractedPercentageFunc(employer_model.id, mission_model.id, function(percentage) {

							new Promise(function(resolve, reject) {
								if (params.isInterest) {
									InterestModel.findOne({ where: { MissionId: mission_model.id, PosterId: contracted_model.id } }).then(function(entry) { resolve(entry.percentField); });
								} else { resolve(0); }
							}).then(function(interest_percentage) {
								var update = { 'EmployerId': employer_model.id, 'MissionId': mission_model.id };

								if (params.ContractedHash) update.ContractedId = contracted_model.id;

								if (API.methods.isValid(params.sideField)) update.sideField = params.sideField;
								if (API.methods.isValid(params.percentField)) {
									update.percentField = API.methods.minMax(1, 100, params.percentField);
								} else { update.percentField = API.methods.minMax(1, 100, interest_percentage); }

								if (!API.methods.validate(req, res,	[((percentage + update.percentField) <= 100)], "Cannot sign a Contract for over 100% of the Mission reward.")) { return 0; }

								var _ = require("lodash"),
									GeneralMethods = require('./../index.js').getMethods().general_methods,

									contractFee = _.floor((config.numbers.modules.missions.signatureFee * clientReward) / 100),
									paymentPromise = new Promise(function(resolve, reject) {
										if (params.ContractedHash) { resolve(); } else {
											GeneralMethods.spendFundsGeneralFunc(req, res, contractFee, resolve);
										}
									});

								paymentPromise.then(function() {
									mainModel.sync({force: false}).then(function() {
										employer_model.update({ sideField: params.sideField }).then(function() {
											mainModel.create(update).then(function(entry) {
												var contractedObj = (params.ContractedHash ? contracted_model : { id: -1 });
												InterestMethods.cleanUpInterest(contractedObj, mission_model, function() {

													config.websocket.broadcastEvent("NewContract", [mission_model.hashField]);
													config.websocket.broadcastEvent("NewContract", ["pmc", employer_model.hashField]);
													config.websocket.broadcastEvent("NewParticipant", [mission_model.hashField]);

													if (contracted_model) {
														if (entity.entityHash !== contracted_model.hashField) {
															config.websocket.broadcastEvent("NewContract", ["player", contracted_model.hashField]);
														}
													}

													mainModel.findOne(getGeneralQuery({ id: entry.id })).then(callback);
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

	function redeemContract(req, res) {
		var objectID = req.params.Hash,
			entity = API.methods.getMainEntity(req),
			whereQuery = {
				where: { hashField: objectID, redeemedField: false },
				include: [
					{
						model: MissionsModel, as: "Mission", attributes: ["id", "rewardAField", "rewardBField"],
						include: [
							{ model: ObjectivesModel, as: "Objective", attributes: ["adversarialField"] },
							{ model: FactionsModel, as: "FactionA", attributes: ["sideField"] },
							{ model: FactionsModel, as: "FactionB", attributes: ["sideField"] }
						]
					}
				]
			};

		if (entity.hasPMC) {
			Object.assign(whereQuery.where, { EmployerId: entity.entityId });
			Object.assign(whereQuery.where, { ContractedId: null });
		} else {
			Object.assign(whereQuery.where, { ContractedId: entity.entityId });
		}

		mainModel.findOne(whereQuery).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			switch(entry.statusField) {
				case (0): { API.methods.sendResponse(req, res, false, "You cannot redeem an ongoing Contract."); } break;

				case (1): {
					var missionSide = ((entity.entitySide === entry.Mission.FactionA.sideField) ? "A" : "B"),
						rewardV = ((entry.Mission["reward" + missionSide + "Field"] * entry.percentField) / 100);

					if ((missionSide === "B") && !(entry.Mission.Objective.adversarialField)) rewardV = 0;

					if (!API.methods.validate(req, res, [(rewardV > 0)], config.messages().no_entry)) { return 0; }

					var getReward = new Promise(function(resolve, reject) {
						if (entity.hasPMC) {
							getContractedPercentageFunc(entity.entityId, entry.Mission.id, function(percentage) {
								resolve((rewardV * Math.max((100 - percentage), 1)) / 100);
							});
						} else { resolve(rewardV); }
					});

					getReward.then(function(reward) {
						rewardV = reward;

						entity.entityModel.findOne({ where: { hashField: entity.entityHash }}).then(function(entity_model) {
							entity_model.addFunds(rewardV, function(money) {

								var handleClaimaint = new Promise(function(resolve, reject) {
									switch(entity.entityType) {
										case "pmc": {
											entity_model.update({ missionsWonNum: (entity_model.missionsWonNum + 1) }).then(function() {
												PlayerModel.findAll({ where: { PMCId: entity_model.id } }).then(function(outfit_units) {
													Promise.all(outfit_units.map(function(unit) { return unit.update(getUnitUpdate(unit)); })).then(resolve);
												});
											});
										} break;
										case "player": { entity_model.update(getUnitUpdate(entity_model)).then(resolve); } break;
									}
									function getUnitUpdate(unit) {
										return {
											missionsWonNum: (unit.missionsWonNum + 1),
											networthField: Math.floor((unit.networthField + ((rewardV / 100) * config.numbers.modules.missions.networthPercentage)))
										};
									}
								});

								handleClaimaint.then(function() {
									entry.update({ redeemedField: true }).then(function() {
										mainModel.sync({ force: false }).then(function() {
											API.methods.sendResponse(req, res, true, "Mission completed.", { reward: rewardV });
										});
									});
								});
							});
						});
					});
				} break;

				case (2): {
					entry.update({ redeemedField: true }).then(function() {
						entity.entityModel.findOne({ where: { hashField: entity.entityHash }}).then(function(entity_model) {

							var handleClaimaint = new Promise(function(resolve, reject) {
								switch(entity.entityType) {
									case "pmc": {
										entity_model.update(getUnitUpdate(entity_model)).then(function() {
											PlayerModel.findAll({ where: { PMCId: entity_model.id } }).then(function(outfit_units) {
												Promise.all(outfit_units.map(function(unit) { return unit.update(getUnitUpdate(unit)); })).then(resolve);
											});
										});
									} break;
									case "player": { entity_model.update(getUnitUpdate(entity_model)).then(resolve); } break;
								}
								function getUnitUpdate(unit) { return { missionsFailedNum: (unit.missionsFailedNum + 1) }; }
							});

							handleClaimaint.then(function() { API.methods.sendResponse(req, res, true, "Mission failed."); });
						});
					});
				} break;
			}

			API.methods.validate(req, res, [entry], config.messages().no_entry);

		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash,
			entity = API.methods.getMainEntity(req);

		mainModel.findOne({ where: {"hashField": objectID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var contractMission = entry.MissionId;

			MissionsModel.findOne({ where: { id: contractMission }}).then(function(contract_mission) {
				if (entity.hasPMC) {
					if (!API.methods.validate(req, res, [entity.hasPMC], config.messages().modules.pmc.not_in_pmc)) { return 0; }
					if (!API.methods.validate(req, res, [(entity.entityId === entry.EmployerId)])) { return 0; }

					getContractedPercentageFunc(entry.EmployerId, entry.MissionId, function(percentage) {
						if (!API.methods.validate(req, res, [percentage === 0], "You may not delete a Contract with other units signed.")) { return 0; }

						entry.destroy().then(function() {
							mainModel.findAll({ where: { MissionId: contractMission } }).then(function(pending_contracts) {
								var deleteMission = ((pending_contracts.length === 0) && (contract_mission.expiredField));

								if (deleteMission) { contract_mission.destroy(); }
								else { config.websocket.broadcastEvent("NewParticipant", [contract_mission.hashField]); }

								API.methods.sendResponse(req, res, true, config.messages().entry_deleted, { mission_deleted: deleteMission });
							});
						});
					});
				} else {
					if (!API.methods.validate(req, res, [(req.playerInfo.id === entry.ContractedId)])) { return 0; }

					entry.destroy().then(function() {
						mainModel.findAll({ where: { MissionId: contractMission } }).then(function(pending_contracts) {
							var deleteMission = ((pending_contracts.length === 0) && (contract_mission)),
								deletedMission = contract_mission;

							if (deleteMission) { contract_mission.destroy(); }
							else { config.websocket.broadcastEvent("NewParticipant", [deletedMission.hashField]); }

							API.methods.sendResponse(req, res, true, config.messages().entry_deleted, { mission_deleted: deleteMission });
						});
					});
				}
			});

		});
	}

	function getGeneralQuery(where, order) {
		var mainQuery = {
			include: [
				{
					model: MissionsModel, as: "Mission",
					attributes: ["hashField", "nameField", "difficultyField", "rewardAField", "rewardBField", "createdAt"],
					include: [
						{ model: ObjectivesModel, as: "Objective", attributes: ["nameField", "iconName", "hourLimitField"] },
						{ model: MapsModel, as: "Map", attributes: ["nameField", "classnameField"] },
						{ model: FactionsModel, as: "FactionA", attributes: ["hashField", "nameField", "sideField"] },
						{ model: FactionsModel, as: "FactionB", attributes: ["hashField", "nameField", "sideField"] }
					]
				},
				{
					model: PMCModel, as: "Employer",
					attributes: ["displaynameField", "hashField", "sideField", "PMCPrestige", "sizeTier"],
					include: [{ model: PlayerModel, attributes: ["contractType"] }]
				},
				{
					model: PlayerModel, as: "Contracted",
					attributes: ["aliasField", "hashField", "sideField", "playerPrestige"]
				}
			]
		};

		if (where) mainQuery.where = where;
		if (order) mainQuery.order = order;

		return mainQuery;
	}

})();