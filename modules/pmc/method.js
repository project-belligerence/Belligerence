(function(){
	'use strict';
	/* jshint laxcomma: true */

	var PlayerModel = require('./../index.js').getModels().players,
		PMCModel = require('./../index.js').getModels().pmc,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.newPMC = newPMC;
	exports.getAllPMC = getAllPMC;
	exports.getPMCFunc = getPMCFunc;
	exports.getPMC = getPMC;
	exports.getSelf = getSelf;
	exports.putPMCFunc = putPMCFunc;
	exports.putSelfPMC = putSelfPMC;
	exports.proDemoteMember = proDemoteMember;
	exports.transferPMCOwnership = transferPMCOwnership;
	exports.transferPMCOwnershipFunc= transferPMCOwnershipFunc;
	exports.putPMC = putPMC;
	exports.getPMCPlayers = getPMCPlayers;
	exports.getSelfPMCPlayers = getSelfPMCPlayers;
	exports.getPMCPlayersFunc = getPMCPlayersFunc;
	exports.kickMember = kickMember;
	exports.disbandPMC = disbandPMC;
	exports.upgradePMCSize = upgradePMCSize;
	exports.startPMC = startPMC;
	exports.getVisibility = getVisibility;
	exports.getPMCTiers = getPMCTiers;
	exports.getPMCSizeCost = getPMCSizeCost;

	function queryValues(req) {
		var GeneralMethods = require('./../index.js').getMethods().general_methods,
			_ = require("lodash");

		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'totalPlayers', 'totalComments', 'display_name', 'location', 'prestige', 'size'],
			allowedPostValues: {
				privateFieldsValues: ["freelancers", "ownPMC", "allPMC", "friends-PMC", "everyone", "nobody"],
				locationValues: _.range(GeneralMethods.getRegionsFunc().length)
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (!req.query.SINGLE_MODE) {
					if (req.query.qName) { object.display_name = { $like: "%" + req.query.qName + "%" }; }
					if (req.query.qLocation) { object.location = { $like: "%" + req.query.qLocation + "%" }; }
					if (req.query.qTags) { object.tags = { $dliteral: API.methods.generateRegexp("tags", req.query.qTags) }; }
					if ((req.query.qPrestigeMin) || (req.query.qPrestigeMax)) { object.prestige = { $between: [(parseInt(req.query.qPrestigeMin) || 0), (parseInt(req.query.qPrestigeMax) || 9999999)]}; }
					if (req.query.qOpen) { object.open_applications = { $like: "%" + req.query.qOpen + "%" }; object.having = { $having: "(totalPlayers < size) AND (totalPlayers > 0)" }; }
					else {
						if (!req.query.GET_PROPERTY) { object.having = { $having: "totalPlayers > 0" }; }
					}
				}
				return object;
			}
		};
	}

	function getVisibility(req, settings, pmc) {
		var pmc_values = pmc,
			allowRead = false,
			friendList = {};

		switch(settings) {
			case "freelancers": {
				allowRead = (req.playerInfo.contractType === 2);
			} break;
			case "ownPMC": {
				if (req.playerInfo.PMC) {
					allowRead = (req.playerInfo.PMC.hashField == (pmc_values.hashField));
				} else { allowRead = false; }
			} break;
			case "allPMC": {
				allowRead = (req.playerInfo.PMCId || false);
			} break;
			case "friends-PMC": {
				friendList = req.playerInfo.friendsList;
				for (var j in friendList) {
					if ((friendList[j].friendAHash === (pmc_values.hashField)) || (friendList[j].friendBHash === (pmc_values.hashField))) { allowRead = true; }
				}
			} break;
			case "everyone": {
				allowRead = true;
			} break;
			case "nobody": {
				allowRead = false;
			} break;
		}
		if (req.playerInfo.PMC) { if (req.playerInfo.PMC.hashField == pmc_values.hashField) { allowRead = true; } }

		return allowRead;
	}

	function filterPMC(req, pmc) {
		var _ = require('lodash');

		for (var i in pmc.rows) {
			var
				allowRead = false,
				pmc_values = pmc.rows[i],
				friendList = {}
			;

			if (req.query.ALL_PMC_MODE) {
				pmc_values.bio = API.methods.limitString(pmc_values.bio, config.numbers.modules.intel.bodyLength, config.specialStrings.abbreviator);
			}

			allowRead = getVisibility(req, pmc_values.private_visibility, pmc);

			req.query.ADMIN_MODE = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin));

			var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));

			pmc_values.private_fields = API.methods.getPseudoArray(pmc_values.private_fields);
			pmc_values.tier_names = API.methods.getPseudoArray(pmc_values.tier_names);
			pmc_values.tags = API.methods.getPseudoArray(pmc_values.tags);
			pmc_values.colors = API.methods.getPseudoArray(pmc_values.colors);

			pmc_values.hideComments = false;
			pmc_values.blockComments = false;
			pmc_values.blockInvites = false;
			pmc_values.blockUpgrades = false;
			pmc_values.hideUnits = false;

			if (!(req.query.ADMIN_MODE) && (pmc_values.hashField !== (req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123'))) {
				if (allowRead === false) {
					pmc_values = _.omit(pmc_values, pmc_values.private_fields);

					if (_.indexOf(pmc_values.private_fields, 'hideComments') > -1) {
						pmc_values = _.omit(pmc_values, 'comments');
						pmc_values = _.omit(pmc_values, 'totalComments');
						pmc_values.hideComments = true;
					}

					pmc_values.blockComments = (_.indexOf(pmc_values.private_fields, 'blockComments') > -1);
					pmc_values.blockInvites = (_.indexOf(pmc_values.private_fields, 'blockInvites') > -1);
					pmc_values.blockUpgrades = (_.indexOf(pmc_values.private_fields, 'blockUpgrades') > -1);
					pmc_values.hideUnits = (_.indexOf(pmc_values.private_fields, 'hideUnits') > -1);

					if (pmc_values.blockUpgrades) delete pmc_values.owned_upgrades;
				}
				pmc_values = _.omit(pmc_values, PMCModel.blacklistProperties('query', 'user'));
			}

			pmc.rows[i] = pmc_values;
		}
		return pmc;
	}

	function getPMCFunc(req, res, hash, callback) {
		var FriendsMethods = require('./../index.js').getMethods().friends,
			cachedSort = (req.query.sort || "createdAt");
		req.query.sort = "createdAt";

		FriendsMethods.getFriendsPMCReadFunc(req, res, function(friendsList) {
			req.playerInfo.friendsList = friendsList.rows;
			req.query.sort = cachedSort;

			var QueryTable = "pmc_table",
				newQuery = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
				queryWhere = (hash === "1") ? "1" : ("pmc_table.hashField = '" + hash + "'"),
				filterMainTable = "*, ",
				filterCount = 	"(SELECT COUNT(players_table.hashField) FROM `players_table` WHERE players_table.PMCId = pmc_table.id) AS totalPlayers " +
								", (SELECT COUNT(*) FROM `comments_tables`" +
							 	"WHERE comments_tables.subjectField = " + QueryTable + ".hashField" +
								") AS totalComments",
				filterQuery = req.query.COUNT_ONLY ? filterCount : (filterMainTable + filterCount);

				filterQuery = req.query.GET_TIERS ? "`tier_names`" : filterQuery;

			API.methods.generateRawQuery(req, res,
				QueryTable,
				filterQuery,
				"",
				queryWhere,
				newQuery,
			function(data) {
				if (data.rows.length > 0) {
					var UpgradesMethods = require('.//../index.js').getMethods().upgrades;

					UpgradesMethods.handleAssociatedUpgrades(req, res, data.rows).then(function(handledUpgrades) {
						if (req.query.SINGLE_MODE) {
							var CommentsMethods = require('./../index.js').getMethods().comments;
							CommentsMethods.getEntityComments(req, res, "pmc_table", data.rows[0].hashField, function(comments) {
								data.rows[0].comments = comments;
								return callback(filterPMC(req, data));
							});
						} else { return callback(filterPMC(req, data)); }
					});
				} else { return callback(filterPMC(req, data)); }
			});
		});
	}

	function getAllPMC(req, res) {
		req.query.ALL_PMC_MODE = true;
		req.serverValues = {};
		req.serverValues.contextLimit = 8;
		getPMCFunc(req, res, "1", function(entries){
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
		});
	}

	function getPMC(req, res) {
		req.query.SINGLE_MODE = true;
		getPMCFunc(req, res, req.params.Hash, function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getSelf(req, res) {
		req.query.SINGLE_MODE = true;
		getPMCFunc(req, res, req.playerInfo.PMC.hashField, function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getPMCPlayers(req, res) {
		getPMCPlayersFunc(req, res, req.params.Hash, function(players) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, players);
		});
	}

	function getPMCTiers(req, res) {
		req.query.GET_PROPERTY = true;
		req.query.GET_TIERS = true;

		getPMCFunc(req, res, req.params.Hash, function(tiers) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, tiers);
		});
	}

	function getSelfPMCPlayers(req, res) {
		var entity = API.methods.getMainEntity(req);
		getPMCPlayersFunc(req, res, entity.entityHash, function(players) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, players);
		});
	}

	function getPMCPlayersFunc(req, res, hash, callback) {
		req.serverValues = {};
		req.serverValues.contextLimit = 20;

		PMCModel.findOne({where:{hashField: hash}}).then(function(entry) {
			if(!API.methods.validate(req, res, [entry])) { return 0; }
			var PlayerMethods = require('./../index.js').getMethods().players;
			req.query.PMC_PLAYERS_QUERY = true;
			PlayerMethods.getPlayerFunc(req, res, entry.id, function(data) {
				return callback(data);
			});
		});
	}

	function startPMC(req, res) {
		var entity = API.methods.getMainEntity(req);

		if(!API.methods.validate(req, res, [!(entity.hasPMC)], config.messages().modules.pmc.self_in_pmc)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.displayname, 'string', config.numbers.modules.pmc.displaynameLength],
			[req.body.motto, 'string', config.numbers.modules.pmc.mottoLength]
		], true)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.bio, 'string', config.numbers.modules.players.bioLength],
			[req.body.location, 'number', queryValues(req).allowedPostValues.locationValues],
			[req.body.visibility, 'string', queryValues(req).allowedPostValues.privateFieldsValues],
			[req.body.open_applications, 'boolean']
		])) { return 0; }

		entity.entityModel.findOne({where: {hashField: entity.entityHash}}).then(function(player) {
			if(!API.methods.validate(req, res, [(player.contractType !== config.enums.contract.FREELANCER)], config.messages().modules.players.freelancer_cant_create_pmc)) { return 0; }

			var
				update = {},
				_ = require('lodash'),
				currentTagProperties = [],
				filteredTagProperties = [],
				currentProperties = [],
				validPublicProperties = PMCModel.whitelistProperties('query', 'user'),
				filteredProperties = []
			;

			if (API.methods.isValid(req.body.displayname)) update.displaynameField = req.body.displayname;
			if (API.methods.isValid(req.body.motto)) update.mottoField = req.body.motto;
			if (API.methods.isValid(req.body.bio)) update.bioField = req.body.bio;
			if (API.methods.isValid(req.body.location)) update.locationField = req.body.location;
			if (API.methods.isValid(req.body.visibility)) update.privateVisibility = req.body.visibility;
			if (API.methods.isValid(req.body.open_applications)) update.openForApplications = req.body.open_applications;
			if (API.methods.isValid(req.body.colors)) update.colorsField = req.body.colors;

			if (API.methods.isValid(req.body.tags)) {
				update.tagsField = (req.body.tags || []);
			} else { update.tagsField = []; }

			update.tierNameFields = ['CEO','Commander', 'Officer', 'Sargeant', 'Soldier'];

			update.privateFields = PMCModel.blacklistProperties('creation', 'user');

			PMCModel.sync({force: false}).then(function() {
				PMCModel.create(update).then(function(entry) {
					if (!API.methods.validate(req, res, [entry], "ERROR")) { return 0; }

					entry.addPlayer(player).then(function() {
						player.update({
							playerTier: config.privileges().tiers.owner,
							currentFunds: 0,
							contractType: config.enums.contract.COMMANDER,
							playerPrestige: 0
						}).then(function(nPlayer) {
							API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
						});
					});
				});
			});
		});
	}

	function newPMC(req, res) {

		if(!API.methods.validate(req, res, [req.body.displayname])) { return 0; }
		if(!API.methods.validate(req, res, [((!req.playerInfo.PMCId) || (req.playerInfo.playerPrivilege <= config.privileges().tiers.admin))], 'You are already part of a PMC.')) { return 0; }

		var update = {};

		if (req.body.displayname) update.displaynameField = req.body.displayname;
		if (req.body.motto) update.mottoField = req.body.motto;
		if (req.body.tiernames) update.tierNamesField = req.body.tiernames; // array of 5 indexes
		if (req.body.tags) update.tagsField = (req.body.tags || []);
		if (req.body.location) update.locationField = req.body.location;
		if (req.body.colors) update.colorsField = req.body.colors;

		PMCModel.sync({force: false}).then(function() {
			PMCModel.create(update).then(function(entry) {
				API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
			});
		});
	}

	function putPMC(req, res) {
		putPMCFunc(req, res, req.params.Hash, function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
		});
	}

	function putSelfPMC(req, res) {
		var entity = API.methods.getMainEntity(req);

		putPMCFunc(req, res, entity.entityHash, function(entry) {
			API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
		});
	}

	function putPMCFunc(req, res, hashField, callback) {
		if (req.body.open_applications !== undefined) { req.body.open_applications = API.methods.boolToString(req.body.open_applications); }

		if (!API.methods.validateParameter(req, res, [[hashField, 'string']])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.displayname, 'string', config.numbers.modules.pmc.displaynameLength],
			[req.body.motto, 'string', config.numbers.modules.pmc.mottoLength],
			[req.body.bio, 'string', config.numbers.modules.players.bioLength],
			[req.body.location, 'number', queryValues(req).allowedPostValues.locationValues],
			[req.body.visibility, 'string', queryValues(req).allowedPostValues.privateFieldsValues],
			[[req.body.colors], 'array'],
			[req.body.open_applications, 'boolean']
		])) { return 0; }

		PMCModel.findOne({where:{'hashField': hashField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(hashField))) { return 0; }

			PMCModel.findOne( {where:{'displaynameField': (req.body.pmcname || '123456789abcdefg')}} ).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists('display name'))) { return 0; }

				var
					_ = require('lodash'),
					currentTagProperties = entry.tagsField,
					filteredTagProperties = entry.tagsField,
					currentProperties = entry.privateFields,
					validPublicProperties = PMCModel.whitelistProperties('query', 'user'),
					filteredProperties = entry.privateFields
				;

				if (req.body.add_tags) {
					if (!API.methods.validateParameter(req, res, [[[req.body.add_tags], 'array']])) { return 0; }
					if (!API.methods.validateParameter(req, res, [[req.body.add_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

					filteredTagProperties = (_.union(currentTagProperties, req.body.add_tags));
					if (!API.methods.validate(req, res, [(filteredTagProperties .length <= config.numbers.general.tagsLimit)], config.messages().modules.tags.tooMany)) { return 0; }
				}

				if (req.body.properties) {
					if (!API.methods.validateParameter(req, res, [[req.body.properties, PMCModel.whitelistProperties('query', 'user')]])) { return 0; }
					filteredProperties = _.uniq(req.body.properties, validPublicProperties);
				}

				var update = {};

				if (req.body.displayname) update.displaynameField = req.body.displayname;
				if (req.body.motto) update.mottoField = req.body.motto;
				if (req.body.bio) update.bioField = req.body.bio;
				if (req.body.tags) update.tagsField = (req.body.tags || []);
				if (req.body.location) update.locationField = req.body.location;
				if (req.body.visibility) update.privateVisibility = req.body.visibility;
				if (req.body.open_applications) update.openForApplications = req.body.open_applications;
				if (req.body.colors) update.colorsField = req.body.colors;

				if ((req.body.add_tags) || (req.body.remove_tags)) update.tagsField = filteredTagProperties;
				if ((req.body.properties) || (req.body.remove_properties)) update.privateFields = filteredProperties;

				if (req.body.tierNames) {
					if (!API.methods.validate(req, res, [req.body.tierNames.length === 5])) { return 0; }

					if (!API.methods.validateParameter(req, res, [
						[req.body.tierNames, 'string', [1, (config.numbers.modules.pmc.tierLength * 2)]]
					])) { return 0; }

					update.tierNameFields = req.body.tierNames;
				}

				entry.update(update).then(function(rEntry) {
					PMCModel.sync({force: false}).then(function() {
						return callback(rEntry);
					});
				});
			});
		});
	}

	function proDemoteMember(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validateParameter(req, res, [
			[req.body.member, 'string'],
			[req.body.tier, 'number', config.privileges().tiers.all()]
		])) { return 0; }

		if (!API.methods.validate(req, res, [req.body.member !== req.playerInfo.hashField])) { return 0; }

		PlayerModel.findOne({where: {hashField: req.playerInfo.hashField}}).then(function(caller) {
			if (!API.methods.validate(req, res, [caller])) { return 0; }
			PlayerModel.findOne({where: {hashField: req.body.member, PMCId: caller.PMCId}}).then(function(member) {
				if (!API.methods.validate(req, res, [member])) { return 0; }

				if (!API.methods.validate(req, res, [member.PMCId === caller.PMCId], config.messages().bad_permission)) { return 0; }
				if (!API.methods.validate(req, res, [member.playerTier > caller.playerTier], config.messages().bad_permission)) { return 0; }
				if (!API.methods.validate(req, res, [req.body.tier > caller.playerTier], config.messages().bad_permission)) { return 0; }

				var gotPromoted = (member.playerTier >= req.body.tier);

				member.update({playerTier: req.body.tier}).then(function(){
					API.methods.sendResponse(req, res, true, config.messages().modules.pmc.tier_changed(gotPromoted));
				});
			});
		});
	}

	function kickMember(req, res) {
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validateParameter(req, res, [[req.body.member, 'string']])) { return 0; }

		PlayerModel.findOne({where: {hashField: req.playerInfo.hashField}}).then(function(caller) {
			if (!API.methods.validate(req, res, [caller])) { return 0; }
			PlayerModel.findOne({where: {hashField: req.body.member}}).then(function(member) {
				if (!API.methods.validate(req, res, [member])) { return 0; }

				if (!API.methods.validate(req, res, [
					(req.body.member !== caller.hashField),
					(member.PMCId === caller.PMCId),
					(member.playerTier > caller.playerTier)
				], config.messages().bad_permission)) { return 0; }

				var PlayerMethods = require('./../index.js').getMethods().players;

				PlayerMethods.playerLeavePMCFunc(req, res, member.hashField, function(nPlayer) {
					API.methods.sendResponse(req, res, true, config.messages().modules.pmc.was_kicked);
				});
			});
		});
	}

	function transferPMCOwnership(req, res) {
		transferPMCOwnershipFunc(req, res, req.body.member, function(ownerAlias){
			API.methods.sendResponse(req, res, true, config.messages().modules.pmc.now_leader(ownerAlias));
		});
	}

	function transferPMCOwnershipFunc(req, res, memberHash, callback) {
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validateParameter(req, res, [[memberHash, 'string']])) { return 0; }
		if (!API.methods.validate(req, res, [memberHash !== req.playerInfo.hashField])) { return 0; }

		PlayerModel.findOne({where: {hashField: req.playerInfo.hashField}}).then(function(caller) {
			if (!API.methods.validate(req, res, [caller])) { return 0; }
			PlayerModel.findOne({where: {hashField: memberHash, PMCId: caller.PMCId}}).then(function(member) {
				if (!API.methods.validate(req, res, [member])) { return 0; }

				if (!API.methods.validate(req, res, [member.PMCId === caller.PMCId], config.messages().bad_permission)) { return 0; }
				// if (!API.methods.validate(req, res, [member.playerTier === config.privileges().tiers.admin], config.messages().modules.pmc.higher_tier_req)) { return 0; }

				var memberUpdate = {
					playerTier: config.privileges().tiers.owner,
					contractType: config.enums.contract.COMMANDER
				},
					callerUpdate = {
					playerTier: config.privileges().tiers.admin,
					contractType: config.enums.contract.SOLDIER
				};

				member.update(memberUpdate).then(function() {
					caller.update(callerUpdate).then(function() {
						return callback(member.aliasField);
					});
				});
			});
		});
	}

	function disbandPMC(req, res, hash, callback) {
		if (!API.methods.validateParameter(req, res, [[hash, 'string']])) { return 0; }

		PMCModel.findOne({where:{'hashField': hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

				var
					PMCItemsModel = require('./../index.js').getModels().pmc_items,
					PMCUpgradesModel = require('./../index.js').getModels().pmc_upgrades,
					InvitesModel = require('./../index.js').getModels().invites,

					newPMCValues = {
						openForApplications: false,
						currentFunds: 0,
						sizeTier: 0,
						PMCPrestige: 0
					}
				;
				 PMCItemsModel.destroy({where: {ownerHash: entry.hashField}}).then(function() {
					PMCUpgradesModel.destroy({where: {PMCId: entry.id}}).then(function() {
						InvitesModel.destroy({where: {
							$or: [{ 'pointA': entry.hashField }, { 'pointB': entry.hashField }],
							typeField: {$or: ['Request_PlayerPMC', 'Invite_PlayerPMC']}
						}}).then(function() {
							entry.update(newPMCValues).then(function(upmc) { return callback(upmc);	});
						});
					});
				});
		});
	}

	function upgradePMCSize(req, res) {
		var entity = API.methods.getMainEntity(req);

		PMCModel.findOne({where:{ id: entity.entityId }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var GeneralMethods = require('./../index.js').getMethods().general_methods,
				ActionsCostMethod = require('./../index.js').getMethods().actions_cost,
				currentPMCSize = entry.sizeTier,
				upgradeMultiplier = config.numbers.modules.pmc.rankUpMultiplier,
				finalMultiValue = (currentPMCSize * upgradeMultiplier);

			GeneralMethods.paySystemActionMultiplied(req, res, 'upgradeSize', finalMultiValue, function(success) {
				entry.update({ sizeTier: (currentPMCSize + 1) }).then(function(pmc) {
					API.methods.sendResponse(req, res, true, config.messages().modules.pmc.size_up, success);
				});
			});
		});
	}

	function getPMCSizeCost(req, res) {
		var entity = API.methods.getMainEntity(req);

		PMCModel.findOne({where:{ id: entity.entityId }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var GeneralMethods = require('./../index.js').getMethods().general_methods,
				ActionsCostMethod = require('./../index.js').getMethods().actions_cost,
				currentPMCSize = entry.sizeTier,
				upgradeMultiplier = config.numbers.modules.pmc.rankUpMultiplier,
				finalMultiValue = (currentPMCSize * upgradeMultiplier);

			ActionsCostMethod.getPropertyFunc(req, res, GeneralMethods.returnEntityAction(req, 'upgradeSize'), function(cost) {
				API.methods.sendResponse(req, res, true, "", (cost * finalMultiValue));
			});
		});
	}

})();