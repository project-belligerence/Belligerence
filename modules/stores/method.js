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
	exports.getStoreSpecializations = getStoreSpecializations;
	exports.getStoreStatuses = getStoreStatuses;
	exports.getStoreStock = getStoreStock;
	exports.getStoreFromItem = getStoreFromItem;
	exports.getStoreStockAdmin = getStoreStockAdmin;
	exports.addStoreStock = addStoreStock;
	exports.updateStoreStock = updateStoreStock;
	exports.removeStoreStock = removeStoreStock;
	exports.updateStoreStockRecursive = updateStoreStockRecursive;
	exports.getStoresAndItems = getStoresAndItems;
	exports.validateStore = validateStore;
	exports.updateStoreStockRecursiveRoute = updateStoreStockRecursiveRoute;
	exports.resupplyStore = resupplyStore;
	exports.getStoreStockFUNC = getStoreStockFUNC;
	exports.reRollStoreStockFUNC = reRollStoreStockFUNC;
	exports.healWoundedStoresFunc = healWoundedStoresFunc;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt', 'name', 'subtitle', 'description', 'status', 'resupply', 'prestige'],
			allowedPostValues: {
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qSubtitle)) { object.subtitle = { $like: "%" + req.query.qSubtitle + "%" }; }
				if (API.methods.isValid(req.query.qTypes)) { object.types = { $like: "%" + req.query.qTypes + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qStatus)) { object.status = { $like: "%" + req.query.qStatus + "%" }; }
				if (API.methods.isValid(req.query.qResupply)) { object.resupply = { $like: "%" + req.query.qResupply + "%" }; }

				if (API.methods.isValid(req.query.qReqPrestige)) { req.query.qReqPrestige = JSON.parse(req.query.qReqPrestige); object.prestige = { $between: [(req.query.qReqPrestige.min || 0), (req.query.qReqPrestige.max || 9999999)]}; }

				return object;
			}
		};
	}

	function getStoreSpecializations(req, res) {
		var rObject = {};
		rObject.typesField = config.enums.store_types;
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getStoreStatuses(req, res) {
		var rObject = [{text: "Alive", data: 0},{text: "Dead", data: 1},{text: "Wounded", data: 2},{text: "Missing", data: 3}];
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function getAll(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 999;

		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entries)) { return 0; }

			var rEntries = API.methods.cloneArray(entries.rows);

			UpgradesMethods.getAssociatedUpgrades(entries.rows, function(nEntries) {
				rEntries.requiredUpgrades = nEntries.requiredUpgrades;
				rEntries.blacklistedUpgrades = nEntries.blacklistedUpgrades;
				API.methods.sendResponse(req, res, true, config.messages().return_entry, rEntries);
			});
		});
	}

	function getStoresAndItems(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.body.items, req.body.stores], 'array']])) { return 0; }

		ItemModel.findAll({ include: [mainModel], where: { hashField: req.body.items}}).then(function(items) {
			mainModel.findAll({ where: { hashField: req.body.stores}}).then(function(stores) {
				if (!API.methods.validate(req, res, [items, stores], config.messages().no_entry)) { return 0; }
				var rObject = {stores: stores, items: items};
				API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
			});
		});
	}

	function getCheckoutPrice(req, res) {
		if (!API.methods.validateParameter(req, res, [[[req.body.cart], 'array']])) { return 0; }
	}

	function get(req, res) {
		var objectID = req.params.Hash;

		mainModel.findOne({where: {"hashField":objectID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			UpgradesMethods.getAssociatedUpgrades([entry], function(nEntries) {
				API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
			});
		});
	}

	function post(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[[
				req.body.nameField,
				req.body.subTitleField,
				req.body.descriptionField
			], 'string'],
			[[
				req.body.prestigeRequired,
				req.body.statusField
			], 'number']
		], true)) { return 0; }

		if (!API.methods.validate(req, res, [(req.body.typesField.length > 0)], "Stores require at least one specialization.")) { return 0; }
		if (!API.methods.validate(req, res, [(req.body.resupplyDay.length > 0)], "The store must be re-supplied at least once a week.")) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.nameField}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.requiredUpgrades)) {
				if (req.body.requiredUpgrades === []) {
					update.requiredUpgradesField = [];
				} else { update.requiredUpgradesField = UpgradesMethods.loopThroughRequired(req.body.requiredUpgrades); }
			}

			if (API.methods.isValid(req.body.blacklistedUpgrades)) {
				if (req.body.blacklistedUpgrades === []) {
					update.blacklistedUpgradesField = [];
				} else { update.blacklistedUpgradesField = UpgradesMethods.loopThroughRequired(req.body.blacklistedUpgrades); }
			}

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.subTitleField)) update.subTitleField = req.body.subTitleField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.typesField)) update.typesField = req.body.typesField;
			if (API.methods.isValid(req.body.prestigeRequired)) update.prestigeRequired = req.body.prestigeRequired;
			if (API.methods.isValid(req.body.statusField)) update.statusField = req.body.statusField;
			if (API.methods.isValid(req.body.resupplyDay)) update.resupplyDay = req.body.resupplyDay;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[[
				req.body.nameField,
				req.body.subTitleField,
				req.body.descriptionField
			], 'string'],
			[[
				req.body.prestigeRequired,
				req.body.statusField
			], 'number']
		], true)) { return 0; }

		if (!API.methods.validate(req, res, [(req.body.typesField.length > 0)], "Stores require at least one specialization.")) { return 0; }
		if (!API.methods.validate(req, res, [(req.body.resupplyDay.length > 0)], "The store must be re-supplied at least once a week.")) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.requiredUpgrades)) {
				if (req.body.requiredUpgrades === []) {
					update.requiredUpgradesField = [];
				} else { update.requiredUpgradesField = UpgradesMethods.loopThroughRequired(req.body.requiredUpgrades); }
			}

			if (API.methods.isValid(req.body.blacklistedUpgrades)) {
				if (req.body.blacklistedUpgrades === []) {
					update.blacklistedUpgradesField = [];
				} else { update.blacklistedUpgradesField = UpgradesMethods.loopThroughRequired(req.body.blacklistedUpgrades); }
			}

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.subTitleField)) update.subTitleField = req.body.subTitleField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.typesField)) update.typesField = req.body.typesField;
			if (API.methods.isValid(req.body.prestigeRequired)) update.prestigeRequired = req.body.prestigeRequired;
			if (API.methods.isValid(req.body.statusField)) update.statusField = req.body.statusField;
			if (API.methods.isValid(req.body.resupplyDay)) update.resupplyDay = req.body.resupplyDay;

			var STORES_FUNC_QUERY = { where: {} };
			STORES_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }];

			mainModel.findOne(STORES_FUNC_QUERY).then(function(duplicate) {
				if (!API.methods.validate(req, res, [(duplicate ? (entry.hashField === duplicate.hashField) : true)], config.messages().entry_exists(req.body.nameField))) { return 0; }

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
				storePriceQuery = "",
				limitToAvailable = "AND (store_stocks.available = 1) ",
				availableQuery = (req.serverValues ? (req.serverValues.adminMode ? "" : limitToAvailable) : limitToAvailable);

			if (req.query.qAmount) { ItemDoneQuery.where.amount = { $between: [(req.query.qAmount.min || 0), (req.query.qAmount.max || 9999999)]}; }
			if (req.query.qDiscount) { ItemDoneQuery.where.store_discount = { $between: [(req.query.qDiscount.min || 0), (req.query.qDiscount.max || 9999999)]}; }
			if (req.query.qStorePrice) { storePriceQuery = "AND " + storePriceClause + " BETWEEN " + (req.query.qStorePrice.min || 0) + " AND " + (req.query.qStorePrice.max || 9999999); }

			API.methods.generateRawQuery(req, res,
					'store_stocks',
					'*, ' + storePriceClause + ' AS store_price ',
					"LEFT JOIN `items_tables` ON store_stocks.itemId = items_tables.id",
					"(store_stocks.storeId = " + entry.id + ") " + availableQuery + storePriceQuery,
				ItemDoneQuery, function(data) {
					return done(data);
			});
		});
	}

	function getStoreStock(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 999;
		getStoreStockFUNC(req, res, req.params.Hash, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function getStoreFromItem(req, res) {
		var ItemID = req.params.Hash;
		if(!API.methods.validate(req, res, [ItemID])) { return 0; }

		var ITEM_QUERY = { where: { "hashField": ItemID } };
		ITEM_QUERY.include = { model: mainModel, where: {
			'$stores.store_stock.available$': true, '$stores.store_stock.amount$': { $gt: (req.body.minAmount || 0) }
		}};

		ItemModel.findOne({where: {"hashField": ItemID}}).then(function(oItem) {
			if (!API.methods.validate(req, res, [oItem], config.messages().entry_not_found(ItemID))) { return 0; }

			ItemModel.findOne(ITEM_QUERY).then(function(item) {
				if (item) {
					var rEntries = API.methods.cloneArray(item.stores);
					UpgradesMethods.getAssociatedUpgrades(rEntries, function(nEntries) {
						API.methods.sendResponse(req, res, true, "", (item || oItem));
					});
				} else { API.methods.sendResponse(req, res, true, "", oItem); }
			});
		});
	}

	function getStoreStockAdmin(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 999;
		req.serverValues.adminMode = true;

		getStoreStockFUNC(req, res, req.params.Hash, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function addStoreStock(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.item, 'string'],
			[[req.body.amount, (req.body.discount || 0)], 'number'],
			[req.body.available, 'boolean']
		], false)) { return 0; }

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

	function removeStoreStock(req, res) {
		if (!API.methods.validateParameter(req, res, [[req.body.item, 'string']], true)) { return 0; }

		var ItemID = req.body.item,
			StoreID = req.params.Hash;

		if(!API.methods.validate(req, res, [ItemID, StoreID])) { return 0; }

		mainModel.findOne({where: {"hashField": StoreID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(StoreID))) { return 0; }
		ItemModel.findOne({where: {"hashField": ItemID}}).then(function(item) {
			if (!API.methods.validate(req, res, [item], config.messages().entry_not_found(ItemID))) { return 0; }

		StoreStockModel.findOne({where:{'storeId': entry.id, 'itemId': item.id}}).then(function(owned_item) {
			if (!API.methods.validate(req, res, [owned_item], config.messages().modules.stores.item_not_owned)) { return 0; }
			owned_item.destroy().then(function() { API.methods.sendResponse(req, res, true, config.messages().entry_deleted); });
		});
		});
		});
	}

	function calculateStockProperties(object) {
		var _ = require("lodash"),
			liquidationMargin = config.numbers.modules.stores.liquidationMargin,
			newSupplyPercent = _.random(object.minSupplyPercent, 100),
			newAmount = ((object.supplyAmount * newSupplyPercent) / 100),
			restockMargin = ((((object.amountField / newAmount) * 100) - 100) *-1),
			demandFluct = ((restockMargin - liquidationMargin) / 5),
			newDiscount = (_.random(((object.discountDeviation / 2) *-1), object.discountDeviation) - demandFluct),
			updateObject = { amountField: newAmount, discountField: newDiscount };
		return object.update(updateObject);
	}

	function resupplyStore(req, res) {
		mainModel.findOne({where: {"hashField": req.params.Hash}}).then(function(store) {
			if (!API.methods.validate(req, res, [store], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			StoreStockModel.findAll({where:{'storeId': store.id}}).then(function(owned_items) {
				console.log("\n\n=======================");
				Promise.all(owned_items.map(calculateStockProperties)).then(function(result) {
					StoreStockModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(store.nameField));
					});
				});
			});
		});
	}

	function reRollStoreStockFUNC(weekDay, callback) {
		mainModel.findAll({where: {"resupplyDay": {$like: "%"+ weekDay + "%"}}}).then(function(entries) {

			console.log("=========================");
			entries.map(function(object) {
				console.log("=== Today (" + weekDay + ") resupplies:", object.nameField);
			});
			console.log("=========================");

			reRollStoreStockRecursiveFUNC(entries, function() {
				console.log("=========================");
				console.log("Supplies delivered and stores re-stocked.");
				console.log("=========================");
			});
		});
	}

	function reRollStoreStockRecursiveFUNC(stores, callback) {
		var _ = require("lodash");

		if (stores.length > 0) {
			var currentStore = stores[0];
			StoreStockModel.findAll({where:{'storeId': currentStore.id}}).then(function(owned_items) {
				Promise.all(owned_items.map(calculateStockProperties)).then(function(result) {
					var newLoopStores = JSON.parse(JSON.stringify(stores)),
						nParams = {};
					newLoopStores.splice(0, 1);
					nParams = newLoopStores;
					return reRollStoreStockRecursiveFUNC(nParams, callback);
				});
			});
		} else { return callback(true); }
	}

	function updateStoreStock(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[
				[
					(req.body.amount || 0),
					(req.body.discount || 0),
					(req.body.discount_deviation || 0),
					(req.body.supply_amount || 0),
					(req.body.min_supply_percent || 0)
				], 'number'],
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
			if (req.body.supply_amount) update.supplyAmount = API.methods.minMax(config.numbers.modules.stock.minAmount, config.numbers.modules.stock.maxAmount, (owned_item.supplyAmount + parseInt(req.body.amount)));
			if (req.body.discount) update.discountField = API.methods.minMax(-1000, 99, (parseInt(req.body.discount)));
			if (req.body.min_supply_percent) update.minSupplyPercent = API.methods.minMax(0, 100, (parseInt(req.body.min_supply_percent)));
			if (req.body.discount_deviation) update.discountDeviation = API.methods.minMax(0, 99, (parseInt(req.body.discount_deviation)));
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

	function updateStoreStockRecursiveRoute(req, res) {
		if (!API.methods.validate(req, res, [(req.body.parameters.items)])) { return 0; }
		if (!API.methods.validate(req, res, [((req.body.parameters.items.length > 0) && (req.body.parameters.amounts.length > 0))])) { return 0; }

		var StoreID = req.params.Hash;
		if(!API.methods.validate(req, res, [StoreID])) { return 0; }

		mainModel.findOne({where: { "hashField": StoreID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(StoreID))) { return 0; }
			var _ = require("lodash");

			ItemModel.findAll({ where: {"hashField": _.flattenDeep(req.body.parameters.items)}}).then(function(r_items) {
				if (!API.methods.validate(req, res, [(r_items.length > 0)])) { return 0; }

				var itemList = [];

				for (var i in req.body.parameters.items) {
					var cItem = req.body.parameters.items[i][0];
					for (var j in r_items) {
						var cLoopItem = r_items[j];
						if (cLoopItem.hashField === cItem) itemList.push(cLoopItem);
					}
				}

				var nParams = { items: itemList, amounts: req.body.parameters.amounts };
				if (req.body.parameters.discounts) nParams.discounts = req.body.parameters.discounts;
				if (req.body.parameters.availables) nParams.availables = req.body.parameters.availables;
				if (req.body.parameters.supply_amounts) nParams.supply_amounts = req.body.parameters.supply_amounts;
				if (req.body.parameters.min_supply_percents) nParams.min_supply_percents = req.body.parameters.min_supply_percents;
				if (req.body.parameters.discount_deviations) nParams.discount_deviations = req.body.parameters.discount_deviations;

				updateStoreStockRecursive(entry, nParams, "exact", function(result) {
					API.methods.sendResponse(req, res, result, config.messages().entry_updated(entry.nameField), result);
				});
			});
		});
	}

	function updateStoreStockRecursive(store, parameters, operation, done) {
		var loopItems = parameters.items;

		if (loopItems.length > 0) {
			var currentItem = loopItems[0],
				currentAmount = parseInt(parameters.amounts[0]),
				currentDiscount = (!API.methods.isUndefinedOrNull(parameters.discounts) ? parseInt(parameters.discounts[0]) : null),
				currentAvailable = (!API.methods.isUndefinedOrNull(parameters.availables) ? parameters.availables[0] : null),
				currentSupplyAmounts = (!API.methods.isUndefinedOrNull(parameters.supply_amounts) ? parseInt(parameters.supply_amounts[0]) : null),
				currentMinSupplyPercents = (!API.methods.isUndefinedOrNull(parameters.min_supply_percents) ? parseInt(parameters.min_supply_percents[0]) : null),
				currentDiscountDeviations = (!API.methods.isUndefinedOrNull(parameters.discount_deviations) ? parseInt(parameters.discount_deviations[0]) : null);

			StoreStockModel.findOne({where:{'storeId': store.id, 'itemId': currentItem.id}}).then(function(owned_item) {
				var update = {},
					finalNumber = ((operation === "sum") ? (owned_item.amountField + parseInt(currentAmount)) : (owned_item.amountField - parseInt(currentAmount)));

				update.amountField = API.methods.minMax(config.numbers.modules.stock.minAmount, config.numbers.modules.stock.maxAmount, finalNumber);
				if (operation === "exact") update.amountField = currentAmount;

				if (!API.methods.isUndefinedOrNull(currentDiscount)) update.discountField = API.methods.minMax(-1000, 99, currentDiscount);
				if (!API.methods.isUndefinedOrNull(currentDiscountDeviations)) update.discountDeviation = API.methods.minMax(0, 99, currentDiscountDeviations);
				if (!API.methods.isUndefinedOrNull(currentSupplyAmounts)) update.supplyAmount = API.methods.minMax(config.numbers.modules.stock.minAmount, config.numbers.modules.stock.maxAmount, currentSupplyAmounts);
				if (!API.methods.isUndefinedOrNull(currentMinSupplyPercents)) update.minSupplyPercent = API.methods.minMax(0, 100, currentMinSupplyPercents);

				if (currentAvailable) update.availableField = currentAvailable;

				owned_item.update(update).then(function() {
					StoreStockModel.sync({force: false}).then(function() {

						var newLoopItems = JSON.parse(JSON.stringify(loopItems)),
							newLoopAmounts = JSON.parse(JSON.stringify(parameters.amounts)),
							newLoopSupplyAmounts = ((!API.methods.isUndefinedOrNull(currentSupplyAmounts)) ? JSON.parse(JSON.stringify(parameters.supply_amounts)) : null),
							newLoopMinSupplyPercents = ((!API.methods.isUndefinedOrNull(currentMinSupplyPercents)) ? JSON.parse(JSON.stringify(parameters.min_supply_percents)) : null),
							newLoopDiscountDeviations = ((!API.methods.isUndefinedOrNull(currentDiscountDeviations)) ? JSON.parse(JSON.stringify(parameters.discount_deviations)) : null),
							newLoopDiscounts = ((!API.methods.isUndefinedOrNull(currentDiscount)) ? JSON.parse(JSON.stringify(parameters.discounts)) : null),
							newLoopAvailables = ((!API.methods.isUndefinedOrNull(currentAvailable)) ? JSON.parse(JSON.stringify(parameters.availables)) : null),
							nParams = {};

						newLoopItems.splice(0, 1);
						newLoopAmounts.splice(0, 1);

						nParams.items = newLoopItems;
						nParams.amounts = newLoopAmounts;

						if (newLoopDiscounts) { newLoopDiscounts.splice(0, 1); nParams.discounts = newLoopDiscounts; }
						if (newLoopAvailables) { newLoopAvailables.splice(0, 1); nParams.availables = newLoopAvailables; }

						if ((!API.methods.isUndefinedOrNull(currentSupplyAmounts))) {
							newLoopSupplyAmounts.splice(0, 1);
							nParams.supply_amounts = newLoopSupplyAmounts;
						}

						if ((!API.methods.isUndefinedOrNull(currentMinSupplyPercents))) {
							newLoopMinSupplyPercents.splice(0, 1);
							nParams.min_supply_percents = newLoopMinSupplyPercents;
						}

						if ((!API.methods.isUndefinedOrNull(currentDiscountDeviations))) {
							newLoopDiscountDeviations.splice(0, 1);
							nParams.discount_deviations = newLoopDiscountDeviations;
						}

						return updateStoreStockRecursive(store, nParams, operation, done);
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

	function healWoundedStoresFunc(weekDay, callback) {
		var _ = require("lodash");

		mainModel.findAll({
			where: {
				"statusField": config.enums.status.WOUNDED,
				"resupplyDay": { $like: "%"+ weekDay + "%" }
			}
		}).then(function(stores) {
			Promise.all(stores.map(function(object) {
				if (_.random(100) >= config.numbers.modules.stores.healChance) {
					return object.update({ "statusField": 2 });
				} else { return true; }
			})).then(function() { return callback(); });
		});
	}

})();