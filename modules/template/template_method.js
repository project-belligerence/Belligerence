(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "",
		mainModel = AnyModule;

	exports.post = post;
	exports.getAll = getAll;
	exports.getLimited = getLimited;
	exports.get = get;
	exports.put = put;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			allowedPostValues: {
				dummyValue: ['value1','value2']
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qDisplay) { object.display = { $like: "%" + req.query.qDisplay + "%" }; }

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

	function getLimited(req, res) {
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

	function post(req, res) {

		if(!API.methods.validate(req, res, [])) { return 0; }

		// if (!API.methods.validateParameter(req, res, [
		// 	[, 'string', queryValues(req).allowedPostValues.]
		// ])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;

			//GeneralMethods.paySystemAction(req, res, 'postIntel', function(success) {
				mainModel.sync({force: false}).then(function() {
					mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
				});
			//});
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