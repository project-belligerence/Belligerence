(function(){
	'use strict';

	var ModifierModel = require('./../index.js').getModels().modifiers,
		ItemMethods = require('./../index.js').getMethods().items,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Modifier",
		mainModel = ModifierModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.setActive = setActive;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt','name','active','discounts_all','discounts_market','discounts_items','discounts_weapons','discounts_vehicles','discounts_upgrades','discounts_bureaucracy','discounts_missions_all','bonus_missions_all'],
			allowedPostValues: {},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }

				if (req.query.qDiscountAll) { object.discounts_all = { $between: [(req.query.qDiscountAll.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountAll.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountMarket) { object.discounts_market = { $between: [(req.query.qDiscountMarket.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountMarket.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountItems) { object.discounts_items = { $between: [(req.query.qDiscountItems.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountItems.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountWeapons) { object.discounts_weapons = { $between: [(req.query.qDiscountWeapons.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountWeapons.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountVehicles) { object.discounts_vehicles = { $between: [(req.query.qDiscountVehicles.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountVehicles.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountUpgrades) { object.discounts_upgrades = { $between: [(req.query.qDiscountUpgrades.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountUpgrades.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountBureaucracy) { object.discounts_bureaucracy = { $between: [(req.query.qDiscountBureaucracy.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountBureaucracy.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qDiscountMissionsAll) { object.discounts_missions_all = { $between: [(req.query.qDiscountMissionsAll.min || config.numbers.modules.modifiers.minDiscount), (req.query.qDiscountMissionsAll.max || config.numbers.modules.modifiers.maxDiscount)]}; }
				if (req.query.qBonusMissionsAll) { object.bonus_missions_all = { $between: [(req.query.qBonusMissionsAll.min || config.numbers.modules.modifiers.minDiscount), (req.query.qBonusMissionsAll.max || config.numbers.modules.modifiers.maxDiscount)]}; }

				return object;
			}
		};
	}

	function setActive(req, res) {

		var modifier = req.body.modifier;
		if (!API.methods.validate(req, res, [modifier])) { return 0; }

		mainModel.findOne({where: {"nameField": modifier }}).then(function(new_active) {
		if (!API.methods.validate(req, res, [new_active], config.messages().no_entry)) { return 0; }

			mainModel.findAll({where: {"activeField": true }}).then(function(active_mods) {
				for (var i=0; i < active_mods.length; i++) {
					active_mods[i].setActiveState(0);
				}
				new_active.setActiveState(true, function() {
					ItemMethods.updateItemsValue(new_active, function() {
						mainModel.sync({force: false}).then(function() {
							API.methods.sendResponse(req, res, true, config.messages().modules.modifiers.activated(modifier), new_active.activeField);
						});
					});
				});
			});
		});
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function get(req, res) {
		var objectName = req.params.Name;

		mainModel.findOne({where: {"nameField": objectName}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function post(req, res) {

		if (!API.methods.validate(req, res, [req.body.name])) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[[req.body.d_all, req.body.d_market, req.body.d_items, req.body.d_weapons, req.body.d_vehicles,
			req.body.d_upgrades, req.body.d_bureaucracy, req.body.d_missions_all, req.body.b_missions_all],
			'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.d_all) update.discountAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_all);
			if (req.body.d_market) update.discountMarket = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_market);
			if (req.body.d_items) update.discountItems = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_items);
			if (req.body.d_weapons) update.discountWeapons = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_weapons);
			if (req.body.d_vehicles) update.discountVehicles = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_vehicles);
			if (req.body.d_upgrades) update.discountUpgrades = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_upgrades);
			if (req.body.d_bureaucracy) update.discountBureaucracy = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_bureaucracy);
			if (req.body.d_missions_all) update.discountMissionsAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_missions_all);
			if (req.body.b_missions_all) update.bonusMissionsAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.b_missions_all);

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.d_all, req.body.d_market, req.body.d_items, req.body.d_weapons, req.body.d_vehicles,
			req.body.d_upgrades, req.body.d_bureaucracy, req.body.d_missions_all, req.body.b_missions_all],
			'number']
		])) { return 0; }

		mainModel.findOne({where:{'nameField': req.params.Name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.d_all) update.discountAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_all);
			if (req.body.d_market) update.discountMarket = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_market);
			if (req.body.d_items) update.discountItems = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_items);
			if (req.body.d_weapons) update.discountWeapons = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_weapons);
			if (req.body.d_vehicles) update.discountVehicles = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_vehicles);
			if (req.body.d_upgrades) update.discountUpgrades = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_upgrades);
			if (req.body.d_bureaucracy) update.discountBureaucracy = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_bureaucracy);
			if (req.body.d_missions_all) update.discountMissionsAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.d_missions_all);
			if (req.body.b_missions_all) update.bonusMissionsAll = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, req.body.b_missions_all);

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists('name'))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						ItemMethods.updateItemsValue(entry, function() {
							API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
						});
					});
				});
			});
		});
	}

})();