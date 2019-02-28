(function() {
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		ItemModel = require('./../index.js').getModels().items,
		UpgradesModel = require('./../index.js').getModels().upgrades,
		IntelModel = require('./../index.js').getModels().intel,
		CommentsModel = require('./../index.js').getModels().comments,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "",
		mainModel = CommentsModel;

	exports.getComments = getComments;
	exports.postComment = postComment;
	exports.deleteComment = deleteComment;
	exports.getEntityComments = getEntityComments;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'totalCheers'],
			allowedPostValues: {
				typeValues: ['item', 'upgrade', 'intel', 'player', 'pmc']
			},
			generateWhereQuery:	function(req) {
				var object = {};

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [(entries.length > 0)], config.messages().no_entries)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getComments(req, res) {
		var commentType = req.params.type,
			commentSubject = req.params.subject;

		if (!API.methods.validateParameter(req, res, [
			[commentType, 'string', queryValues(req).allowedPostValues.typeValues],
			[commentSubject, 'string']
		])) { return 0; }

		var subjectTable = (function(v) {
			switch (v) {
				case "item": { return "items_table"; }
				case "upgrade": { return "upgrades_table"; }
				case "intel": { return "intel_table"; }
				case "player": { return "players_table"; }
				case "pmc": { return "pmc_table"; }
			}
		})(commentType);

		if (!API.methods.validate(req, res, [subjectTable])) { return 0; }

		getEntityComments(req, res, subjectTable, commentSubject, function(comments) {
			API.methods.sendResponse(req, res, true, "Returning comments", comments);
		});
	}

	function getEntityComments(req, res, table, hash, done) {
		if (!API.methods.validateParameter(req, res, [[[table, hash], 'string']])) { return 0; }

		var COMMENTS_FUNC_QUERY = {where: {}, order:[[(req.query.commentSort || 'createdAt'), (req.query.commentOrder || 'ASC')]], page: Math.max(((req.query.commentPage) || 0), 0), limit: Math.max((req.query.commentLimit || 99), 1)};

			COMMENTS_FUNC_QUERY.offset = (COMMENTS_FUNC_QUERY.limit * COMMENTS_FUNC_QUERY.page);

		var commenterAttr = "cmt.hashField as commenterHash, cmt.alias as commenterAlias, " +
			"(SELECT COUNT(*) FROM `cheers_tables` WHERE cheers_tables.target = main.hashField) AS totalCheers",
			queryQ = "main.*, " + commenterAttr + " FROM (`comments_tables` main)",
			joinQ =
				"LEFT JOIN (`players_table` cmt) ON (cmt.hashField = main.commenterField)" +
				"LEFT JOIN (`" + table + "` sbj) ON (sbj.hashField = main.subjectField)",
			whereQ = 'sbj.hashField = "' + hash + '"';

		API.methods.generateRawQuery(req, res, [queryQ, "main"], "", joinQ, whereQ, COMMENTS_FUNC_QUERY, function(data) {
			var i,j, mainHashes = [],
				foundModels = data.rows,
				CheersModel = require('./../index.js').getModels().cheers;

			for (i=0; i < foundModels.length; i++) {mainHashes.push(foundModels[i].hashField);}

			CheersModel.findAll({ where: {"targetHash": mainHashes, "senderHash": req.playerInfo.hashField, "typeField": "comment"}}).then(function(cheered) {
				var cheeredHashes = [];

				for (i in cheered) {
					var cheerValue = cheered[i].dataValues;
					cheeredHashes.push(cheerValue.targetHash);
				}

				for (i=0; i < foundModels.length; i++) {
					var comparedHash = foundModels[i].hashField,
						fIndex = cheeredHashes.indexOf(comparedHash);
					data.rows[i].isCheered = (fIndex > -1);
				}

				var _ = require('lodash');
				for (var i in data.rows) {
					data.rows[i] = _.pick(data.rows[i], ['title', 'body', 'commenterHash', 'commenterAlias', 'totalCheers', 'isCheered', 'createdAt', 'hashField']);
				}
				return done(data);
			});
		});
	}

	function validatePost(req, res, player, subject, type, done) {
		if (player.hashField === subject.hashField) {
			return done(true);
		} else {
			if ((type === "pmc") || (type === "players")) {
				var FriendsMethods = require('./../index.js').getMethods().friends,
					MainMethods = require('./../index.js').getMethods()[type];

				FriendsMethods.getFriendsAllFunc(req, res, function(friendsList) {
					req.playerInfo.friendsList = friendsList;

					var allowedPoster = MainMethods.getVisibility(req, (subject.privateVisibility || "nobody"), subject),
						_ = require('lodash'),
						blockComments = (_.indexOf(subject.privateFields, 'blockComments') > -1),
						canPost = false;

					if (blockComments) { canPost = allowedPoster; } else { canPost = true; }

					return done(canPost);
				});
			} else {
				return done(true);
			}
		}
	}

	function postComment(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.body, 'string', config.numbers.modules.comments.bodyMaxLength],
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
			[req.body.subject, 'string']
		])) { return 0; }

		if (req.body.title) {
			if (!API.methods.validateParameter(req, res, [
				[req.body.title, 'string', config.numbers.modules.comments.titleLength]
			])) { return 0; }
		}

		var subjectModel = (function(v) {
			switch (v) {
				case "item": { return ItemModel; }
				case "upgrade": { return UpgradesModel; }
				case "intel": { return IntelModel; }
				case "player": { return PlayerModel; }
				case "pmc": { return PMCModel; }
			}
		})(req.body.type);

		var extraInclude = [{ model: PMCModel, as: 'PMC', attributes: ['displaynameField', 'hashField'] }];

		PlayerModel.findOne({include: extraInclude, where:{hashField: req.playerInfo.hashField}}).then(function(player) {
			if(!API.methods.validate(req, res, [player])) { return 0; }
			if (req.body.type !== 'players') { extraInclude = []; }

			subjectModel.findOne({include: extraInclude, where:{hashField: req.body.subject}}).then(function(subject) {
				if(!API.methods.validate(req, res, [subject])) { return 0; }

				validatePost(req, res, player, subject, req.body.type, function(done) {
					if(!API.methods.validate(req, res, [(done === true)], config.messages().bad_permission)) { return 0; }

					var object = {};

					object.commenterField = player.hashField;
					object.subjectField = subject.hashField;
					object.typeField = req.body.type;
					object.cheersDetails = "";

					if (req.body.body) object.bodyField = req.body.body;
					if (req.body.title) object.titleField = req.body.title;

					CommentsModel.create(object).then(function(entry) {
						API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
					});
				});
			});
		});
	}

	function deleteComment(req, res) {

		if (!API.methods.validateParameter(req, res, [[[req.body.comment], 'string']])) { return 0; }

		var subjectModel = (function(v) {
			switch (v) {
				case "item": { return ItemModel; }
				case "upgrade": { return UpgradesModel; }
				case "intel": { return IntelModel; }
				case "players": { return PlayerModel; }
				case "pmc": { return PMCModel; }
			}
		})(req.body.type);

		var extraInclude = [{ model: PMCModel, as: 'PMC', attributes: ['displaynameField', 'hashField'] }];

		PlayerModel.findOne({include: extraInclude, where:{hashField: req.playerInfo.hashField}}).then(function(player) {
			if(!API.methods.validate(req, res, [player])) { return 0; }
			if (req.body.type !== 'players') { extraInclude = []; }

			mainModel.findOne({where: {hashField: req.body.comment}}).then(function(comment) {
				if(!API.methods.validate(req, res, [comment])) { return 0; }

				var allowDeletion = false;

				allowDeletion = (function(v) {
					switch (v) {
						case "item": { return (req.playerInfo.hashField == comment.commenterField); }
						case "upgrade": { return (req.playerInfo.hashField === comment.commenterField); }
						case "intel": { return (req.playerInfo.hashField === comment.commenterField); }
						case "player": { return ((req.playerInfo.hashField === comment.commenterField) || (req.playerInfo.hashField === comment.subjectField)); }
						case "pmc": {
							var rV = false;
							if (req.playerInfo.PMC) {
								rV = (req.playerInfo.PMC.hashField === comment.subjectField);
							} else { rV = false; }
							return ((req.playerInfo.hashField === comment.commenterField) || rV);
						}
					}
				})(comment.typeField);

				if (API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.janitor)) { allowDeletion = true; }

				if(!API.methods.validate(req, res, [(allowDeletion)], config.messages().bad_permission)) { return 0; }

				comment.destroy().then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
				});
			});
		});
	}

	function put(req, res) {

		// if (!API.methods.validateParameter(req, res, [
		// 	[, 'string', queryValues(req).allowedPostValues.],
		// 	[[], 'string']
		// ])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists(''))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
					});
				});
			});
		});
	}

})();