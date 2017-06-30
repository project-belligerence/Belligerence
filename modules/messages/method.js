(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		MessagesModel = require('./../index.js').getModels().messages,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Messages",
		mainModel = MessagesModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.getSent = getSent;
	exports.getReceived = getReceived;
	exports.put = put;
	exports.countReceived = countReceived;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt','title', 'body', 'read', 'SenderId', 'ReceiverId'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {},
					objectPlayer = {
						receiver: {},
						sender: {}
					};

				if (req.query.qTitle) { object.title = { $like: "%" + req.query.qTitle + "%" }; }

				if (req.query.PARAM_SENT) { object.SenderId = req.playerInfo.id; }
				if (req.query.PARAM_RECEIVED) {
					object.ReceiverId = req.playerInfo.id;
					if (req.query.qRead) { req.query.qRead = ((req.query.qRead == 'true') ? true : false); object.read = { $not: !(req.query.qRead) }; }
				}

				if (req.query.qReceiverAlias) { objectPlayer.receiver.aliasField = { $like: "%" + req.query.qReceiverAlias + "%" }; }
				if (req.query.qReceiverHash) { objectPlayer.receiver.hashField = { $like: "%" + req.query.qReceiverHash + "%" }; }

				if (req.query.qSenderAlias) { objectPlayer.sender.aliasField = { $like: "%" + req.query.qSenderAlias + "%" }; }
				if (req.query.qSenderHash) { objectPlayer.sender.hashField = { $like: "%" + req.query.qSenderHash + "%" }; }

				return {object: object, objectPlayer: objectPlayer};
			}
		};
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({
			where: { "hashField": objectID },
			attributes: { exclude: ['readField'] },
			include: [
				{ model: PlayerModel, as: 'Sender', attributes: ['aliasField', 'hashField'] },
				{ model: PlayerModel, as: 'Receiver', attributes: ['aliasField', 'hashField'] }
			]
		}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			if (!API.methods.validate(req, res, [
				(req.playerInfo.hashField == entry.Sender.hashField) ||
				(req.playerInfo.hashField == entry.Receiver.hashField) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.owner)
			], config.messages().bad_permission)) { return 0; }

			entry.update({readField: true}).then(function() {
				mainModel.sync({force: false}).then(function() {
					var object = {};

					object.title = entry.titleField;
					object.body = entry.bodyField;
					object.hash = entry.hashField;
					object.senderHash = entry.Sender.hashField;
					object.senderName = entry.Sender.aliasField;
					object.receiverHash = entry.Receiver.hashField;
					object.receiverName = entry.Receiver.aliasField;

					if (req.playerInfo.hashField === object.receiverHash) object.read = entry.readField;

					API.methods.sendResponse(req, res, true, config.messages().return_entry, object);
				});
			});
		});
	}

	function getAll(req, res) {

		var queryValuesDone = API.methods.generatePaginatedQuery(req, res, queryValues(req)),

			queryValuesDoneMessage = queryValuesDone.where.object,
			queryValuesDonePlayer = queryValuesDone.where.objectPlayer;

		mainModel.findAndCountAll({
			include: [
				{ model: PlayerModel, as: 'Sender', attributes: ['aliasField', 'hashField'], where: queryValuesDonePlayer.sender },
				{ model: PlayerModel, as: 'Receiver', attributes: ['aliasField', 'hashField'], where: queryValuesDonePlayer.receiver }
			],
			attributes: { exclude: ['bodyField'] },
			where: queryValuesDoneMessage,
			limit: parseInt(queryValuesDone.limit),
			offset: queryValuesDone.offset,
			order: queryValuesDone.order,
		}).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function countReceived(req, res) {
		var queryValuesDone = API.methods.generatePaginatedQuery(req, res, queryValues(req)),

			queryValuesDoneMessage = queryValuesDone.where.object,
			queryValuesDonePlayer = queryValuesDone.where.objectPlayer;

		return mainModel.count({
			include: [
				{ model: PlayerModel, as: 'Receiver', attributes: ['aliasField', 'hashField'], where: { 'hashField': req.playerInfo.hashField } }
			],
			where: {'readField': 0}
		});
	}

	function getSent(req, res) {

		req.query.PARAM_SENT = true;

		var queryValuesDone = API.methods.generatePaginatedQuery(req, res, queryValues(req)),

			queryValuesDoneMessage = queryValuesDone.where.object,
			queryValuesDonePlayer = queryValuesDone.where.objectPlayer;

		mainModel.findAndCountAll({
			include: [
				{ model: PlayerModel, as: 'Sender', attributes: ['aliasField', 'hashField'] },
				{ model: PlayerModel, as: 'Receiver', attributes: ['aliasField', 'hashField'], where: queryValuesDonePlayer.receiver }
			],
			attributes: { exclude: ['bodyField', 'readField'] },
			where: queryValuesDoneMessage,
			limit: parseInt(queryValuesDone.limit),
			offset: queryValuesDone.offset,
			order: queryValuesDone.order,
		}).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_results)) { return 0; }

			mainModel.sync({force: false}).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function getReceived(req, res) {
		req.query.PARAM_RECEIVED = true;

		var queryValuesDone = API.methods.generatePaginatedQuery(req, res, queryValues(req)),

			queryValuesDoneMessage = queryValuesDone.where.object,
			queryValuesDonePlayer = queryValuesDone.where.objectPlayer;

		mainModel.findAndCountAll({
			include: [
				{ model: PlayerModel, as: 'Sender', attributes: ['aliasField', 'hashField'], where: queryValuesDonePlayer.sender },
				{ model: PlayerModel, as: 'Receiver', attributes: ['aliasField', 'hashField'] }
			],
			attributes: { exclude: ['bodyField'] },
			where: queryValuesDoneMessage,
			limit: parseInt(queryValuesDone.limit),
			offset: queryValuesDone.offset,
			order: queryValuesDone.order,
		}).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_results)) { return 0; }

			mainModel.sync({force: false}).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entries);
			});
		});
	}

	function post(req, res) {
		var update = {};

		if (!API.methods.validateParameter(req, res, [
			[req.body.title, 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.body, 'string', config.numbers.modules.messages.maxBodyLength],
			[req.body.receiver, 'string', config.db.hashSize]
		], true)) { return 0; }

		if (!API.methods.validate(req, res, [(req.body.receiver !== req.playerInfo.hashField)], config.messages().modules.messages.message_to_self)) { return 0; }

		if (req.body.title) update.titleField = req.body.title;
		if (req.body.body) update.bodyField = req.body.body;

		PlayerModel.findOne({where: {"hashField": req.playerInfo.hashField}}).then(function(sender) {
		PlayerModel.findOne({where: {"hashField": req.body.receiver}}).then(function(receiver) {

			if (!API.methods.validate(req, res, [sender, receiver])) { return 0; }

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) {

					entry.setReceiver(receiver).then(function() {
						entry.setSender(sender).then(function() {
							API.methods.sendResponse(req, res, true, config.messages().modules.messages.new_message);
						});
					});
				});
			});
		});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.title, 'string', config.numbers.modules.messages.maxTitleLength],
			[req.body.body, 'string', config.numbers.modules.messages.maxBodyLength]
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {

			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			if (!API.methods.validate(req, res, [(req.playerInfo.id == entry.SenderId)], config.messages().bad_permission)) { return 0; }

			var update = {};

			if (req.body.title) update.titleField = req.body.title;
			if (req.body.body) update.bodyField = req.body.body;

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.hashField));
				});
			});
		});
	}

})();