(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		StoreModel = require('./../index.js').getModels().stores,
		ItemModel = require('./../index.js').getModels().items,
		StoreStockModel = require('./../index.js').getModels().store_stock,
		UpgradesMethods = require('./../index.js').getMethods().upgrades,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Store",
		mainModel = StoreModel;

	exports.post = post;
	exports.getAll = getAll;
	exports.get = get;
	exports.put = put;
	exports.getStoreStock = getStoreStock;
	exports.addStoreStock = addStoreStock;
	exports.updateStoreStock = updateStoreStock;
	exports.updateStoreStockRecursive = updateStoreStockRecursive;
	exports.validateStore = validateStore;
	exports.getStoreStockFUNC = getStoreStockFUNC;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'subtitle', 'description', 'status', 'prestige'],
			allowedPostValues: {
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (req.query.qSubtitle) { object.subtitle = { $like: "%" + req.query.qSubtitle + "%" }; }
				if (req.query.qTypes) { object.types = { $like: "%" + req.query.qTypes + "%" }; }
				if (req.query.qDescription) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (req.query.qStatus) { object.status = { $like: "%" + req.query.qStatus + "%" }; }

				if (req.query.qReqPrestige) { object.prestige = { $between: [(req.query.qReqPrestige.min || 0), (req.query.qReqPrestige.max || 9999999)]}; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entries)) { return 0; }

			UpgradesMethods.getAssociatedUpgrades(entries.rows, function(nEntries) {
				entries.rows = nEntries;
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			UpgradesMethods.getAssociatedUpgrades([entry], function(nEntries) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, nEntries[0]);
			});
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[
				req.body.name,
				req.body.subtitle,
				req.body.description,
				req.body.picture,
				req.body.types
			], 'string'],
			[[
				req.body.prestige,
				req.body.status,
			], 'number']
		], true)) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.subtitle) update.subTitleField = req.body.subtitle;
			if (req.body.description) update.descriptionField = req.body.description;
			if (req.body.picture) update.pictureField = req.body.picture;
			if (req.body.types) update.typesField = req.body.types;
			if (req.body.prestige) update.prestigeRequired = req.body.prestige;
			if (req.body.status) update.statusField = req.body.status;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[
				req.body.name,
				req.body.subtitle,
				req.body.description,
				req.body.picture,
				req.body.types
			], 'string'],
			[[
				req.body.prestige,
				req.body.status,
			], 'number']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.subtitle) update.subTitleField = req.body.subtitle;
			if (req.body.description) update.descriptionField = req.body.description;
			if (req.body.picture) update.pictureField = req.body.picture;
			if (req.body.types) update.typesField = req.body.types;
			if (req.body.prestige) update.prestigeRequired = req.body.prestige;
			if (req.body.status) update.statusField = req.body.status;

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists(''))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), entry);
					});
				});
			});
		});
	}

	function getStoreStockFUNC(req, res, qStore, done) {
		var objectID = qStore;

		mainModel.findOne({where: {"hashField": objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var ItemQueryValues = require('./../index.js').getMethods().items.queryValues(req);

			ItemQueryValues.allowedSortValues.push('amount', 'discount', 'store_price');

			var ItemDoneQuery = API.methods.generatePaginatedQuery(req, res, ItemQueryValues),
				storePriceClause = "(items_tables.current_price - (items_tables.current_price*((store_discount))/100))",
				storePriceQuery = "";

			if (req.query.qAmount) { ItemDoneQuery.where.amount = { $between: [(req.query.qAmount.min || 0), (req.query.qAmount.max || 9999999)]}; }
			if (req.query.qDiscount) { ItemDoneQuery.where.store_discount = { $between: [(req.query.qDiscount.min || 0), (req.query.qDiscount.max || 9999999)]}; }
			if (req.query.qStorePrice) { storePriceQuery = "AND " + storePriceClause + " BETWEEN " + (req.query.qStorePrice.min || 0) + " AND " + (req.query.qStorePrice.max || 9999999); }

			API.methods.generateRawQuery(req, res,
					'store_stocks',
					'*, ' + storePriceClause + ' AS store_price ',
					"LEFT JOIN `items_tables` ON store_stocks.itemId = items_tables.id",
					"(store_stocks.storeId = " + entry.id + ") AND (store_stocks.available = 1) " + storePriceQuery,
				ItemDoneQuery, function(data) {
					return done(data);
			});
		});
	}

	function getStoreStock(req, res) {
		getStoreStockFUNC(req, res, req.params.Hash, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function addStoreStock(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.item, 'string'],
			[[req.body.amount, (req.body.discount || 0)], 'number'],
			[req.body.available, 'boolean']
		], true)) { return 0; }

		var ItemID = req.body.item,
			StoreID = req.params.Hash;

		if(!API.methods.validate(req, res, [ItemID, StoreID])) { return 0; }

		mainModel.findOne({where: {"hashField":StoreID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(StoreID))) { return 0; }
		ItemModel.findOne({where: {"hashField": ItemID}}).then(function(item) {
			if (!API.methods.validate(req, res, [item], config.messages().entry_not_found(ItemID))) { return 0; }

		StoreStockModel.findOne({where:{'storeId': entry.id, 'itemId': item.id}}).then(function(owned_item) {
			if (!API.methods.validate(req, res, [!(owned_item)], config.messages().modules.stores.item_owned)) { return 0; }

			entry.addItem(item, {
					amountField: (req.body.amount || 0),
					discountField: (req.body.discount || 0),
					availableField: (req.body.available || true)
				}).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().new_entry);
			});
		});
		});
		});
	}

	function updateStoreStock(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[req.body.item, req.body.amount, (req.body.discount || 0)], 'number'],
			[req.body.available, 'boolean']
		])) { return 0; }

		var ItemID = req.body.item,
			StoreID = req.params.Hash;

		if(!API.methods.validate(req, res, [ItemID, StoreID])) { return 0; }

		mainModel.findOne({where: {"hashField": StoreID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(StoreID))) { return 0; }
		ItemModel.findOne({where: {"hashField": ItemID}}).then(function(item) {
			if (!API.methods.validate(req, res, [item], config.messages().entry_not_found(ItemID))) { return 0; }

		StoreStockModel.findOne({where:{'storeId': entry.id, 'itemId': item.id}}).then(function(owned_item) {
			if (!API.methods.validate(req, res, [(owned_item)], config.messages().modules.stores.item_not_owned)) { return 0; }

			var update = {};

			if (req.body.amount) update.amountField = API.methods.minMax(config.numbers.modules.stock.minAmount, config.numbers.modules.stock.maxAmount, (owned_item.amountField + parseInt(req.body.amount)));
			if (req.body.discount) update.discountField = req.body.discount;
			if (req.body.available) update.availableField = req.body.available;

			owned_item.update(update).then(function(owned_stock) {
				StoreStockModel.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), owned_stock);
				});
			});
		});
		});
		});
	}

	function updateStoreStockRecursive(store, items, amounts, operation, done) {
		var loopItems = items;

		if (loopItems.length > 0) {
			var currentItem = loopItems[0],
				currentAmount = amounts[0];

			StoreStockModel.findOne({where:{'storeId': store.id, 'itemId': currentItem.id}}).then(function(owned_item) {
				var update = {},
					finalNumber = operation == "sum" ? (owned_item.amountField + parseInt(currentAmount)) : (owned_item.amountField - parseInt(currentAmount));

				update.amountField = API.methods.minMax(config.numbers.modules.stock.minAmount, config.numbers.modules.stock.maxAmount, finalNumber);

				owned_item.update(update).then(function() {
					StoreStockModel.sync({force: false}).then(function() {
						var newLoopItems = JSON.parse(JSON.stringify(loopItems)),
							newLoopAmounts = JSON.parse(JSON.stringify(amounts));

						newLoopItems.splice(0, 1);
						newLoopAmounts.splice(0, 1);
						return updateStoreStockRecursive(store, newLoopItems, newLoopAmounts, operation, done);
					});
				});
			});
		} else { return done(true); }
	}

	function validateStore(req, res, p_store, b_prestige, done) {
		mainModel.findOne({where: {"hashField": p_store}}).then(function(store) {
			if (!API.methods.validate(req, res, [store], config.messages().entry_not_found(p_store))) { return 0; }

			var statusMessage = "OK";

			if (!API.methods.validate(req, res, [(b_prestige >= store.prestigeRequired)], config.messages().modules.stores.low_prestige)) { return 0; }

			switch(true) {
				case (store.statusField === config.enums.status.DEAD): { statusMessage = config.messages().modules.stores.status.dead; } break;
				case (store.statusField === config.enums.status.WOUNDED): { statusMessage = config.messages().modules.stores.status.wounded; } break;
				case (store.statusField === config.enums.status.MISSING): { statusMessage = config.messages().modules.stores.status.missing; } break;
			}
			if (!API.methods.validate(req, res, [(statusMessage === "OK")], statusMessage)) { return 0; }

			return done(store);
		});
	}

})();