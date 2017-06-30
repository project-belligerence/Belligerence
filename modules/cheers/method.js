(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		CheersModel = require('./../index.js').getModels().cheers,
		IntelModel = require('./../index.js').getModels().intel,
		CommmentsModel = require('./../index.js').getModels().comments,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Cheer",
		mainModel = CheersModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.deleteEntry = deleteEntry;

	exports.queryValues = queryValues;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'sender', 'target', 'type'],
			allowedPostValues: {
				typeValues: ['intel', 'comment']
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qDisplay) { object.display = { $like: "%" + req.query.qDisplay + "%" }; }
				if (req.query.qSender) { object.sender = { $like: "%" + req.query.qSender + "%" }; }
				if (req.query.qTarget) { object.target = { $like: "%" + req.query.qTarget + "%" }; }
				if (req.query.qType) { object.type = { $like: "%" + req.query.qType + "%" }; }

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

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.target, 'string'],
			[req.body.type, 'string', queryValues(req).allowedPostValues.typeValues],
		], true)) { return 0; }

		var senderModel, targetModel;

		switch (req.body.type) {
			case "intel": {
				senderModel = PlayerModel;
				targetModel = IntelModel;
			} break;
			case "comment": {
				senderModel = PlayerModel;
				targetModel = CommmentsModel;
			} break;
		}

		senderModel.findOne({where:{'hashField': req.playerInfo.hashField}}).then(function(sender) {
			if (!API.methods.validate(req, res, [sender], config.messages().no_entry)) { return 0; }
			targetModel.findOne({where:{'hashField': req.body.target}}).then(function(target) {
				if (!API.methods.validate(req, res, [target], config.messages().no_entry)) { return 0; }

				CheersModel.findOne({where:{'senderHash': sender.hashField, 'targetHash': target.hashField}}).then(function(entry) {

					if (entry) {
						entry.destroy().then(function() {
							API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
						});
					} else {
						var update = {};

						update.senderHash = sender.hashField;
						update.targetHash = target.hashField;
						update.typeField = req.body.type;

						mainModel.sync({force: false}).then(function() {
							mainModel.create(update).then(function(entry) {
								mainModel.findAndCountAll({ where: {"targetHash": target.hashField}}).then(function(new_cheers) {
									entry.dataValues.currentCount = new_cheers.count;
									API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
								});
							});
						});
					}
				});
			});
		});
	}

	function deleteEntry(req, res) {
		if(!API.methods.validate(req, res, [req.body.target])) { return 0; }

		CheersModel.findOne({where:{'senderHash': req.playerInfo.hashField, 'targetHash': req.body.target}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

})();