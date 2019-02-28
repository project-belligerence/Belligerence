(function(){
	/* jshint shadow:true */
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		TransactionHistoryModel = require('./../index.js').getModels().transaction_history,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Transaction History",
		mainModel = TransactionHistoryModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.getTransactionsSelf = getTransactionsSelf;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['buyer', 'buyer_ip', 'recipient_type', 'recipient', 'seller', 'seller_type', 'type', 'object', 'amount', 'cost', 'details', 'notes', 'createdAt'],
			allowedPostValues: {
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qBuyer) { object.buyer = { $like: "%" + req.query.qBuyer + "%" }; }
				if (req.query.qBuyerIP) { object.buyer_ip = { $like: "%" + req.query.qBuyerIP + "%" }; }
				if (req.query.qRecipientType) { object.recipient_type = { $like: "%" + req.query.qRecipientType + "%" }; }
				if (req.query.qRecipient) { object.recipient = { $like: "%" + req.query.qRecipient + "%" }; }
				if (req.query.qSeller) { object.seller = { $like: "%" + req.query.qSeller + "%" }; }
				if (req.query.qSellerType) { object.seller_type = { $like: "%" + req.query.qSellerType + "%" }; }
				if (req.query.qType) { object.type = { $like: "%" + req.query.qType + "%" }; }
				if (req.query.qDetails) { object.details = { $like: "%" + req.query.qDetails + "%" }; }
				if (req.query.qNotes) { object.notes = { $like: "%" + req.query.qNotes + "%" }; }

				if (req.query.qAmount) { object.amount = { $between: [(req.query.qAmount.min || 0), (req.query.qAmount.max || 9999999)]}; }
				if (req.query.qCost) { object.cost = { $between: [(req.query.qCost.min || 0), (req.query.qCost.max || 9999999)]}; }

				return object;
			}
		};
	}

	function processData(req, res, transactions, done) {
		var foundObjects = {},
			propList = [],
			transactionsRows = transactions.rows;

		for (var i=0; i < transactionsRows.length; i++) {
			var curTransaction = transactionsRows[i],
				curProperty = curTransaction.typeField + "s";
			foundObjects[curProperty] = [];
			API.methods.addIfNew(curProperty, propList);
		}

		for (var i=0; i < transactionsRows.length; i++) {
			var curTransaction = transactionsRows[i],
				curProperty = curTransaction.typeField + "s";
			for (var j=0; j < curTransaction.objectField.length; j++) {
				API.methods.addIfNew(curTransaction.objectField[j], foundObjects[curProperty]);
			}
		}

		API.methods.retrieveModelsRecursive(propList, foundObjects, ['nameField','hashField'], function(validObjects) {

			var rObject = [];

			var dummyProperty = "objectDetails";

			for (var i=0; i < transactionsRows.length; i++) {
				var newObject = {};
				var curTransaction = transactions.rows[i],
					curProp = (curTransaction.typeField + "s");

				newObject = curTransaction.dataValues;
				newObject[dummyProperty] = [];
				newObject.amountField = curTransaction.amountField;

				for (var j=0; j < curTransaction.objectField.length; j++) {
					var curObjectField = curTransaction.objectField[j];

					for (var h=0; h < validObjects[curProp].length; h++) {
						var validObjectsCur = validObjects[curProp][h].dataValues;

						if (curObjectField === validObjectsCur.hashField) {
							newObject[dummyProperty].push(validObjectsCur);
						}
					}
				}
				newObject.objectField = curTransaction.objectField;

				rObject.push(newObject);
			}

			for (var x=0; x < rObject.length; x++) {
				var objectProperties = [],
					curObject = rObject[x];

				for (var z=0; z < curObject[dummyProperty].length; z++) {
					objectProperties.push({
						name: curObject[dummyProperty][z].nameField,
						hash: curObject[dummyProperty][z].hashField,
						amount: parseInt(curObject.amountField[z])
					});
				}
				curObject[dummyProperty] = objectProperties;
			}

			transactions.rows = rObject;

			return done(transactions);
		});
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entries)) { return 0; }
			processData(req, res, entries, function(data) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
			});
		});
	}

	function getTransactionsSelf(req, res) {
		var entity = API.methods.getMainEntity(req),
			queryDone = API.methods.generatePaginatedQuery(req, res, queryValues(req));

		queryDone.where.$or = (function(filter) {
			switch(filter) {
				case 'buyer': return [{buyerHash: {$eq: req.playerInfo.hashField}}];
				case 'recipient': return [{recipientHash: {$eq: entity.entityHash}}];
				case 'both': return [{buyerHash: {$eq: req.playerInfo.hashField}}, {recipientHash: {$eq: entity.entityHash}}];
				default: return [{buyerHash: {$eq: req.playerInfo.hashField}}, {recipientHash: {$eq: entity.entityHash}}];
			}
		})(req.query.qFilter);

		mainModel.findAndCountAll(queryDone).then(function(transactions) {
			if (!API.methods.validate(req, res, [transactions], config.messages().no_entries)) { return 0; }
			processData(req, res, transactions, function(data) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
			});
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var entity = API.methods.getMainEntity(req);

			if (!API.methods.validate(req, res, [
				((entry.buyerHash === req.playerInfo.hashField) || (entry.recipientHash === entity.entityHash)) ||
				(API.methods.validatePlayerPrivilegeFunc(req, config.privileges().tiers.admin))
			], config.messages().bad_permission)) { return 0; }

			processData(req, res, {rows: [entry]}, function(data) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, data);
			});
		});
	}

	function post(req, res, params, done) {

		/*
			This takes a ton of db space and is not currently being used at all.
		*/

		return done();

		// if(!API.methods.validate(req, res, [params])) { return 0; }

		// var update = {};

		// if (params.buyer) update.buyerHash = params.buyer;
		// if (params.buyer_IP) update.buyerIPField = params.buyer_IP;
		// if (params.recipient_type) update.recipientType = params.recipient_type;
		// if (params.recipient) update.recipientHash = params.recipient;
		// if (params.seller) update.sellerHash = params.seller;
		// if (params.seller_type) update.sellerType = params.seller_type;
		// if (params.type) update.typeField = params.type;
		// if (params.object) update.objectField = params.object;
		// if (params.amount) update.amountField = params.amount;
		// if (params.cost) update.costField = params.cost;
		// if (params.details) update.detailsField = params.details;
		// if (params.notes) update.notesField = params.notes;

		// mainModel.sync({force: false}).then(function() { mainModel.create(update).then(function(entry) { return done(); });	});
	}

	function put(req, res) {

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			if (params.buyer) update.buyerHash = params.buyer;
			if (params.buyer_IP) update.buyerIPField = params.buyer_IP;
			if (params.recipient_type) update.recipientType = params.recipient_type;
			if (params.recipient) update.recipientHash = params.recipient;
			if (params.seller) update.sellerHash = params.seller;
			if (params.seller_type) update.sellerType = params.seller_type;
			if (params.type) update.typeField = params.type;
			if (params.object) update.objectField = params.object;
			if (params.amount) update.amountField = params.amount;
			if (params.cost) update.costField = params.cost;
			if (params.details) update.detailsField = params.details;
			if (params.notes) update.notesField = params.notes;

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