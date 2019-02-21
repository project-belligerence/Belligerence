(function(){
	'use strict';

	var PlayerModel = require('./../index.js').getModels().players,
		PMCModel = require('./../index.js').getModels().pmc,
		GeneralMethods = require('./../index.js').getMethods().general_methods,
		InterestMethods = require('.//../index.js').getMethods().interest,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js');

	exports.newPlayer = newPlayer;
	exports.getAll = getAll;
	exports.getAllUnemployed = getAllUnemployed;
	exports.getPlayer = getPlayer;
	exports.putPlayer = putPlayer;
	exports.authPlayer = authPlayer;
	exports.confirmPassword = confirmPassword;
	exports.getSelf = getSelf;
	exports.setPMC = setPMC;
	exports.putPlayerSelf = putPlayerSelf;
	exports.playerJoinPMCFunc = playerJoinPMCFunc;
	exports.playerJoinPMC = playerJoinPMC;
	exports.playerLeavePMC = playerLeavePMC;
	exports.playerSelfLeavePMC = playerSelfLeavePMC;
	exports.playerLeavePMCFunc = playerLeavePMCFunc;
	exports.playerSelfGoFreelancer = playerSelfGoFreelancer;
	exports.playerGoFreelancer = playerGoFreelancer;
	exports.playerGoFreelancerFunc = playerGoFreelancerFunc;
	exports.playerSelfGoSoldier = playerSelfGoSoldier;
	exports.playerGoSoldier = playerGoSoldier;
	exports.playerGoSoldierFunc = playerGoSoldierFunc;
	exports.filterPlayerDetails = filterPlayerDetails;
	exports.getVisibility = getVisibility;
	exports.getPlayerFunc = getPlayerFunc;
	exports.findPlayerByProperty = findPlayerByProperty;
	exports.findPlayerByPropertyFunc = findPlayerByPropertyFunc;
	exports.claimNetworth = claimNetworth;

	function queryValues(req) {
		var _ = require("lodash");

		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'contract', 'alias', 'player_location', 'totalComments', 'player_prestige'],
			allowedPostValues: {
				contractValues: [config.enums.contract.FREELANCER, config.enums.contract.SOLDIER, config.enums.contract.COMMANDER],
				statusValues: [config.enums.status.OK, config.enums.status.DEAD, config.enums.status.WOUNDED, config.enums.status.MISSING],
				privateFieldsValues: ["freelancers", "ownPMC", "allPMC", "friends", "friends-PMC", "everyone", "nobody"],
				locationValues: _.range(GeneralMethods.getRegionsFunc().length)
			},
			generateWhereQuery:	function(req) {
				var object = {},
					prefix = "Pl";

				if (req.query.qAlias) { object.alias = { $like: ["%" + req.query.qAlias + "%", prefix] }; }
				if (req.query.qDescription) { object.bio = { $like: ["%" + req.query.qDescription + "%", prefix] }; }
				if (req.query.qLocation) { object.player_location = { $like: ["%" + req.query.qLocation + "%", prefix] }; }
				if (req.query.qContract) { object.contract = { $like: ["%" + req.query.qContract + "%", prefix] }; }
				if ((req.query.qPrestigeMin) || (req.query.qPrestigeMax)) { object.player_prestige = { $between: [(parseInt(req.query.qPrestigeMin) || 0), (parseInt(req.query.qPrestigeMax) || 9999999)]}; }
				if (req.query.qTags) { object.tags = { $dliteral: API.methods.generateRegexp(prefix + ".tags", req.query.qTags) }; }

				if (req.query.ADMIN_MODE) {
					if (req.query.qEmail) { object.email = { $like: ["%" + req.query.qEmail + "%", prefix] }; }
					if (req.query.qStatus) { object.status = { $like: ["%" + req.query.qStatus + "%", prefix] }; }
				}

				return object;
			}
		};
	}

	function authPlayer(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.username, req.body.password], 'string']
		], true)) { return 0; }

		req.body.remember = API.methods.getBoolean(req.body.remember.toString());

		if (!API.methods.validateParameter(req, res, [[req.body.remember.toString(), 'boolean']])) { return 0; }

		PlayerModel.findOne({include: [PMCModel], where: {"usernameField": req.body.username}}).then(function(player) {

			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(req.body.username))) { return 0; }
			if (!API.methods.validate(req, res, [player.playerStatus !== config.enums.status.BANNED], 'You are banned.', 403)) { return 0; }
			if (!API.methods.validate(req, res, [(player.comparePassword(req.body.password))], config.messages().invalid_password)) { return 0; }

			var
				playerInfo = {
					alias: player.aliasField,
					privilege: player.playerPrivilege,
					hash: player.hashField,
					pmcHash: player.PMCId ? player.PMC.hashField : null
				},
				tokenDuration = (req.body.remember ? (999*999*999*999) : (parseInt(config.db.sessionDurationMinutes) * 60)),
				jwt = require('jsonwebtoken')
			;

			jwt.sign(playerInfo, config.db.secretKey, { expiresIn: tokenDuration }, function(token) {
				var response = {};

				response.player = player;
				response.token = token;

				player.update({ lastIPField: req.connection.remoteAddress || "Unknown IP" }).then(function() {
					PlayerModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().authorized, response);
					});
				});
			});
		});
	}

	function confirmPassword(req, res) {
		PlayerModel.findOne({where: {"usernameField": req.playerInfo.usernameField}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(req.body.username))) { return 0; }
			if (!API.methods.validate(req, res, [player.playerStatus !== config.enums.status.BANNED], 'You are banned.', 403)) { return 0; }
			if (!API.methods.validate(req, res, [(player.comparePassword(req.body.password))], config.messages().invalid_password)) { return 0; }

			API.methods.sendResponse(req, res, true, config.messages().authorized, true);
		});
	}

	function getVisibility(req, settings, player) {
		var player_values = player,
			allowRead = false,
			friendList = {};

		switch(settings) {
			case "freelancers": {
				allowRead = (!(req.playerInfo.PMC));
			} break;
			case "ownPMC": {
				if (req.playerInfo.PMC) {
					allowRead = (req.playerInfo.PMC.hashField == (player_values.PMC ? player_values.PMC.hashField : '123'));
				} else { allowRead = false; }
			} break;
			case "allPMC": {
				allowRead = (req.playerInfo.PMCId !== null);
			} break;
			case "friends": {
				friendList = req.playerInfo.friendsList.players.rows;
				for (var i=0; i < friendList.length; i++) {
					if ((friendList[i].friendAHash === player_values.hashField) || (friendList[i].friendBHash === player_values.hashField)) { allowRead = true; }
				}
			} break;
			case "friends-PMC": {
				friendList = req.playerInfo.friendsList.pmc.rows;
				for (var j=0; j < friendList.length; j++) {
					if ((friendList[j].friendAHash === (player_values.PMC ? player_values.PMC.hashField : '123')) || (friendList[j].friendBHash === (player_values.PMC ? player_values.PMC.hashField : '123'))) { allowRead = true; }
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

	function filterPlayerDetails(req, player) {

		var
			_ = require('lodash'),
			player_values = player,
			allowRead = false,
			friendList = {}
		;

		if (req.query.ALL_PLAYERS_MODE) {
			player_values.bioField = API.methods.limitString(player_values.bioField, config.numbers.modules.intel.bodyLength, config.specialStrings.abbreviator);
		}

		if (player_values.PMCId) {
			var PMCD = {};

			PMCD.hashField = player_values.PMCHash;
			PMCD.nameField = player_values.PMCName;
			PMCD.bioField = player_values.PMCBio;
			PMCD.sideField = player_values.PMCSide;

			player_values.PMC = PMCD;
		}

		var PMCPrivateFields = (player_values.PMCPrivate ? API.methods.getPseudoArray(player_values.PMCPrivate) : null);

		player_values = _.omit(player_values, ['PMCId', 'PMCHash', 'PMCName', 'PMCPrivate']);

		player_values.tagsField = API.methods.getPseudoArray(player_values.tagsField);

		player_values.privateFields = API.methods.getPseudoArray(player_values.privateFields);

		allowRead = getVisibility(req, player_values.privateVisibility, player);

		req.query.ADMIN_MODE = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin));

		player_values.hideComments = false;
		player_values.blockComments = false;
		player_values.blockInvites = false;
		player_values.blockMessages = false;
		player_values.blockUpgrades = false;

		if ((!req.query.ADMIN_MODE) && (player_values.hashField !== req.playerInfo.hashField)) {
			if (allowRead === false) {
				player_values = _.omit(player_values, player_values.privateFields);

				if (_.indexOf(player_values.privateFields, 'hideComments') > -1) {
					player_values = _.omit(player_values, 'comments');
					player_values = _.omit(player_values, 'totalComments');
					player_values.hideComments = true;
				}

				var blockedUpgrades = (PMCPrivateFields ? PMCPrivateFields : player_values.privateFields);

				player_values.blockComments = (_.indexOf(player_values.privateFields, 'blockComments') > -1);
				player_values.blockInvites = (_.indexOf(player_values.privateFields, 'blockInvites') > -1);
				player_values.blockMessages = (_.indexOf(player_values.privateFields, 'blockMessages') > -1);
				player_values.blockUpgrades = (_.indexOf(blockedUpgrades, 'blockUpgrades') > -1);
			}
			player_values = _.omit(player_values, PlayerModel.blacklistProperties('query', 'user'));
		}

		return player_values;
	}

	function getPlayerFunc(req, res, hash, done) {
		var FriendsMethods = require('./../index.js').getMethods().friends;

		FriendsMethods.getFriendsAllFunc(req, res, function(friendsList) {
			req.playerInfo.friendsList = friendsList;

			var QueryTable = "players_table",
				newQuery = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
				queryWhere = (hash === "1") ? "1" : ("Pl.hashField = '" + hash + "'"),
				joinQuery = "LEFT JOIN (`pmc_table` PMC) ON (PMC.id = Pl.PMCId)",
				filterMainTable =
					"Pl.hashField as hashField, Pl.createdAt as createdAt, Pl.alias as aliasField, Pl.email as emailField, Pl.bio as bioField, Pl.player_location as locationField, " +
					"Pl.contract as contractType, Pl.missions_won as missionsWonNum, Pl.missions_failed as missionsfailedNum, " +
					"Pl.tier as playerTier, Pl.status as playerStatus, Pl.funds as currentFunds, Pl.tags as tagsField, " +
					"Pl.player_prestige as playerPrestige, Pl.privilege as playerPrivilege, Pl.last_ip as lastIPField, " +
					"Pl.steam_id as steamIDField, Pl.private_fields as privateFields, Pl.private_visibility as privateVisibility, Pl.PMCId, " +
					"PMC.hashField as PMCHash, PMC.display_name as PMCName, PMC.side as PMCSide, PMC.private_fields as PMCPrivate",
				filterCount = "",
				countQuery = "(SELECT COUNT(*) FROM `comments_tables`" +
						 	"WHERE comments_tables.subjectField = Pl.hashField" +
							") AS totalComments, ",

				filterQuery = req.query.COUNT_ONLY ? filterCount : (filterMainTable + filterCount),
				finalQuery = filterMainTable + " " + "FROM (`" + QueryTable + "` Pl) ";

			if (req.query.SEARCH_FOR_UNEMPLOYED) { queryWhere = "Pl.contract = 1 AND PMCId IS NULL"; }

			if (req.query.PMC_PLAYERS_QUERY) { queryWhere = "PMCId = " + hash; }

			API.methods.generateRawQuery(req, res,
				[finalQuery, "Pl"],
				countQuery + " ",
				joinQuery,
				queryWhere,
				newQuery,
			function(data) {
				if (data.rows.length > 0) {
					var UpgradesMethods = require('.//../index.js').getMethods().upgrades, i;
					for (i = 0; i < data.rows.length; i++) { data.rows[i] = filterPlayerDetails(req, data.rows[i]); }
					return UpgradesMethods.handleAssociatedUpgrades(req, res, data.rows).then(function() {
						return (done(data));
					});
				} else { return done(data); }
			});
		});
	}

	function getPlayer(req, res) {
		if (!API.methods.validate(req, res, [req.params.Hash], config.messages().no_entry)) { return 0; }
		req.query.SINGLE_MODE = true;
		getPlayerFunc(req, res, req.params.Hash, function(data) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
		});
	}

	function getAll(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 8;
		getPlayerFunc(req, res, "1", function(data) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
		});
	}

	function getAllUnemployed(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 8;
		req.query.SEARCH_FOR_UNEMPLOYED = true;
		getPlayerFunc(req, res, "1", function(data) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
		});
	}

	function newPlayer(req, res) {
		var isAdmin = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin)),
			isOwner = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.owner)),
			_ = require('lodash');

		if (!API.methods.validate(req, res, [(req.playerInfo.id === 0) || isAdmin], config.messages().modules.players.already_registered)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.username, 'string', config.numbers.modules.players.usernameLength],
			[req.body.password, 'string', config.numbers.modules.players.passwordLength],
			[req.body.bio, 'string', config.numbers.modules.players.bioLength],
			[req.body.location, 'number', queryValues(req).allowedPostValues.locationValues],
			[req.body.alias, 'string', config.numbers.modules.players.aliasLength],
			[req.body.steam_id, 'number'],
			[req.body.contract, 'number', queryValues(req).allowedPostValues.contractValues]
		], true)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.email, 'email']
		])) { return 0; }

		req.body.id = req.body.steam_id;

		var hasAccessKey = false,
			accessKeyObj = {},

			handleAllPromises = new Promise(function(resolve, reject) {
				new Promise(function(resolve, reject) {
					if (req.body.access_key) {
						var AccessKeysMethods = require('./../index.js').getMethods().access_keys;

						AccessKeysMethods.checkKeyValidityFUNC(req.body.access_key, function(obj) {
							console.log(obj.entry.nameField);
							if (!API.methods.validate(req, res, [obj.entry], "Invalid key.")) { return 0; }
							hasAccessKey = true;
							accessKeyObj = obj.entry;
							resolve();
						});
					} else { resolve(); }
				}).then(function() {
					new Promise(function(resolve, reject) {
						if (hasAccessKey && accessKeyObj.skipSteamField) return resolve();

						GeneralMethods.getSteamValidFunc(req, res, function(data) {
							if (!API.methods.validate(req, res, [(data[0])], "Invalid Steam ID.")) { return 0; }
							resolve();
						});
					});
				}).then(function() { resolve(); });
			});

		handleAllPromises.then(function() {
			var update = {}, filteredTagProperties = [];

			if (API.methods.isValid(req.body.username)) update.usernameField = req.body.username;
			if (API.methods.isValid(req.body.password)) update.passwordField = req.body.password;
			if (API.methods.isValid(req.body.alias)) update.aliasField = req.body.alias;
			if (API.methods.isValid(req.body.email)) update.emailField = req.body.email;
			if (API.methods.isValid(req.body.bio)) update.bioField = req.body.bio;
			if (API.methods.isValid(req.body.location)) update.locationField = req.body.location;
			if (API.methods.isValid(req.body.contract)) update.contractType = req.body.contract;
			if (API.methods.isValid(req.body.steam_id)) update.steamIDField = req.body.steam_id;

			if (update.contractType === config.enums.contract.FREELANCER) {
				update.currentFunds = config.numbers.modules.players.startingCashFreelancer;
			}

			if (hasAccessKey) {
				if (API.methods.isValid(accessKeyObj.fundsField)) update.networthField = accessKeyObj.fundsField;
				if (API.methods.isValid(accessKeyObj.privilegeField)) update.playerPrivilege = accessKeyObj.privilegeField;
			}

			if (API.methods.isValid(req.body.add_tags)) {
				if (!API.methods.validateParameter(req, res, [[[req.body.add_tags], 'array']])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[req.body.add_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

				filteredTagProperties = (_.union([], req.body.add_tags));
				update.tagsField = filteredTagProperties;

				if (!API.methods.validate(req, res, [(update.tagsField.length <= config.numbers.general.tagsLimit)], config.messages().modules.tags.tooMany)) { return 0; }
			}

			new Promise(function(resolve, reject) {
				if (hasAccessKey && accessKeyObj) {
					var AccessKeysModel = require('./../index.js').getModels().access_keys;
					AccessKeysModel.findOne({ where: { seedField: accessKeyObj.seedField }}).then(function(keyEntry) {
						keyEntry.update({ usedField: true }).then(resolve);
					});
				} else { resolve(); }
			}).then(function() {
				if (isAdmin) {
					if (!API.methods.validateParameter(req, res, [
						[[req.body.missionsWon, req.body.missionsFailed, req.body.tier, req.body.funds, req.body.prestige], 'number'],
						[req.body.status, 'number', queryValues(req).allowedPostValues.statusValues]
					])) { return 0; }

					if (API.methods.isValid(req.body.missionsWon)) update.missionsWonNum = req.body.missionsWon;
					if (API.methods.isValid(req.body.missionsFailed)) update.missionsFailedNum = req.body.missionsFailed;
					if (API.methods.isValid(req.body.tier)) update.playerTier = req.body.tier;
					if (API.methods.isValid(req.body.status)) update.playerStatus = req.body.status;
					if (API.methods.isValid(req.body.funds)) update.currentFunds = req.body.funds;
					if (API.methods.isValid(req.body.networth)) update.networthField = req.body.networth;
					if (API.methods.isValid(req.body.prestige)) update.playerPrestige = req.body.prestige;

					if (isOwner) {
						if (!API.methods.validateParameter(req, res, [
							[req.body.privilege, 'number', [config.privileges().tiers.admin, config.privileges().tiers.user]]
						])) { return 0; }

						if (API.methods.isValid(req.body.privilege)) update.playerPrivilege = req.body.privilege;
					}
				}

				update.privateFields = PlayerModel.blacklistProperties('creation', 'user');

				PlayerModel.sync({force: false}).then(function() {
					PlayerModel.findOne({where: {$or: [{'usernameField': req.body.username}, {'steamIDField': req.body.steam_id}]}}).then(function(player) {
						if (!API.methods.validate(req, res, [!player], config.messages().entry_exists(req.body.username))) { return 0; }

						PlayerModel.create(update).then(function(player) { API.methods.sendResponse(req, res, true, config.messages().new_entry, player); });
					});
				});
			});
		});
	}

	function putPlayerSelf(req, res) {
		req.params.Hash = req.playerInfo.hashField;
		putPlayer(req, res);
	}

	function putPlayer(req, res) {
		var isAdmin = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin)),
			isOwner = (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.owner));

		// The player is only able to edit other players as either himself or an admin.
		if (!API.methods.validate(req, res, [(
			(req.playerInfo.hashField == req.params.Hash) || (isAdmin)
		)], config.messages().bad_permission)) { return 0; }

		PlayerModel.findOne({where:{'hashField': req.params.Hash}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var
				_ = require('lodash'),
				currentProperties = player.privateFields,
				currentTagProperties = player.tagsField,
				filteredTagProperties = player.tagsField,
				validPublicProperties = PlayerModel.whitelistProperties('query', 'user'),
				filteredProperties = player.privateFields
			;

			// Cannot edit a player that is of a higher standing
			if (req.playerInfo.hashField !== req.params.Hash) {
				if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege < player.playerPrivilege)], config.messages().bad_permission)) { return 0; }
			}

			// THESE MAY BE REMOVED DEPENDING ON THE FRONT-END SOLUTION
			// 		LIKE FOR EXAMPLE IF I JUST UPDATE THE ENTIRE ARRAY MODIFIED BY THE FRONT END
			if (API.methods.isValid(req.body.add_tags)) {
				if (!API.methods.validateParameter(req, res, [[[req.body.add_tags], 'array']])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[req.body.add_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

				filteredTagProperties = (_.union(currentTagProperties, req.body.add_tags));

				if (!API.methods.validate(req, res, [(filteredTagProperties .length <= config.numbers.general.tagsLimit)], config.messages().modules.tags.tooMany)) { return 0; }
			}

			if (API.methods.isValid(req.body.remove_tags)) {
				if (!API.methods.validateParameter(req, res, [[[req.body.remove_tags], 'array']])) { return 0; }
				if (!API.methods.validateParameter(req, res, [[req.body.remove_tags, 'string', config.numbers.general.tagsLength]])) { return 0; }

				filteredTagProperties = API.methods.excludeArrayFromArray(filteredTagProperties, req.body.remove_tags);
			}

			if (!API.methods.validateParameter(req, res, [
				[[req.body.currentPassword, req.body.newPassword], 'string', config.numbers.modules.players.passwordLength],
				[req.body.bio, 'string', config.numbers.modules.players.bioLength],
				[req.body.location, 'number', queryValues(req).allowedPostValues.locationValues],
				[req.body.visibility, 'string', queryValues(req).allowedPostValues.privateFieldsValues],
				[req.body.alias, 'string', config.numbers.modules.players.aliasLength],
				[req.body.email, 'email']
			])) { return 0; }

			if (API.methods.isValid(req.body.newPassword)) {
				if (!API.methods.validate(req, res, [req.body.currentPassword], config.messages().invalid_password)) { return 0; }
				if (!(player.comparePassword(req.body.currentPassword))) {
					return API.methods.sendResponse(req, res, false, config.messages().invalid_password);
				}
			}

			if (API.methods.isValid(req.body.properties)) {
				if (!API.methods.validateParameter(req, res, [[req.body.properties, PlayerModel.whitelistProperties('query', 'user')]])) { return 0; }

				filteredProperties = _.uniq(req.body.properties, validPublicProperties);
				filteredProperties.push("emailField");
			}

			var update = {};

			if (API.methods.isValid(req.body.newPassword)) update.passwordField = req.body.newPassword;
			if (API.methods.isValid(req.body.alias)) update.aliasField = req.body.alias;
			if (API.methods.isValid(req.body.email)) update.emailField = req.body.email;
			if (API.methods.isValid(req.body.bio)) update.bioField = req.body.bio;
			if (API.methods.isValid(req.body.location)) update.locationField = req.body.location;
			if (API.methods.isValid(req.body.visibility)) update.privateVisibility = req.body.visibility;
			if ((req.body.properties) || (req.body.remove_properties)) update.privateFields = filteredProperties;
			if ((req.body.add_tags) || (req.body.remove_tags)) update.tagsField = filteredTagProperties;

			if (isAdmin) {
				if (!API.methods.validateParameter(req, res, [
					[[req.body.missionsWon, req.body.missionsFailed, req.body.tier, req.body.funds, req.body.prestige], 'number'],
					[req.body.status, 'number', queryValues(req).allowedPostValues.statusValues]
				])) { return 0; }

				if (API.methods.isValid(req.body.missionsWon)) update.missionsWonNum = req.body.missionsWon;
				if (API.methods.isValid(req.body.missionsFailed)) update.missionsFailedNum = req.body.missionsFailed;
				if (API.methods.isValid(req.body.tier)) update.playerTier = req.body.tier;
				if (API.methods.isValid(req.body.status)) update.playerStatus = req.body.status;
				if (API.methods.isValid(req.body.funds)) update.currentFunds = req.body.funds;
				if (API.methods.isValid(req.body.networth)) update.networthField = req.body.networth;
				if (API.methods.isValid(req.body.prestige)) update.playerPrestige = req.body.prestige;

				if (isOwner) {
					if (!API.methods.validateParameter(req, res, [
						[req.body.privilege, 'number', [config.privileges().tiers.admin, config.privileges().tiers.user]]
					])) { return 0; }

					if (req.body.privilege) update.playerPrivilege = req.body.privilege;
				}
			}

			player.update(update).then(function(updated_entry) {
				PlayerModel.sync({force: false}).then(function() {

					var rObject = {};
					if (API.methods.isValid(req.body.properties)) rObject.privateFields = updated_entry.privateFields;
					if (API.methods.isValid(req.body.visibility)) rObject.privateVisibility = updated_entry.privateVisibility;

					API.methods.sendResponse(req, res, true, config.messages().entry_updated(player.aliasField), rObject);
				});
			});

		});
	}

	function getSelf(req, res) {
		PlayerModel.findOne({
			where: { "hashField": req.playerInfo.hashField },
			include: { model: PMCModel, attributes: ["hashField", "sideField"] }
		}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, player);
		});
	}

	function claimNetworth(req, res) {
		var entity = API.methods.getMainEntity(req),
			playerId = req.playerInfo.id;

		PlayerModel.findOne({where: { id: playerId }}).then(function(player_data) {
			if (!API.methods.validate(req, res, [player_data], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [(player_data.contractType !== config.enums.contract.SOLDIER)], config.messages().modules.players.cannot_reclaim_soldier)) { return 0; }

			var currentNetworth = player_data.networthField;

			entity.entityModel.findOne({ where: { id: entity.entityId }}).then(function(object) {
				if (!API.methods.validate(req, res, [object], config.messages().no_entry)) { return 0; }

				var updatePlayer = { networthField: 0 };

				player_data.update(updatePlayer).then(function(updated_entry) {
					object.addFunds(currentNetworth, function(done) {
						PlayerModel.sync({force: false}).then(function() {
							var rObj = { networth: updated_entry.networthField, funds: object.currentFunds };
							API.methods.sendResponse(req, res, true, config.messages().modules.players.reclaimed_networth, rObj);
						});
					});
				});
			});
		});
	}

	function findPlayerByProperty(req, res) {
		findPlayerByPropertyFunc(req, res, function(data) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, data);
		});
	}

	function findPlayerByPropertyFunc(req, res, cb) {
		if (!API.methods.validateParameter(req, res, [[[req.body.property], 'string']], true)) { return 0; }

		var queryObj = {};
		queryObj.where = {};
		queryObj.where[req.body.property] = req.body.value;

		if (!API.methods.validate(req, res, [(
			req.body.property === "steam_id" ||
			req.body.property === "hashField" ||
			req.body.property === "username"
		)], config.messages().no_entry)) { return 0; }

		var valueFilter = (req.body.property === "username") ? 'string' : 'number';

		if (!API.methods.validateParameter(req, res, [[[req.body.value], valueFilter]], true)) { return 0; }

		PlayerModel.findOne(queryObj).then(function(player) {
			var rData = { exists: (player !== null)	};
			return cb(rData);
		});
	}

	function playerGoFreelancer(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.params.Hash], 'string']], true)) { return 0; }

		playerGoFreelancerFunc(req, res, req.params.Hash, function(player) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, player);
		});
	}

	function playerSelfGoFreelancer(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.playerInfo.hashField], 'string']], true)) { return 0; }

		playerGoFreelancerFunc(req, res, req.playerInfo.hashField, function(player) {
			API.methods.sendResponse(req, res, true, "You are now a Freelancer.", player);
		});
	}

	function playerGoFreelancerFunc(req, res, playerHash, callback) {
		PlayerModel.findOne({ where: { "hashField": playerHash }}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [!player.PMCId], config.messages().modules.pmc.that_in_pmc)) { return 0; }
			if (!API.methods.validate(req, res, [player.contractType < config.enums.contract.FREELANCER], config.messages().modules.players.already_freelancer)) { return 0; }

			player.canChangeClass(function(no_contracts) {
				if (!API.methods.validate(req, res, [no_contracts], "You may not switch classes while signed to active Contracts.")) { return 0; }

				var
					newPlayerValues = {
						contractType: config.enums.contract.FREELANCER,
						playerTier: config.privileges().tiers.user,
						currentFunds: config.numbers.modules.players.startingCashFreelancer,
						playerPrestige: 1
					}
				;

				player.update(newPlayerValues).then(function() {
					PlayerModel.sync({force: false}).then(function() {
						PlayerModel.findOne({where: {"hashField": playerHash}}).then(function(playerF) {
							return callback(playerF);
						});
					});
				});
			});
		});
	}

	function playerGoSoldier(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.params.Hash], 'string']], true)) { return 0; }

		playerGoSoldierFunc(req, res, req.params.Hash, function(player) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, player);
		});
	}

	function playerSelfGoSoldier(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.playerInfo.hashField], 'string']], true)) { return 0; }

		playerGoSoldierFunc(req, res, req.playerInfo.hashField, function(player) {
			API.methods.sendResponse(req, res, true, "You are now a Soldier.", player);
		});
	}

	function playerGoSoldierFunc(req, res, playerHash, callback) {
		PlayerModel.findOne({where: { "hashField": playerHash }}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [!player.PMCId], config.messages().modules.pmc.that_in_pmc)) { return 0; }
			if (!API.methods.validate(req, res, [player.contractType === config.enums.contract.FREELANCER], config.messages().modules.players.already_soldier)) { return 0; }

			player.canChangeClass(function(no_contracts) {
				if (!API.methods.validate(req, res, [no_contracts], "You may not switch classes while signed to active Contracts.")) { return 0; }

				var
					newPlayerValues = {
						contractType: config.enums.contract.SOLDIER,
						playerTier: config.privileges().tiers.user,
						currentFunds: 0,
						playerPrestige: 0
					},

					PlayerItemsModel = require('./../index.js').getModels().player_items,
					PlayerUpgradesModel = require('./../index.js').getModels().player_upgrades
				;

				PlayerItemsModel.destroy({where: {ownerHash: player.hashField}}).then(function() {
					PlayerUpgradesModel.destroy({where: {playerId: player.id}}).then(function() {
						player.update(newPlayerValues).then(function(playerF) {
							PlayerModel.sync({force: false}).then(function() {
								return InterestMethods.cleanUpAllInterest({ PosterId: playerF.id }, callback);
							});
						});
					});
				});
			});
		});
	}

	function playerJoinPMCFunc(req, res, playerHash, PMCHash, callback) {
		PlayerModel.findOne({where: {"hashField": playerHash}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [!player.PMCId], config.messages().modules.pmc.that_in_pmc)) { return 0; }

			PMCModel.findOne({where: {"hashField": PMCHash}}).then(function(pmc) {
				if (!API.methods.validate(req, res, [pmc], config.messages().no_entry)) { return 0; }

				pmc.getActiveContractsAmount(function(contracts) {
					if (!API.methods.validate(req, res, [(contracts <= 0)], config.messages().modules.pmc.active_contracts)) { return 0; }

					pmc.countPlayers().then(function(playerCount) {
						var
							PlayerItemsModel = require('./../index.js').getModels().player_items,
							PlayerUpgradesModel = require('./../index.js').getModels().player_upgrades,
							InvitesModel = require('./../index.js').getModels().invites,

							newPlayerValues = {
								contractType: config.enums.contract.SOLDIER,
								playerTier: config.privileges().tiers.user,
								currentFunds: 0,
								playerPrestige: 0
							},
							maxPlayers = (pmc.sizeTier * config.numbers.modules.pmc.membersPerTier)
						;

						if (!API.methods.validate(req, res, [(maxPlayers > playerCount)], config.messages().modules.pmc.pmc_full)) { return 0; }

						PlayerItemsModel.destroy({where: {ownerHash: player.hashField}}).then(function() {
							PlayerUpgradesModel.destroy({where: {playerId: player.id}}).then(function() {
								InvitesModel.destroy({where: {
									$or: [{ 'pointA': player.hashField }, { 'pointB': player.hashField }],
									typeField: {$or: ['Request_PlayerPMC', 'Invite_PlayerPMC']}
								}}).then(function() {
									pmc.addPlayer(player).then(function() {
										player.update(newPlayerValues).then(function(player) {
											PlayerModel.sync({force: false}).then(function() {
												PMCModel.sync({force: false}).then(function() {
													PlayerModel.findOne({where: {"hashField": playerHash}}).then(function(playerF) {
														InterestMethods.cleanUpAllInterest({ PosterId: playerF.id }, function() {
															return callback(playerF);
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

	function playerJoinPMC(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.params.Hash, req.body.pmc], 'string']], true)) { return 0; }

		playerJoinPMCFunc(req, res, req.params.Hash, req.body.pmc, function(player) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, player);
		});
	}

	function playerLeavePMC(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.params.Hash], 'string']], true)) { return 0; }

		playerLeavePMCFunc(req, res, req.params.Hash, function(player) {
			API.methods.sendResponse(req, res, true, "You have left the Outfit.", player);
		});
	}

	function playerSelfLeavePMC(req, res) {
		playerLeavePMCFunc(req, res, req.playerInfo.hashField, function(player) {
			API.methods.sendResponse(req, res, true, "You have left the Outfit.", player);
		});
	}

	function playerLeavePMCFunc(req, res, playerHash, callback) {
		PlayerModel.findOne({where: {"hashField": playerHash}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [player.PMCId], config.messages().modules.pmc.not_in_pmc)) { return 0; }

			PMCModel.findOne({where: {"id": player.PMCId}}).then(function(pmc) {
				if (!API.methods.validate(req, res, [pmc], config.messages().no_entry)) { return 0; }

				pmc.countPlayers().then(function(playerCount) {
					var
						PMCMethods = require('./../index.js').getMethods().pmc,
						newPlayerValues = {
							contractType: config.enums.contract.SOLDIER,
							playerTier: config.privileges().tiers.user,
							currentFunds: 0,
							playerPrestige: 0
						},
						isCommander = (player.contractType === config.enums.contract.COMMANDER)
					;


					pmc.removePlayer(player).then(function() {
						player.update(newPlayerValues).then(function(player) {
							PlayerModel.sync({force: false}).then(function() {
								PMCModel.sync({force: false}).then(function() {
									PlayerModel.findOne({where: {"hashField": playerHash}}).then(function(playerF) {
										if ((playerCount-1) === 0) {
											PMCMethods.disbandPMC(req, res, pmc.hashField, function(dPMC) {
												return callback(playerF);
											});
										} else {
											if (isCommander) {
												pmc.getPlayers({where: {hashField: {$ne: player.hashField}}}).then(function(successor) {
													var successorPlayer = successor[0],
														newSuccessorValues = {
															contractType: config.enums.contract.COMMANDER,
															playerTier: config.privileges().tiers.owner
														};
													successorPlayer.update(newSuccessorValues).then(function() {
														PlayerModel.sync({force: false}).then(function() {
															return callback(playerF);
														});
													});
												});
											} else {
												return callback(playerF);
											}
										}
									});
								});
							});
						});
					});
				});
			});
		});
	}

	// ADD ALL RELATED FUNCTIONS INTO THIS METHOD ONCE WE HAVE THEM
	function setPMC(req, res) {
		if (!API.methods.validate(req, res, [req.body.player, req.body.pmc])) { return 0; }

		if (!API.methods.validate(req, res, [((req.playerInfo.playerPrivilege <= config.privileges().tiers.admin))], config.messages().bad_permission)) { return 0; }

		API.methods.sendResponse(req, res, true, 'Player has been added to the PMC.', '');

		PlayerModel.findOne({where:{'hashField': req.body.player}}).then(function(player) {
		PMCModel.findOne({where:{'hashField': req.body.pmc}}).then(function(pmc) {
			player.setPMC(pmc).then(function() {
				API.methods.sendResponse(req, res, true, 'Player has been added to the PMC.', '');
			});
		});
		});

	}

})();