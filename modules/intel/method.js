(function(){
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		IntelModel = require('./../index.js').getModels().intel,
		FriendsMethod = require('./../index.js').getMethods().friends,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Intel",
		mainModel = IntelModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.deleteEntry = deleteEntry;
	//exports.getAllLimited = getAllLimited;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'poster_hash', 'title', 'body', 'type', 'visibility', 'totalComments'],
			allowedPostValues: {
				visibility: ["freelancers", "ownPMC", "allPMC", "friends", "friends-PMC", "everyone"],
				displayAs: ["player", "pmc", "anonymous"]
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qDisplay) { object.display = { $like: "%" + req.query.qDisplay + "%" }; }
				if (req.query.qPosterHash) { object.poster_hash = { $like: "%" + req.query.qPosterHash + "%" }; }
				if (req.query.qTitle) { object.title = { $like: "%" + req.query.qTitle + "%" }; }
				if (req.query.qBody) { object.body = { $like: "%" + req.query.qBody + "%" }; }
				if (req.query.qType) { object.type = { $like: "%" + req.query.qType + "%" }; }
				if (req.query.qVisibility) { object.visibility = { $like: "%" + req.query.qVisibility + "%" }; }

				return object;
			}
		};
	}

	function proccessIntelVisibility(req, entry, entriesToFilter) {

		if (!(req.playerInfo)) { return (entry.visibilityField == "everyone"); }

		var ret = false,
			friendList = {};

		switch(entry.visibilityField) {
			case "freelancers": {
				ret = (!(req.playerInfo.PMC));
			} break;
			case "ownPMC": {
				if (req.playerInfo.PMC) {
					var originalPMCHash = "123";
					if (entry.originalPosterDetails) originalPMCHash = (entry.originalPosterDetails || originalPMCHash);
					ret = (req.playerInfo.PMC.hashField == originalPMCHash);
				} else { ret = false; }
			} break;
			case "allPMC": {
				ret = (req.playerInfo.PMCId || false);
			} break;
			case "friends": {
				friendList = req.playerInfo.friendsList.players.rows;
				for (var i=0; i < friendList.length; i++) {
					if ((friendList[i].friendAHash === entry.originalPosterHash) || (friendList[i].friendBHash === entry.originalPosterHash)) { ret = true; }
				}
			} break;
			case "friends-pmc": {
				friendList = req.playerInfo.friendsList.pmc.rows;
				for (var j=0; j < friendList.length; j++) {
					if ((friendList[j].friendAHash === entry.originalPosterDetails.PMCHash) || (friendList[j].friendBHash === entry.originalPosterDetails.PMCHash)) { ret = true; }
				}
			} break;
			case "everyone": {
				ret = true;
			} break;
		}

		if (entry.originalPosterHash === req.playerInfo.hashField) { ret = true; }

		if (!(API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.moderator))) {
			entry.originalPosterHash = null;
			entry.originalPosterDetails = null;
		}

		return ret;
	}

	function proccessCheers(req, cheers) {
		var rCheers = cheers, validPlayerHash;

		validPlayerHash = (req.playerInfo) ? (req.playerInfo.hashField) : "";

		for (var i=0; i < rCheers.length; i++) {
			var curCheer = rCheers[i],
				curCheersDetails = curCheer.cheersDetails;

			curCheer.cheersDetails = {
				amount: curCheersDetails.length,
				cheered: (curCheersDetails.indexOf(validPlayerHash) > -1)
			};
		}

		return rCheers;
	}

	function limitBody(body) {
		return API.methods.limitString(body, config.numbers.modules.intel.bodyLength, config.specialStrings.abbreviator);
	}

	function getAll(req, res) {

		var MainTable = 'intel_tables',
			entity = API.methods.getMainEntity(req),
			baseAttributes = "id, original_poster_hash AS originalPosterHash, poster_hash AS posterHash, display AS displayAs, " +
							 "poster_details AS posterDetails, original_poster_details AS originalPosterDetails, " +
							 "cheers AS cheersDetails, title AS titleField, body AS bodyField, type as typeField, " +
							 "visibility AS visibilityField, hashField ",
			countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
						 	"WHERE comments_tables.subjectField = " + MainTable + ".hashField" +
							") AS totalComments";

		API.methods.generateRawQuery(req, res,
			MainTable,
			baseAttributes + ", " + countQuery + " ",
			"",
			'1',
			API.methods.generatePaginatedQuery(req, res, queryValues(req)),
		function(entries) {
				if (!API.methods.validate(req, res, [entries], config.messages().no_entries)) { return 0; }

			FriendsMethod.getFriendsAllFunc(req, res, function(friendsList) {
				req.playerInfo.friendsList = friendsList;

				var entriesToFilter = [];

				for (var i=0; i < entries.rows.length; i++) {
					entries.rows[i].bodyField = limitBody(entries.rows[i].bodyField);
					if (!(proccessIntelVisibility(req, entries.rows[i]))) { entriesToFilter.push(i); }
				}

				entries.rows = proccessCheers(req, entries.rows);

				if (!(API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin))) {
					for (var i=0; i < entries.rows.length; i++) {
						if (entries.rows[entriesToFilter[i]]) {
							entries.rows[entriesToFilter[i]].originalPosterHash = "Hidden";
							entries.rows[entriesToFilter[i]].posterHash = "Hidden";
							entries.rows[entriesToFilter[i]].displayAs = "Hidden";
							entries.rows[entriesToFilter[i]].posterDetails = "Hidden";
							entries.rows[entriesToFilter[i]].originalPosterDetails = "Hidden";
							entries.rows[entriesToFilter[i]].cheersDetails = "Hidden";
							entries.rows[entriesToFilter[i]].titleField = "Hidden";
							entries.rows[entriesToFilter[i]].bodyField = "Hidden";
							entries.rows[entriesToFilter[i]].typeField = "Hidden";
							entries.rows[entriesToFilter[i]].visibilityField = "Hidden";
							entries.rows[entriesToFilter[i]].hashField = "Hidden";
							entries.rows[entriesToFilter[i]].createdAt = "Hidden";
							entries.rows[entriesToFilter[i]].updatedAt = "Hidden";
						}
					}
				}


				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			FriendsMethod.getFriendsAllFunc(req, res, function(friendsList) {
				req.playerInfo.friendsList = friendsList;

				if (!API.methods.validate(req, res, [
					API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.moderator) ||
					proccessIntelVisibility(req, entry)
				], config.messages().bad_permission)) { return 0; }

				entry = proccessCheers(req, [entry]);

				var CommentsMethods = require('./../index.js').getMethods().comments;

				CommentsMethods.getEntityComments(req, res, "intel_tables", entry[0].dataValues.hashField, function(comments) {
					entry[0].dataValues.comments = comments;
					API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
				});
			});
		});
	}

	function post(req, res) {

		var displayAs = req.body.display_as,
			title = req.body.title,
			body = req.body.body,
			type = req.body.type,
			visibility = req.body.visibility,

			GeneralMethods = require('./../index.js').getMethods().general_methods;

		if(!API.methods.validate(req, res, [displayAs, title, body, type, visibility])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[visibility, 'string', queryValues(req).allowedPostValues.visibility],
			[displayAs, 'string', queryValues(req).allowedPostValues.displayAs],
			[title, 'string', config.numbers.modules.intel.titleLength],
			[body, 'string', config.numbers.modules.intel.bodyMaxLength],
			[type, 'string']
		])) { return 0; }

		var update = {};

		switch (displayAs) {
			case "player": {
				update.posterHash = req.playerInfo.hashField;
			} break;
			case "pmc": {
				if(!API.methods.validate(req, res, [req.playerInfo.PMC], config.messages().modules.pmc.not_in_pmc)) { return 0; }
				update.posterHash = req.playerInfo.PMC.hashField;
			} break;
			case "anonymous": {
				update.posterHash = null;
			} break;
		}

		GeneralMethods.paySystemAction(req, res, 'postIntel', function(success) {
			update.originalPosterHash = req.playerInfo.hashField;
			if (displayAs) update.displayAs = displayAs;
			if (title) update.titleField = title;
			if (body) update.bodyField = body;
			if (type) update.typeField = type;
			if (visibility) update.visibilityField = visibility;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		var displayAs = req.body.displayas,
			title = req.body.title,
			body = req.body.body,
			type = req.body.type,
			visibility = req.body.visibility;

		if (!API.methods.validateParameter(req, res, [
			[visibility, 'string', queryValues(req).allowedPostValues.visibility],
			[displayAs, 'string', queryValues(req).allowedPostValues.displayAs],
			[title, 'string', config.numbers.modules.intel.titleLength],
			[body, 'string', config.numbers.modules.intel.bodyMaxLength],
			[type, 'string']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			if (!API.methods.validate(req, res, [(
				(req.playerInfo.hashField == entry.posterHash) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

			var update = {};

			if (displayAs) update.displayAs = displayAs;
			if (title) update.title = title;
			if (body) update.body = body;
			if (type) update.type = type;
			if (visibility) update.visibility = visibility;

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {'hashField': objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			if (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.janitor) === false) {
				if (req.playerInfo.PMC) {
					if (!API.methods.validate(req, res, [
						(((req.playerInfo.PMC.hashField == entry.posterHash) && (API.methods.validatePlayerPMCTierFunc(req, config.privileges().tiers.moderator))))
					], config.messages().bad_permission)) { return 0; }
				} else {
					if (!API.methods.validate(req, res, [
						(req.playerInfo.hashField == entry.posterHash)
					], config.messages().bad_permission)) { return 0; }
				}
			}

			entry.destroy().then(function(rowDeleted) {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});

			API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
		});
	}

})();