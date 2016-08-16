(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		StoreModel = require('./../index.js').getModels().stores,
		StoreLinesModel = require('./../index.js').getModels().store_lines,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Store Line",
		mainModel = StoreLinesModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.getRandomStoreLine = getRandomStoreLine;
	exports.getStoreLines = getStoreLines;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'line', 'change', 'active'],
			allowedPostValues: { },
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qLine) { object.line = { $like: "%" + req.query.qLine + "%" }; }
				if (req.query.qActive) { req.query.qActive = ((req.query.qActive == 'true') ? true : false); object.active = { $not: !(req.query.qActive) }; }
				if (req.query.qChance) { object.chance = { $between: [(req.query.qChance.min || 0), (req.query.qChance.max || 100)]}; }

				if (req.query.qStoreId) { object.storeId = { $like: "%" + req.query.qStoreId + "%" }; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		if (!API.methods.validate(req, res, [(req.playerInfo.playerPrivilege <= config.privileges().tiers.owner)], config.messages().bad_permission)) { return 0; }

		mainModel.findAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
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

		var line = req.body.line,
			chance = req.body.chance,
			active = req.body.active,
			owner = req.params.Hash;

		if (!API.methods.validateParameter(req, res, [
			[[line, owner], 'string'],
			[chance, 'number'],
			[active, 'boolean']
		], true)) { return 0; }

		StoreModel.findOne({where: {"hashField": owner}}).then(function(store) {
			if (!API.methods.validate(req, res, [store], config.messages().no_entry)) { return 0; }

			var update = {};

			update.storeId = store.id;

			if (line) update.lineField = line;
			if (chance) update.chanceField = API.methods.minMax(1, 95, chance);
			if (active) update.activeField = active;

			StoreLinesModel.create(update).then(function(owned_line) {
				API.methods.sendResponse(req, res, true, config.messages().new_entry, owned_line);
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validate(req, res, [(
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.moderator)
		)], config.messages().bad_permission)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[line, 'string'],
			[chance, 'number'],
			[active, 'boolean']
		])) { return 0; }

		StoreModel.findOne({where:{'hashField': (req.body.owner || "")}}).then(function(owner) {
			StoreLinesModel.findOne({where:{'hashField': req.params.Hash}}).then(function(line) {
				if (!API.methods.validate(req, res, [line], config.messages().entry_not_found(req.params.Hash))) { return 0; }

				var update = {};

				if (owner) update.storeId = owner.id;
				if (req.body.line) update.lineField = req.body.line;
				if (req.body.chance) update.chanceField = API.methods.minMax(1, 95, req.body.chance);
				if (req.body.active) update.activeField = req.body.active;

				line.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(line.lineField), line);
					});
				});
			});
		});
	}

	function getStoreLines(req, res) {

		if (!API.methods.validate(req, res, [(
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.moderator)
		)], config.messages().bad_permission)) { return 0; }

		StoreModel.findOne({where: {"hashField": req.params.Hash}}).then(function(store) {
			if (!API.methods.validate(req, res, [store], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			store.getStoreLines().then(function(active_lines) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, active_lines);
			});
		});
	}

	function getRandomStoreLine(req, res) {

		StoreModel.findOne({where: {"hashField": req.params.Hash}}).then(function(store) {
			if (!API.methods.validate(req, res, [store], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			store.getStoreLines({where:{activeField: true}, order: 'chanceField DESC'}).then(function(active_lines) {
				var chosenLine = active_lines[0];

				for (var i = 0; i < active_lines.length; i++) {
					var rNumber = API.methods.getRandomInt(0, 100);
					chosenLine = (rNumber <= active_lines[i].chanceField) ? active_lines[i] : chosenLine;
				}

				API.methods.sendResponse(req, res, true, config.messages().return_entries, chosenLine);
			});
		});
	}

})();