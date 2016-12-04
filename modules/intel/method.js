(function(){
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		IntelModel = require('./../index.js').getModels().intel,
		CheersModel = require('./../index.js').getModels().cheers,
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

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'poster_hash', 'title', 'body', 'type', 'visibility', 'totalComments'],
			allowedPostValues: {
				visibility: ["freelancers", "ownPMC", "allPMC", "friends", "friends-PMC", "everyone"],
				displayAs: ["player", "pmc", "anonymous"],
				types: ['statement', 'intel', 'certification']
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

		if (req.playerInfo.id === -1) { return (entry.visibilityField == "everyone"); }

		var ret = false,
			friendList = {};

		switch(entry.visibilityField) {
			case "freelancers": {
				ret = (!(req.playerInfo.PMC));
			} break;
			case "ownPMC": {
				if (req.playerInfo.PMC) {
					var originalPMCHash = (entry.originalPosterDetails ? entry.originalPosterDetails.PMCHash : "123");
					ret = (req.playerInfo.PMC.hashField === originalPMCHash);
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
				cheered: (curCheersDetails.indexOf(validPlayerHash) > (-1))
			};
		}

		return rCheers;
	}

	function limitBody(body) {
		return API.methods.limitString(body, config.numbers.modules.intel.bodyLength, config.specialStrings.abbreviator);
	}

	function getAll(req, res) {

		req.serverValues = {};
		req.serverValues.contextLimit = config.numbers.modules.intel.queryLimit;

		var MainTable = 'intel_tables',
			entity = API.methods.getMainEntity(req),
			baseAttributes = "id, original_poster_hash AS originalPosterHash, poster_hash AS posterHash, display AS displayAs, " +
							 "poster_details AS posterDetails, original_poster_details AS originalPosterDetails, " +
							 "cheers AS cheersDetails, title AS titleField, body AS bodyField, type as typeField, " +
							 "visibility AS visibilityField, hashField," +
							 "createdAt as createdAt ",
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

				var	foundModels = [],
					foundModelsHashes = [],
					posterHashes = [],
					originalPosterHashes = []
				;

				foundModels = entries.rows;

				for (var i=0; i < foundModels.length; i++) {
					posterHashes.push(foundModels[i].posterHash);
					originalPosterHashes.push(foundModels[i].originalPosterHash);
					foundModelsHashes.push(foundModels[i].hashField);
				}

				CheersModel.findAll({ where: {"targetHash": foundModelsHashes}}).then(function(cheers) {
		 			for (var i=0; i < foundModels.length; i++) {
		 				var modelCheers = [],
		 					currentModel = foundModels[i];

		 				for (var j=0; j < cheers.length; j++) {
		 					if (cheers[j].targetHash == currentModel.hashField) {
		 						modelCheers.push(cheers[j].senderHash);
		 					}
		 				}
		 				currentModel.cheersDetails = modelCheers;
		 			}

					PlayerModel.findAll({ where: {"hashField": originalPosterHashes}, include: [ { model: PMCModel, as: 'PMC', attributes: ['hashField'] } ]}).then(function(original_posters) {
						PlayerModel.findAll({ where: {"hashField": posterHashes}}).then(function(players) {
							PMCModel.findAll({ where: {"hashField": posterHashes}}).then(function(pmc) {

								for (var i=0; i < foundModels.length; i++) {
									var currentModel = foundModels[i];
									for (var j=0; j < original_posters.length; j++) {
										if (currentModel.originalPosterHash === original_posters[j].hashField) {
											currentModel.originalPosterDetails = {
												"alias": original_posters[j].aliasField,
												"PMCHash": (original_posters[j].PMC ? original_posters[j].PMC.hashField : 'freelancer')
											};
										}
									}
									switch (currentModel.displayAs) {
										case "player": {
											for (var g=0; g < players.length; g++) {
												if (currentModel.posterHash === players[g].hashField) {
													currentModel.posterDetails = {
														"alias": players[g].aliasField
													};
												}
											}
										} break;
										case "pmc": {
											for (var x=0; x < pmc.length; x++) {
												if (currentModel.posterHash === pmc[x].hashField) {
													currentModel.posterDetails = {
														"alias": pmc[x].displaynameField
													};
												}
											}
										} break;
										case "anonymous": { currentModel.posterDetails = {alias: "Anonymous"}; }
									}
								}

								var entriesToFilter = [];

								for (var i=0; i < foundModels.length; i++) {
									foundModels[i].bodyField = limitBody(foundModels[i].bodyField);
									if (!(proccessIntelVisibility(req, foundModels[i]))) { entriesToFilter.push(i); }
								}

								foundModels = proccessCheers(req, foundModels);

								if (!(API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin))) {
									for (var i=0; i < foundModels.length; i++) {
										if (foundModels[entriesToFilter[i]]) {
											var hiddenMsg = config.messages().modules.intel.hidden;

											foundModels[entriesToFilter[i]].originalPosterHash = hiddenMsg;
											foundModels[entriesToFilter[i]].posterHash = hiddenMsg;
											foundModels[entriesToFilter[i]].displayAs = hiddenMsg;
											foundModels[entriesToFilter[i]].posterDetails = hiddenMsg;
											foundModels[entriesToFilter[i]].originalPosterDetails = hiddenMsg;
											foundModels[entriesToFilter[i]].cheersDetails = hiddenMsg;
											foundModels[entriesToFilter[i]].titleField = hiddenMsg;
											foundModels[entriesToFilter[i]].bodyField = hiddenMsg;
											foundModels[entriesToFilter[i]].typeField = hiddenMsg;
											foundModels[entriesToFilter[i]].visibilityField = hiddenMsg;
											foundModels[entriesToFilter[i]].hashField = hiddenMsg;
											foundModels[entriesToFilter[i]].createdAt = hiddenMsg;
											foundModels[entriesToFilter[i]].updatedAt = hiddenMsg;
										}
									}
								}

								API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
							});
						});
					});
				});
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
			[type, 'string', queryValues(req).allowedPostValues.types]
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
			[type, 'string', queryValues(req).allowedPostValues.types]
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			if (!API.methods.validate(req, res, [(
				(req.playerInfo.hashField == entry.posterHash) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

			var update = {};

			if (displayAs) {
				update.displayAs = displayAs;

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
			}

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