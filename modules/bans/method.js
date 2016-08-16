(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		BansModel = require('./../index.js').getModels().bans,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Ban",
		mainModel = BansModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;

	exports.queryValues = queryValues;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'issuer', 'banned', 'expiration_date','active'],
			allowedPostValues: {
				activeField: [true, false]
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qBanned) { object.banned = { $like: "%" + req.query.qBanned + "%" }; }
				if (req.query.qIssuer) { object.issuer = { $like: "%" + req.query.qIssuer + "%" }; }
				if (req.query.qReason) { object.reason = { $like: "%" + req.query.qReason + "%" }; }
				if (req.query.qExpiration) { object.expiration_date = { $like: "%" + req.query.qExpiration + "%" }; }
				if (req.query.qActive) { object.active = { $like: "%" + req.query.qActive + "%" }; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
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
		if(!API.methods.validate(req, res, [req.body.banned, req.body.days])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.banned, 'string'],
			[req.body.days, 'number'],
			[req.body.reason, 'string', [0, config.numbers.modules.bans.reasonLength]]
		])) { return 0; }

		if(!API.methods.validate(req, res, [(req.body.banned !== req.playerInfo.hashField)])) { return 0; }
		if(!API.methods.validate(req, res, [(req.body.days > 0)])) { return 0; }

		PlayerModel.findOne({where:{'hashField': req.body.banned}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(req.body.banned))) { return 0; }

			var update = {},
				expirationDate = new Date();

			update.bannedHash = req.body.banned;
			update.issuerHash = req.playerInfo.hashField;
			update.reasonField = (req.body.reason || config.messages().modules.bans.no_reason);

			update.expirationDate = expirationDate.setHours(expirationDate.getHours() + (req.body.days * 24));

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.days, 'number'],
			[req.body.active, 'boolean'],
			[req.body.reason, 'string', [0, config.numbers.modules.bans.reasonLength]]
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.reason) update.reasonField = req.body.reason;
			if (req.body.active) update.activeField = req.body.active;
			if (req.body.days) {
				var expirationDate = entry.createdAt;
				update.expirationDate = expirationDate.setHours(expirationDate.getHours() + (req.body.days * 24));
			}

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(req.params.Hash), entry);
				});
			});
		});
	}

})();