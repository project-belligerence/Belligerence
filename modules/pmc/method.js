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
	exports.putPMC = putPMC;
	exports.getPMCPlayers = getPMCPlayers;
	exports.getSelfPMCPlayers = getSelfPMCPlayers;
	exports.getPMCPlayersFunc = getPMCPlayersFunc;
	exports.kickMember = kickMember;
	exports.disbandPMC = disbandPMC;
	exports.upgradePMCSize = upgradePMCSize;
	exports.startPMC = startPMC;
	exports.getVisibility = getVisibility;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'totalPlayers', 'totalComments', 'display_name', 'location', 'open_applications'],
			allowedPostValues: {
				privateFieldsValues: ["freelancers", "ownPMC", "allPMC", "friends-PMC", "everyone", "nobody"]
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (!req.query.SINGLE_MODE) {
					if (req.query.qName) { object.display_name = { $like: "%" + req.query.qName + "%" }; }
					if (req.query.qLocation) { object.location = { $like: "%" + req.query.qLocation + "%" }; }
					if (req.query.qTags) { object.tags = { $dliteral: API.methods.generateRegexp("tags", req.query.qTags) }; }
					if (req.query.qOpen) { object.open_applications = { $like: "%" + req.query.qOpen + "%" }; }
					if (req.query.qPlayers) { object.having = { $having: "totalPlayers BETWEEN " + (Math.max((req.query.qPlayers.min || 1), 1)) + " AND " + (req.query.qPlayers.max || 999)}; }
					else { object.having = { $having: "totalPlayers > 0" }; }
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
				allowRead = (!(req.playerInfo.PMC));
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
				friendList = req.playerInfo.friendsList.pmc.rows;
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

			allowRead = getVisibility(req, pmc_values.privateVisibility, pmc);

			req.query.ADMIN_MODE = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin));

			var isPMCMod = (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator));

			pmc_values.private_fields = API.methods.getPseudoArray(pmc_values.private_fields);
			pmc_values.tier_names = API.methods.getPseudoArray(pmc_values.tier_names);
			pmc_values.tags = API.methods.getPseudoArray(pmc_values.tags);
			pmc_values.colors = API.methods.getPseudoArray(pmc_values.colors);

			if ((!req.query.ADMIN_MODE) && !((pmc_values.hashField === (req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123') && (isPMCMod)))) {
				if (allowRead === false) {
					pmc_values = _.omit(pmc_values, pmc_values.private_fields);

					if (_.indexOf(pmc_values.privateFields, 'hideComments') > -1) {
						pmc_values = _.omit(pmc_values, 'comments');
					}
				}
				pmc_values = _.omit(pmc_values, PMCModel.blacklistProperties('query', 'user'));
			}

			pmc.rows[i] = pmc_values;
		}
		return pmc;
	}

	function getPMCFunc(req, res, hash, callback) {

		var FriendsMethods = require('./../index.js').getMethods().friends,
			CommentsMethods = require('./../index.js').getMethods().comments;

		FriendsMethods.getFriendsAllFunc(req, res, function(friendsList) {
			req.playerInfo.friendsList = friendsList;

			var QueryTable = "pmc_table",
				newQuery = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
				queryWhere = (hash === "1") ? "1" : ("pmc_table.hashField = '" + hash + "'"),
				havingQuery = "> 0 ",
				filterMainTable = "*, ",
				filterCount = 	"(SELECT COUNT(players_table.hashField) FROM `players_table` WHERE players_table.PMCId = pmc_table.id) AS totalPlayers " +
								", (SELECT COUNT(*) FROM `comments_tables`" +
							 	"WHERE comments_tables.subjectField = " + QueryTable + ".hashField" +
								") AS totalComments",

				filterQuery = req.query.COUNT_ONLY ? filterCount : (filterMainTable + filterCount);

			API.methods.generateRawQuery(req, res,
				QueryTable,
				filterQuery,
				"",
				queryWhere,
				newQuery,
			function(data) {
				if (data.rows.length > 0) {
					CommentsMethods.getEntityComments(req, res, "pmc_table", data.rows[0].hashField, function(comments) {
						if (req.query.SINGLE_MODE) { data.rows[0].comments = comments; }

						API.methods.sendResponse(req, res, true, "", filterPMC(req, data));
					});
				} else { API.methods.sendResponse(req, res, true, "", data); }
			});
		});
	}

	function getAllPMC(req, res) {
		req.query.ALL_PMC_MODE = true;
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
			[[req.body.location], 'string'],
			[req.body.visibility, 'string', queryValues(req).allowedPostValues.privateFieldsValues],
			[[req.body.colors], 'array'],
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

			// THESE MAY BE REMOVED DEPENDING ON THE FRONT-END SOLUTION
			// 		LIKE FOR EXAMPLE IF I JUST UPDATE THE ENTIRE ARRAY MODIFIED BY THE FRONT END
			if (req.body.add_tags) {
				if (!API.methods.validateParameter(req, res, [[[req.body.add_tags], 'array']])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[req.body.add_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

				filteredTagProperties = (_.union(currentTagProperties, req.body.add_tags));
				if (!API.methods.validate(req, res, [(filteredTagProperties .length <= config.numbers.general.tagsLimit)], config.messages().modules.tags.tooMany)) { return 0; }
			}

			if (req.body.properties) {
				if (!API.methods.validateParameter(req, res, [[[req.body.properties], 'array']])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[req.body.properties, PMCModel.whitelistProperties('query', 'user')]])) { return 0; }

				filteredProperties = API.methods.sharedArrayFromArray(_.uniq(_.union(currentProperties, req.body.properties)), validPublicProperties);
			}

			if (req.body.tierNames) {
				if (!API.methods.validate(req, res, [req.body.tierNames.length === 5])) { return 0; }

				if (!API.methods.validateParameter(req, res, [
					[req.body.tierNames, 'string', config.numbers.modules.pmc.tierLength]
				])) { return 0; }

				update.tierNameFields = req.body.tierNames;
			}

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

			update.privateFields = PMCModel.blacklistProperties('creation', 'user');

			PMCModel.sync({force: false}).then(function() {
				PMCModel.findOne({where:{'displaynameField': req.body.displayname}}).then(function(entry) {
					if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.displayname))) { return 0; }

					PMCModel.create(update).then(function(entry) {
						if (!API.methods.validate(req, res, [entry], "ERROR")) { return 0; }

						entry.addPlayer(player).then(function() {
							player.update({
								playerTier: config.privileges().tiers.owner,
								currentFunds: 0,
								contractType: config.enums.contract.COMMANDER
							}).then(function(nPlayer) {
								API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
							});
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
			PMCModel.findOne({where:{'displaynameField': req.body.displayname}}).then(function(entry) {
				if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.displayname))) { return 0; }

				PMCModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
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
			[[req.body.location], 'string'],
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

				// THESE MAY BE REMOVED DEPENDING ON THE FRONT-END SOLUTION
				// 		LIKE FOR EXAMPLE IF I JUST UPDATE THE ENTIRE ARRAY MODIFIED BY THE FRONT END
				if (req.body.add_tags) {
					if (!API.methods.validateParameter(req, res, [[[req.body.add_tags], 'array']])) { return 0; }
					if (!API.methods.validateParameter(req, res, [[req.body.add_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

					filteredTagProperties = (_.union(currentTagProperties, req.body.add_tags));
					if (!API.methods.validate(req, res, [(filteredTagProperties .length <= config.numbers.general.tagsLimit)], config.messages().modules.tags.tooMany)) { return 0; }
				}

				if (req.body.remove_tags) {
					if (!API.methods.validateParameter(req, res, [[[req.body.remove_tags], 'array']])) { return 0; }
					if (!API.methods.validateParameter(req, res, [[req.body.remove_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

					filteredTagProperties = API.methods.excludeArrayFromArray(filteredTagProperties, req.body.remove_tags);
				}

				// THESE MAY BE REMOVED DEPENDING ON THE FRONT-END SOLUTION
				// 		LIKE FOR EXAMPLE IF I JUST UPDATE THE ENTIRE ARRAY MODIFIED BY THE FRONT END
				if (req.body.properties) {
					if (!API.methods.validateParameter(req, res, [[[req.body.properties], 'array']])) { return 0; }
					if (!API.methods.validateParameter(req, res, [[req.body.properties, PMCModel.whitelistProperties('query', 'user')]])) { return 0; }

					filteredProperties = API.methods.sharedArrayFromArray(_.uniq(_.union(currentProperties, req.body.properties)), validPublicProperties);
				}

				if (req.body.remove_properties) {
					if (!API.methods.validateParameter(req, res, [[[req.body.remove_properties], 'array']])) { return 0; }
					if (!API.methods.validateParameter(req, res, [[req.body.remove_properties, PMCModel.whitelistProperties('query', 'user')]])) { return 0; }

					filteredProperties = API.methods.excludeArrayFromArray(filteredProperties, req.body.remove_properties);
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
		var entity = API.methods.getMainEntity(req);

		if (!API.methods.validateParameter(req, res, [[req.body.member, 'string']])) { return 0; }
		if (!API.methods.validate(req, res, [req.body.member !== req.playerInfo.hashField])) { return 0; }

		PlayerModel.findOne({where: {hashField: req.playerInfo.hashField}}).then(function(caller) {
			if (!API.methods.validate(req, res, [caller])) { return 0; }
			PlayerModel.findOne({where: {hashField: req.body.member, PMCId: caller.PMCId}}).then(function(member) {
				if (!API.methods.validate(req, res, [member])) { return 0; }

				if (!API.methods.validate(req, res, [member.PMCId === caller.PMCId], config.messages().bad_permission)) { return 0; }
				if (!API.methods.validate(req, res, [member.playerTier === config.privileges().tiers.admin], config.messages().modules.pmc.higher_tier_req)) { return 0; }

				member.update({playerTier: config.privileges().tiers.owner}).then(function() {
					caller.update({playerTier: config.privileges().tiers.admin}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().modules.pmc.now_leader(member.aliasField));
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
						sizeTier: -1,
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

		PMCModel.findOne({where:{'hashField': entity.entityHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }

			var currentPMCSize = entry.sizeTier,
				GeneralMethods = require('./../index.js').getMethods().general_methods;

			GeneralMethods.paySystemActionMultiplied(req, res, 'upgradeSize', currentPMCSize, function(success) {
				var update = {};
				update.sizeTier = (currentPMCSize + 1);

				entry.update(update).then(function(pmc) {
					API.methods.sendResponse(req, res, true, config.messages().modules.pmc.size_up);
				});
			});
		});
	}

})();