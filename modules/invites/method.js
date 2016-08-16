(function() {
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		MessagesModel = require('./../index.js').getModels().messages,
		FriendsModel = require('./../index.js').getModels().friends,
		InvitesModel = require('./../index.js').getModels().invites,
		PlayerMethods = require('./../index.js').getMethods().players,
		GeneralMethods = require('./../index.js').getMethods().general_methods,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Invites",
		mainModel = InvitesModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.resolve = resolve;
	exports.getSentPlayer = getSentPlayer;
	exports.getSentPMC = getSentPMC;
	exports.getReceivedPlayer = getReceivedPlayer;
	exports.getReceivedPMC = getReceivedPMC;
	exports.deleteEntry = deleteEntry;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			allowedPostValues: {
			},
			generateWhereQuery:	function(req) {
				var object = {};
				return object;
			}
		};
	}

	function handleInvite(req, res, invite, type, entry, oA, oB, oC, oD, callback) {
		var object = {},
			update = {};

		switch(invite) {
			case 'Request_PlayerPMC': {
				switch(type) {
					case ("log"): { API.methods.doLog(req, config.messages().modules.invites.request_playerPMC); } break;
					case ("data"): { object.value = {a: "Pl", b: "Pm"}; } break;
					case ("cost"): { object.value = 0; } break;
					case ("verbose"): { object.value = "Player request to join a PMC."; } break;
					case ("params"): { object.value = [req.playerInfo.hashField, [!req.playerInfo.PMCId, 'You are already part of a PMC.'], req.body.point_b]; } break;
					case ("params_resolve"): { object.value = req.playerInfo.PMC ? [(req.playerInfo.PMC.hashField == entry.pointB), req.playerInfo.playerTier <= config.privileges().tiers.admin] : [false]; } break;
					case ("results"): { object.value = [oA, oB, [oB.openForApplications, config.messages().modules.pmc.not_open_applications]]; } break;
					case ("query"): { object.value = {where: {'point_a': [req.playerInfo.hashField, req.body.point_b], 'point_b': [req.body.point_b, req.playerInfo.hashField] }}; } break;
					case ("query_resolve"): { object.value = {'point_a': {'hashField': entry.pointA }, 'point_b': {'hashField': (req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123') } }; } break;
					case ("targets"): { object.value = {'point_a': {'hashField': req.playerInfo.hashField }, 'point_b': {'hashField': req.body.point_b } }; } break;
					case ("models"): {
						object.pointA = PlayerModel;
						object.pointB = PMCModel;

						object.pointC = PlayerModel; object.pointD = PlayerModel;
					} break;
					case ("resolve"): {
						return PlayerMethods.playerJoinPMCFunc(req, res, oA.hashField, oB.hashField, function() {
							return callback();
						});
					} break;
				}
			} break;
			case 'Invite_PlayerPMC': {
				switch(type) {
					case ("log"): { API.methods.doLog(req, config.messages().modules.invites.invite_playerPMC); } break;
					case ("data"): { object.value = {a: "Pm", b: "Pc"}; } break;
					case ("cost"): { object.value = 250; } break;
					case ("verbose"): { object.value = "PMC invitation for a player to join their ranks."; } break;
					case ("params"): { object.value = req.playerInfo.PMC ? [[(req.playerInfo.playerTier <= config.privileges().tiers.admin), config.messages().bad_permission], req.playerInfo.PMCId, req.body.point_b] : [[false, 'You are not in a PMC.']]; } break;
					case ("params_resolve"): { object.value = [req.playerInfo.hashField == entry.pointB, [!req.playerInfo.PMCId, config.messages().modules.pmc.self_in_pmc]]; } break;
					case ("results"): { object.value = [oA, oB, [!(oB ? oB.PMCId : null), config.messages().modules.pmc.that_in_pmc]]; } break;
					case ("query"): { object.value = {where: {'point_a': [req.playerInfo.PMC.hashField, req.body.point_b], 'point_b': [req.body.point_b, req.playerInfo.PMC.hashField] }}; } break;
					case ("query_resolve"): { object.value = {'point_a': {'hashField': entry.pointA }, 'point_b': {'hashField': req.playerInfo.hashField } }; } break;
					case ("targets"): { object.value = {'point_a': {'hashField': req.playerInfo.PMC.hashField}, 'point_b': {'hashField': req.body.point_b }}; } break;
					case ("models"): {
						object.pointA = PMCModel;
						object.pointB = PlayerModel;

						object.pointC = PlayerModel; object.pointD = PlayerModel;
					} break;
					case ("resolve"): {
						PlayerMethods.playerJoinPMCFunc(req, res, oB.hashField, oA.hashField, function() {
							return callback();
						});
					} break;
				}
			} break;
			case 'Friends_Player': {
				switch(type) {
					case ("log"): { API.methods.doLog(req, config.messages().modules.invites.friends_player); } break;
					case ("data"): { object.value = {a: "Pl", b: "Pl"}; } break;
					case ("cost"): { object.value = 0; } break;
					case ("verbose"): { object.value = "A friend invitation from a player to another."; } break;
					case ("params"): { object.value = [req.playerInfo.hashField, req.body.point_b, [req.playerInfo.hashField !== req.body.point_b, config.messages().modules.friends.own_self]]; } break;
					case ("params_resolve"): { object.value = [req.playerInfo.hashField == entry.pointB]; } break;
					case ("results"): { object.value = [oA, oB, [!oC, config.messages().modules.friends.already_friends], [!oD, config.messages().modules.friends.already_friends]]; } break;
					case ("query"): { object.value = {where: {'point_a': [req.playerInfo.hashField, req.body.point_b], 'point_b': [req.body.point_b, req.playerInfo.hashField]}}; } break;
					case ("query_resolve"): { object.value = {where:{'point_a': entry.pointA, 'point_b': req.playerInfo.hashField }}; } break;
					case ("targets"): { object.value = {'point_a': {'hashField': req.playerInfo.hashField }, 'point_b': {'hashField': req.body.point_b }, 'point_c': {'friend_a': req.playerInfo.hashField, 'friend_b': req.body.point_b, 'type': 'player'}, 'point_d': {'friend_a': req.body.point_b, 'friend_b': req.playerInfo.hashField, type: 'player'} }; } break;
					case ("models"): {
						object.pointA = PlayerModel;
						object.pointB = PlayerModel;
						object.pointC = FriendsModel;
						object.pointD = FriendsModel;
					} break;
					case ("resolve"): {
						update = {
							friendAHash: entry.pointA,
							friendBHash: entry.pointB,
							friendType: 'player'
						};

						FriendsModel.sync({force: false}).then(function() {
							FriendsModel.create(update).then(function(entry) { return callback(); });
						});
					} break;
				}
			} break;
			case 'Friends_PMC': {
				switch(type) {
					case ("log"): { API.methods.doLog(req, config.messages().modules.invites.Friends_PMC); } break;
					case ("data"): { object.value = {a: "Pm", b: "Pm"}; } break;
					case ("cost"): { object.value = 1000; } break;
					case ("verbose"): { object.value = "A friend invitation from a PMC to another."; } break;
					case ("params"): { object.value = [[req.playerInfo.PMC, config.messages().modules.pmc.not_in_pmc], req.body.point_b, [(req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123') !== req.body.point_b, config.messages().modules.friends.own_pmc], [API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator), config.messages().bad_permission]]; } break;
					case ("params_resolve"): { object.value = [req.playerInfo.PMC, API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator), (req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123') == entry.pointB]; } break;
					case ("results"): { object.value = [oA, oB, [!oC, config.messages().modules.friends.already_friends_pmc], [!oD, config.messages().modules.friends.already_friends_pmc]]; } break;
					case ("query"): { object.value = {where: {'point_a': [req.playerInfo.PMC.hashField, req.body.point_b], 'point_b': [req.body.point_b, req.playerInfo.PMC.hashField]}}; } break;
					case ("query_resolve"): { object.value = {where:{'point_a': entry.pointA, 'point_b': req.playerInfo.PMC.hashField }}; } break;
					case ("targets"): { object.value = {'point_a': {'hashField': req.playerInfo.PMC.hashField }, 'point_b': {'hashField': req.body.point_b }, 'point_c': {'friend_a': req.playerInfo.PMC.hashField, 'friend_b': req.body.point_b, 'type': 'pmc'}, 'point_d': {'friend_a': req.body.point_b, 'friend_b': req.playerInfo.PMC.hashField, type: 'pmc'} }; } break;
					case ("models"): {
						object.pointA = PMCModel;
						object.pointB = PMCModel;
						object.pointC = FriendsModel;
						object.pointD = FriendsModel;
					} break;
					case ("resolve"): {
						update = {
							friendAHash: entry.pointA,
							friendBHash: entry.pointB,
							friendType: 'pmc'
						};

						FriendsModel.sync({force: false}).then(function() {
							FriendsModel.create(update).then(function(entry) { return callback(); });
						});
					} break;
				}
			} break;
			default: {
				switch(type) {
					case ("log"): {	API.methods.doLog(req, config.messages().modules.invites.invalid); } break;
					case ("params"): { object.value = [[false, config.messages().modules.invites.invalid]]; } break;
				}

			}
		}
		return object;
	}

	function post(req, res) {

		if(!API.methods.validate(req, res, [req.body.type])) { return 0; }

		handleInvite(req, res, req.body.type, "log");

		var update = {},
			models = {},
			query = {},
			targets = {},
			validation = {},
			results = {};

		validation = handleInvite(req, res, req.body.type, "params");
		if (!API.methods.validate(req, res, [(Object.keys(validation).length > 0)])) { return 0; }
		if (!API.methods.validate(req, res, validation.value)) { return 0; }

		models = handleInvite(req, res, req.body.type, "models");
		query = handleInvite(req, res, req.body.type, "query");
		targets = handleInvite(req, res, req.body.type, "targets");

		if (!API.methods.validate(req, res, [(Object.keys(models).length > 0)])) { return 0; }
		if (!API.methods.validate(req, res, [(Object.keys(query).length > 0)])) { return 0; }
		if (!API.methods.validate(req, res, [(Object.keys(targets).length > 0)])) { return 0; }

		mainModel.findAll(query.value).then(function(entries) {
			if (!API.methods.validate(req, res, [(entries.length <= 0)], config.messages().duplicate_entry)) { return 0; }

			models.pointA.findOne({where: targets.value.point_a}).then(function(object_A) {
			models.pointB.findOne({where: targets.value.point_b}).then(function(object_B) {
			models.pointC.findOne({where: targets.value.point_c}).then(function(object_C) {
			models.pointD.findOne({where: targets.value.point_d}).then(function(object_D) {

				results = handleInvite(req, res, req.body.type, "results", [], object_A, object_B, object_C, object_D);

				if (!API.methods.validate(req, res, results.value, config.messages().modules.invites.invalid)) { return 0; }

				GeneralMethods.spendFundsGeneralFunc(req, res, handleInvite(req, res, req.body.type, "cost").value, function(done) {
					var update = {};

					if (req.body.type) update.typeField = req.body.type;
					if (req.body.note) update.noteField = req.body.note;

					if (query.value.where.point_a) update.pointA = query.value.where.point_a[0];
					if (query.value.where.point_b) update.pointB = query.value.where.point_b[0];
					if (query.value.where.point_c) update.pointC = query.value.where.point_c[0];
					if (query.value.where.point_d) update.pointD = query.value.where.point_d[0];

					mainModel.sync({force: false}).then(function() {
						mainModel.create(update).then(function(new_entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, new_entry); });
					});
				});
			});
			});
			});
			});
		});
	}

	function resolve(req,res) {

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			handleInvite(req, res, entry.typeField, "log");

			var models = {},
				queryValue = {},
				targets = {},
				validation = {};

			validation = handleInvite(req, res, entry.typeField, "params_resolve", entry);
			if (!API.methods.validate(req, res, validation.value, config.messages().bad_permission)) { return 0; }

			models = handleInvite(req, res, entry.typeField, "models");

			if (!API.methods.validate(req, res, [(Object.keys(models).length > 0)])) { return 0; }

			queryValue = handleInvite(req, res, entry.typeField, "query_resolve", entry);

			models.pointA.findOne({where: queryValue.value.point_a}).then(function(object_A) {
			models.pointB.findOne({where: queryValue.value.point_b}).then(function(object_B) {
			models.pointC.findOne({where: queryValue.value.point_c}).then(function(object_C) {
			models.pointD.findOne({where: queryValue.value.point_d}).then(function(object_D) {

				handleInvite(req, res, entry.typeField, "resolve", entry, object_A, object_B, object_C, object_D, function() {
					entry.destroy({}).then(function() {
						mainModel.sync({force: false}).then(function() {
							API.methods.sendResponse(req, res, true, 'Invite has been successfully resolved.', '');
						});
					});
				});
			});
			});
			});
			});
		});
	}

	function filterInvites(req, res, invites) {
		return invites;
	}

	function getInvitesFunc(req, res, mode, points, done) {
		var INVITES_LIST_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
			pointStrings = "", queryStrings = "", attributesString = "", joinStrings = "", mainStrings = "",
			entity = API.methods.getMainEntity(req),
			finalEntity = ((mode === "pmc") ? entity.entityHash : req.playerInfo.hashField),

			stringParams = [
				{table: 'players_table', prefix: 'Pl', properties: [{property: 'alias', alias: 'Name'}, {property: 'hashField', alias: 'Hash'}]},
				{table: 'pmc_table', prefix: 'Pm', properties: [{property: 'display_name', alias: 'Name'}, {property: 'hashField', alias: 'Hash'}]}
			],
			allPoints = ["A", "B", "C", "D"],
			mainAttributes = ["type", "note", "hashField", "createdAt"]
		;

		for (var i in stringParams) {
			var curI = stringParams[i];
			for (var j in allPoints) {
				for (var h in curI.properties) {
					attributesString +=
						curI.prefix + allPoints[j] + "." + curI.properties[h].property + " AS " +
						allPoints[j] + curI.prefix + "_" + curI.properties[h].alias + ", ";
				}
			}
		}
		attributesString = attributesString = attributesString.slice(0, (attributesString.length - 2)) + " ";

		for (var i in stringParams) {
			for (var j in allPoints) {
				joinStrings +=
					"LEFT JOIN (`" + stringParams[i].table + "` " + stringParams[i].prefix + allPoints[j] + ") ON " +
					"(" + stringParams[i].prefix + allPoints[j] + ".hashField = Inv.point_" + allPoints[j] + ") ";
			}
		}

		for (var i in mainAttributes) { mainStrings += "Inv." + mainAttributes[i] + ", "; }

		var
			queryQ = mainStrings + attributesString + "FROM (`invites_tables` Inv) ",
			joinQ = joinStrings;

		for (var i in points) {
			pointStrings += ("(point_" + points[i] + " = '" + finalEntity + "')");
			if (i < (points.length - 1)) { pointStrings += " OR "; }
		}

		var whereQ = "(" + pointStrings + ") ";

		API.methods.generateRawQuery(req, res, [queryQ, "Inv"], "", joinQ, whereQ, INVITES_LIST_FUNC_QUERY, function(data) {
			var _ = require('lodash');

			for (var i=0; i < data.rows.length; i++) {
				var curD = data.rows[i],
					object = {},
					inviteV = handleInvite(req, res, curD.type, "verbose").value,
					inviteD = handleInvite(req, res, curD.type, "data").value;

				for (var k in Object.keys(inviteD)) {
					var curK = Object.keys(inviteD);

					for (var j in stringParams) {
						var curP = stringParams[j];
						for (var h in curP.properties) {
							for (var x in allPoints) {
								var mP = (curK[k].toUpperCase() + "_" + curP.properties[h].alias),
									tObj = (curD[curK[k].toUpperCase() + inviteD[curK[k]] + "_" + curP.properties[h].alias]);
								object[mP] = tObj;
							}
						}
					}
				}
				object.note = (curD.note || "No message.");
				object.type = (curD.type);
				object.description = inviteV;
				object.hashField = curD.hashField;
				object.sentAt = curD.createdAt;

				data.rows[i] = object;
			}
			for (var i=0; i < data.rows.length; i++) { data.rows[i] = _.omitBy(data.rows[i], _.isNull);	}

			return done(data);
		});
	}

	function getAll(req, res) {
		getInvitesFunc(req, res, "", function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getSentPlayer(req, res) {
		getInvitesFunc(req, res, "player", ["a"],  function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getReceivedPlayer(req, res) {
		getInvitesFunc(req, res, "player", ["b"], function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getSentPMC(req, res) {
		getInvitesFunc(req, res, "pmc", ["a"], function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getReceivedPMC(req, res) {
		getInvitesFunc(req, res, "pmc", ["b"], function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) return 0;

			var isPMC = false,
				isPlayer = (req.playerInfo.hashField == entry.pointA) ||
						   (req.playerInfo.hashField == entry.pointB) ||
						   (req.playerInfo.hashField == entry.pointC) ||
						   (req.playerInfo.hashField == entry.pointD);

			if (req.playerInfo.PMCId) {
				isPMC =    (req.playerInfo.PMC.hashField == entry.pointA) ||
						   (req.playerInfo.PMC.hashField == entry.pointB) ||
						   (req.playerInfo.PMC.hashField == entry.pointC) ||
						   (req.playerInfo.PMC.hashField == entry.pointD);
			}

		   	if (!API.methods.validate(req, res, [(isPlayer || isPMC)], config.messages().bad_permission)) { return 0; }

			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {'hashField': objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var isPMC = false,
				isPlayer = (req.playerInfo.hashField == entry.pointA) ||
						   (req.playerInfo.hashField == entry.pointB) ||
						   (req.playerInfo.hashField == entry.pointC) ||
						   (req.playerInfo.hashField == entry.pointD);

			if (req.playerInfo.PMCId) {
				isPMC =    (req.playerInfo.PMC.hashField == entry.pointA) ||
						   (req.playerInfo.PMC.hashField == entry.pointB) ||
						   (req.playerInfo.PMC.hashField == entry.pointC) ||
						   (req.playerInfo.PMC.hashField == entry.pointD);
			}

		   	if (!API.methods.validate(req, res, [(isPlayer || isPMC)], config.messages().bad_permission)) { return 0; }

			entry.destroy().then(function(rowDeleted) {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();