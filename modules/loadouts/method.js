(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		LoadoutsModel = require('./../index.js').getModels().loadouts,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "",
		mainModel = LoadoutsModel;

	exports.post = post;
	exports.getSelfLoadouts = getSelfLoadouts;
	exports.getAll = getAll;
	exports.put = put;
	exports.deleteLoadout = deleteLoadout;
	exports.deployLoadout = deployLoadout;
	exports.toggleLoadoutBookmark = toggleLoadoutBookmark;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name'],
			allowedPostValues: { },
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

	function getSelfLoadouts(req, res) {
		var mainEntity = API.methods.getMainEntity(req);
		mainModel.findAll({where: {'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function toggleLoadoutBookmark(req, res) {
		if(!API.methods.validate(req, res, [req.params.Hash])) { return 0; }

		var mainEntity = API.methods.getMainEntity(req);

		mainModel.findOne({where:{'hashField': req.params.Hash, 'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};
			update.bookmarkField = !(entry.bookmarkField);

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), entry);
				});
			});
		});
	}

	function post(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[req.body.contentField, 'array'],
		], false)) { return 0; }

		for (var i in req.body.contentField) {
			var className = req.body.contentField[i][0],
				amount = req.body.contentField[i][1];
			if (!API.methods.validateParameter(req, res, [[className, 'string'], [amount, 'number'],], true)) { return 0; }
			if(!API.methods.validate(req, res, [(amount > 0)])) { return 0; }
		}

		var mainEntity = API.methods.getMainEntity(req);

		mainModel.findOne({where:{'nameField': req.body.nameField, 'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entry) {

			if (entry) {
				req.params.Hash = entry.hashField;
				return put(req, res);
			} else {

				var update = {};

				if (req.body.nameField) update.nameField = req.body.nameField;
				if (req.body.descriptionField) update.descriptionField = req.body.descriptionField;
				if (req.body.contentField) update.contentField = req.body.contentField;

				update.ownerHash = mainEntity.entityHash;
				update.ownerType = mainEntity.entityType;

				mainModel.sync({force: false}).then(function() {
					mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, "New loadout created.", entry); });
				});
			}
		});
	}

	function put(req, res) {
		if(!API.methods.validate(req, res, [req.params.Hash])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[req.body.contentField, 'array'],
		], false)) { return 0; }

		for (var i in req.body.contentField) {
			var className = req.body.contentField[i][0],
				amount = req.body.contentField[i][1];
			if (!API.methods.validateParameter(req, res, [[className, 'string'], [amount, 'number'],], true)) { return 0; }
			if(!API.methods.validate(req, res, [(amount > 0)])) { return 0; }
		}

		var mainEntity = API.methods.getMainEntity(req);

		mainModel.findOne({where:{'hashField': req.params.Hash, 'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.nameField) update.nameField = req.body.nameField;
			if (req.body.descriptionField) update.descriptionField = req.body.descriptionField;
			if (req.body.contentField) update.contentField = req.body.contentField;

			entry.update(update).then(function() {
				mainModel.sync({force: false}).then(function() {
					return deployLoadout(req, res);
					//API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), entry);
				});
			});
		});
	}

	function deleteLoadout(req, res) {
		if(!API.methods.validate(req, res, [req.params.Hash])) { return 0; }

		var mainEntity = API.methods.getMainEntity(req);

		mainModel.findOne({where:{'hashField': req.params.Hash, 'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

   			entry.destroy().then(function() {
				API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
			});
		});
	}

	function deployLoadout(req, res) {
		if(!API.methods.validate(req, res, [req.params.Hash])) { return 0; }

		var ItemMetods = require('./../index.js').getMethods().items,
			mainEntity = API.methods.getMainEntity(req);

		mainModel.findOne({where:{'hashField': req.params.Hash, 'ownerHash': mainEntity.entityHash, 'ownerType': mainEntity.entityType}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

   			var loadoutContents = entry.contentField;
   			if (!API.methods.validate(req, res, [loadoutContents])) { return 0; }

   			ItemMetods.deployItemsRecursiveFUNC(req, res, loadoutContents, function(done) {
   				API.methods.sendResponse(req, res, true, "Loadout deployed.");
   			});
		});
	}

})();