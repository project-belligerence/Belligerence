(function(){
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		FriendsModel = require('./../index.js').getModels().friends,
		UpgradesMethods = require('.//../index.js').getMethods().upgrades,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Friends",
		mainModel = FriendsModel;

	exports.getFriendsPlayer = getFriendsPlayer;
	exports.getFriendsPMC = getFriendsPMC;
	exports.getFriendsAll = getFriendsAll;

	exports.getFriendsPlayerRead = getFriendsPlayerRead;
	exports.getFriendsPMCRead = getFriendsPMCRead;
	exports.getFriendsAllRead = getFriendsAllRead;

	exports.getFriendsPlayerFunc = getFriendsPlayerFunc;
	exports.getFriendsPMCFunc = getFriendsPMCFunc;
	exports.getFriendsAllFunc = getFriendsAllFunc;

	exports.getFriendsPMCReadFunc = getFriendsPMCReadFunc;

	exports.removeFriend = removeFriend;
	exports.removeAlliance = removeAlliance;

	exports.queryValues = queryValues;

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

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entries)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function removeFriend(req, res) {
		mainModel.findOne({
			where: {
				friendAHash: [req.playerInfo.hashField, req.body.friend_hash],
				friendBHash: [req.playerInfo.hashField, req.body.friend_hash],
				friendType: "player"
			}
		}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().modules.friends.friend_removed, "");
			});
		});
	}

	function removeAlliance(req, res) {
		if (!API.methods.validate(req, res, [req.playerInfo.PMC, "You are not in an Outfit."])) { return 0; }

		mainModel.findOne({
			where: {
				friendAHash: [req.playerInfo.PMC.hashField, req.body.friend_hash],
				friendBHash: [req.playerInfo.PMC.hashField, req.body.friend_hash],
				friendType: "pmc"
			}
		}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().modules.friends.alliance_removed, "");
			});
		});
	}

	function getFriendsPlayerReadFunc(req, res, callback) {
		var FRIENDS_LIST_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
			queryTable = 'friends_tables',
			queryType = 'player',
			filterValue = req.playerInfo.hashField;

		API.methods.generateRawQuery(req, res,
			queryTable,
				"IF(PA.hashField = '" + filterValue + "', null, PA.hashField) AS friend_A_Hash, " +
				"IF(PA.hashField = '" + filterValue + "', null, PA.alias) AS friend_A_Alias, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.hashField) AS friend_B_Hash, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.alias) AS friend_B_Alias, " +
				"IF(PA.hashField = '" + filterValue + "', null, PA.side) AS friend_A_Side, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.side) AS friend_B_Side, " +
				"IF(PA.hashField = '" + filterValue + "', null, PA.PMCId) AS PMC_A, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.PMCId) AS PMC_B, " +

				"IF(PA.hashField = '" + filterValue + "', null, PMCA.hashField) AS PMCA_Hash, " +
				"IF(PB.hashField = '" + filterValue + "', null, PMCB.hashField) AS PMCB_Hash, " +
				"IF(PA.hashField = '" + filterValue + "', null, PMCA.side) AS PMCA_Side, " +
				"IF(PB.hashField = '" + filterValue + "', null, PMCB.side) AS PMCB_Side, " +

				"friends_tables.createdAt AS friends_since",
			"INNER JOIN `players_table` AS PA ON friends_tables.friend_a = PA.hashField INNER JOIN `players_table` AS PB ON friends_tables.friend_b = PB.hashField " +
			"LEFT JOIN `pmc_table` AS PMCA ON PA.PMCId = PMCA.id LEFT JOIN `pmc_table` AS PMCB ON PB.PMCId = PMCB.id",
			"friends_tables.type = '" + queryType + "' AND (" + "PA.hashField = '" + filterValue + "' OR PB.hashField = '" + filterValue + "')",
			FRIENDS_LIST_FUNC_QUERY,
		function(data) {
			var _ = require('lodash'), newRet = [];
			req.query.qIncludeUpgrades = true;

			for (var i=0; i < data.rows.length; i++) { data.rows[i] = _.omitBy(data.rows[i], _.isNull);	}
			for (var i=0; i < data.rows.length; i++) {
				var PMCHash = (data.rows[i].PMCA_Hash || data.rows[i].PMCB_Hash),
					PMCSide = (data.rows[i].PMCA_Side || data.rows[i].PMCB_Side),
					friendSide = (data.rows[i].friend_A_Side || data.rows[i].friend_B_Side);

				newRet.push({
					friendAlias: (data.rows[i].friend_B_Alias || data.rows[i].friend_A_Alias),
					hashField: (data.rows[i].friend_B_Hash || data.rows[i].friend_A_Hash),
					friendHash: (data.rows[i].friend_B_Hash || data.rows[i].friend_A_Hash),
					friendSide: (PMCSide || friendSide),
					friendSince: data.rows[i].friends_since
				});
				if (PMCHash) newRet[i].PMC = { hashField: PMCHash };
			}

			UpgradesMethods.handleAssociatedUpgrades(req, res, newRet).then(function(handledUpgrades) {
				data.rows = newRet;
				return callback(data);
			});
		});
	}

	function getFriendsPlayerFunc(req, res, callback) {
		var FRIENDS_LIST_FUNC_QUERY = {where: {}, order:[['createdAt', "ASC"]], offset:0, limit:0},
		filterValue = (req.playerInfo.hashField);

		FRIENDS_LIST_FUNC_QUERY.where.friendType = 'player';
		FRIENDS_LIST_FUNC_QUERY.where.$or = [{ "friendAHash": filterValue }, { "friendBHash": filterValue }];

		mainModel.findAndCountAll(FRIENDS_LIST_FUNC_QUERY).then(function(entries) {
			return callback(entries);
		});
	}

	function getFriendsPMCReadFunc(req, res, callback) {
		var FRIENDS_LIST_FUNC_QUERY = API.methods.generatePaginatedQuery(req, res, queryValues(req)),
			queryTable = 'friends_tables',
			queryType = 'pmc',
			filterValue = req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123';

		API.methods.generateRawQuery(req, res,
			queryTable,
				"IF(PA.hashField = '" + filterValue + "', null, PA.hashField) AS friend_A_Hash, " +
				"IF(PA.hashField = '" + filterValue + "', null, PA.display_name) AS friend_A_Alias, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.hashField) AS friend_B_Hash, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.display_name) AS friend_B_Alias, " +
				"IF(PA.hashField = '" + filterValue + "', null, PA.side) AS friend_A_Side, " +
				"IF(PB.hashField = '" + filterValue + "', null, PB.side) AS friend_B_Side, " +
				"friends_tables.createdAt AS friends_since",
			"INNER JOIN `pmc_table` AS PA ON friends_tables.friend_a = PA.hashField INNER JOIN `pmc_table` AS PB ON friends_tables.friend_b = PB.hashField",
			"friends_tables.type = '" + queryType + "' AND (" + "PA.hashField = '" + filterValue + "' OR PB.hashField = '" + filterValue + "')",
			FRIENDS_LIST_FUNC_QUERY,
		function(data) {
			var _ = require('lodash'), newRet = [];
			req.query.qIncludeUpgrades = true;

			for (var i=0; i < data.rows.length; i++) { data.rows[i] = _.omitBy(data.rows[i], _.isNull);	}
			for (var i=0; i < data.rows.length; i++) {
				newRet[i] = {
					friendAlias: (data.rows[i].friend_B_Alias || data.rows[i].friend_A_Alias),
					friendHash: (data.rows[i].friend_B_Hash || data.rows[i].friend_A_Hash),
					friendSide: (data.rows[i].friend_A_Side || data.rows[i].friend_B_Side),
					friendSince: (data.rows[i].friends_since),
					PMC: { hashField: (data.rows[i].friend_B_Hash || data.rows[i].friend_A_Hash) }
				};
			}
			UpgradesMethods.handleAssociatedUpgrades(req, res, newRet).then(function(handledUpgrades) {
				data.rows = newRet;
				return callback(data);
			});
		});
	}

	function getFriendsPMCFunc(req, res, callback) {
		var FRIENDS_LIST_FUNC_QUERY = {where: {}, order:[['createdAt', "ASC"]], offset:0, limit:0},
		filterValue = (req.playerInfo.PMC ? req.playerInfo.PMC.hashField : '123');

		FRIENDS_LIST_FUNC_QUERY.where.friendType = 'pmc';
		FRIENDS_LIST_FUNC_QUERY.where.$or = [{ "friendAHash": filterValue }, { "friendBHash": filterValue }];

		mainModel.findAndCountAll(FRIENDS_LIST_FUNC_QUERY).then(function(entries) {
			return callback(entries);
		});
	}

	function getFriendsAllFunc(req, res, callback) {
		getFriendsPlayerFunc(req, res, function(players) {
			getFriendsPMCFunc(req, res, function(pmc) {
				var object = {
					players: players,
					pmc: pmc
				};

				return callback(object);
			});
		});
	}

	function getFriendsAllReadFunc(req, res, callback) {
		getFriendsPlayerReadFunc(req, res, function(players) {
			getFriendsPMCReadFunc(req, res, function(pmc) {
				var object = {
					players: players,
					pmc: pmc
				};

				return callback(object);
			});
		});
	}

	function getFriendsPlayer(req, res) {
		getFriendsPlayerFunc(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getFriendsPMC(req, res) {
		getFriendsPMCFunc(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getFriendsAll(req, res) {
		getFriendsAllFunc(req, res, function(object) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, object);
		});
	}

	function getFriendsPlayerRead(req, res) {
		getFriendsPlayerReadFunc(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getFriendsPMCRead(req, res) {
		getFriendsPMCReadFunc(req, res, function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getFriendsAllRead(req, res) {
		getFriendsAllReadFunc(req, res, function(object) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, object);
		});
	}

})();