(function(){
	'use strict';

	var PMCModel = require('./../index.js').getModels().pmc,
		PlayerModel = require('./../index.js').getModels().players,
		ItemModel = require('./../index.js').getModels().items,
		PlayerItems = require('./../index.js').getModels().player_items,
		PMCItems = require('./../index.js').getModels().pmc_items,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "Items",
		mainModel = ItemModel;

	exports.post = post;
	exports.duplicateItem = duplicateItem;
	exports.getAll = getAll;
	exports.getAllLimited = getAllLimited;
	exports.get = get;
	exports.put = put;
	exports.getPlayer = getPlayer;
	exports.putPlayer = putPlayer;
	exports.postPlayer = postPlayer;
	exports.getPMC = getPMC;
	exports.putPMC = putPMC;
	exports.postPMC = postPMC;
	exports.addItemRecursive = addItemRecursive;
	exports.updateItemsValue = updateItemsValue;

	exports.getInventorySelf = getInventorySelf;
	exports.getInventoryPlayer = getInventoryPlayer;
	exports.getInventoryPMC = getInventoryPMC;

	exports.queryValues = queryValues;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: [
				'createdAt', 'name', 'description', 'type', 'classname', 'class', 'value', 'current_price', 'discount',
				'deployable', 'info', 'production_year', 'detail_1', 'detail_2', 'detail_3', 'detail_4', 'detail_5',
				'totalComments'],
			allowedPostValues: {
				typesValue: [0,1,2,3,4,5,6],
				classesValue: [1,2,3,4,  11,12,13]
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (req.query.qClassname) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (req.query.qDescription) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (req.query.qType) { object.type = { $like: "%" + req.query.qType + "%" }; }
				if (req.query.qClass) { object.class = { $like: "%" + req.query.qClass + "%" }; }
				if (req.query.qValue) { object.value = { $between: [(req.query.qValue.min || 0), (req.query.qValue.max || 9999999)]}; }
				if (req.query.qDeployable) { object.deployable = { $like: "%" + req.query.qDeployable + "%" }; }
				if (req.query.qInfo) { object.info = { $like: "%" + req.query.qInfo + "%" }; }
				if (req.query.qName) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (req.query.qDetail1) { object.detail_1 = { $like: "%" + req.query.qDetail1 + "%" }; }
				if (req.query.qDetail2) { object.detail_2 = { $like: "%" + req.query.qDetail2 + "%" }; }
				if (req.query.qDetail3) { object.detail_3 = { $like: "%" + req.query.qDetail3 + "%" }; }
				if (req.query.qDetail4) { object.detail_4 = { $like: "%" + req.query.qDetail4 + "%" }; }
				if (req.query.qDetail5) { object.detail_5 = { $like: "%" + req.query.qDetail5 + "%" }; }

				if (req.query.qCurrentPrice) { object.current_price = { $between: [(req.query.qCurrentPrice.min || 0), (req.query.qCurrentPrice.max || 9999999)]}; }
				if (req.query.qDiscount) { object.discount = { $between: [(req.query.qDiscount.min || 0), (req.query.qDiscount.max || 9999999)]}; }
				if (req.query.qYear) { object.production_year = { $between: [(req.query.qYear.min || 0), (req.query.qYear.max || 9999999)]}; }

				return object;
			}
		};
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getAllLimited(req, res) {

		var InventoryTable = 'items_tables',
			generatedQueryValues = queryValues(req),
			baseAttributes = "name as nameField, classname as classnameField, description as descriptionField, " +
							 "type as typeField, class as classField, " +
							 "value as valueField, current_price as currentPrice, discount as discountField, deployable as deployableField, " +
							 "info as infoField, production_year as productionYear, " +
							 "detail_1 as detailField1, detail_2 as detailField2, detail_3 as detailField3, detail_4 as detailField4, detail_5 as detailField5, " +
							 "hashField, createdAt",
			countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
						 	"WHERE comments_tables.subjectField = items_tables.hashField" +
							") AS totalComments";

		API.methods.generateRawQuery(req, res,
				InventoryTable,
				baseAttributes + ", " + countQuery + " ",
				"",
				"(items_tables.value > 0)",
				API.methods.generatePaginatedQuery(req, res, generatedQueryValues),
			function(data) {
				API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function get(req, res) {
		var CommentsMethods = require('./../index.js').getMethods().comments;

		mainModel.findOne({where: {"hashField": req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			CommentsMethods.getEntityComments(req, res, "items_tables", entry.hashField, function(comments) {
				entry.dataValues.comments = comments;

				API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
			});
		});
	}

	function getInventorySelf(req, res) {

		req.query.SINGLE_MODE = true;

		var queryObject = {
			hasPMC: req.playerInfo.PMC,
			purchaseType: req.playerInfo.PMC ? "pmc" : "player",
			InventoryModel: req.playerInfo.PMC ? PMCItems : PlayerItems,
			InventoryTable: req.playerInfo.PMC ? 'pmc_items' : 'player_items',
			purchaserModel: req.playerInfo.PMC ? PMCModel : PlayerModel,
			purchaserHash: req.playerInfo.PMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField
		};

		getInventory(req, res, queryObject, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function getInventoryPlayer(req, res) {

		req.query.SINGLE_MODE = false;

		var queryObject = {
			hasPMC: false,
			purchaseType: "player",
			InventoryModel: PlayerItems,
			InventoryTable: "player_items",
			purchaserModel: PlayerModel,
			purchaserHash: req.params.Hash
		};

		getInventory(req, res, queryObject, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function getInventoryPMC(req, res) {

		req.query.SINGLE_MODE = false;

		var queryObject = {
			hasPMC: true,
			purchaseType: "pmc",
			InventoryModel: PMCItems,
			InventoryTable: "pmc_items",
			purchaserModel: PMCModel,
			purchaserHash: req.params.Hash
		};

		getInventory(req, res, queryObject, function(data) {
			API.methods.sendResponse(req, res, true, "", data);
		});
	}

	function getInventory(req, res, queryObject, done) {
		var hasPMC = queryObject.hasPMC,
			purchaseType = queryObject.purchaseType,
			InventoryModel = queryObject.InventoryModel,
			InventoryTable = queryObject.InventoryTable,
			purchaserModel = queryObject.purchaserModel,
			purchaserHash = queryObject.purchaserHash;

		if (queryObject.hasPMC && req.query.SINGLE_MODE) {
			if(!API.methods.validate(req, res, [
				(req.playerInfo.playerTier <= config.privileges().tiers.moderator)
			], config.messages().bad_permission)) { return 0; }
		}

		purchaserModel.findOne({ where: {"hashField": purchaserHash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var generatedQueryValues = queryValues(req),
				baseAttributes = "name as nameField, classname as classnameField, description as descriptionField, " +
								 "type as typeField, class as classField, " +
								 "value as valueField, current_price as currentPrice, discount as discountField, deployable as deployableField, " +
								 "info as infoField, production_year as productionYear, " +
								 "detail_1 as detailField1, detail_2 as detailField2, detail_3 as detailField3, detail_4 as detailField4, detail_5 as detailField5, " +
								 "hashField, " + InventoryTable + ".amount as amountOwned, " + InventoryTable + ".deployed as isDeployed, items_tables.createdAt as ownedSince",
				countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
							 	"WHERE comments_tables.subjectField = items_tables.hashField" +
								") AS totalComments";

			generatedQueryValues.allowedSortValues.push('amount', 'deployed');

			API.methods.generateRawQuery(req, res,
				InventoryTable,
				baseAttributes + ", " + countQuery + " ",
				"LEFT JOIN `items_tables` ON " + InventoryTable + ".item = items_tables.hashField",
				"(items_tables.value > 0) AND (" + InventoryTable + ".owner = '" + purchaserHash + "')",
				API.methods.generatePaginatedQuery(req, res, generatedQueryValues),
				function(data) { done(data); });
		});
	}

	function updateItemsValue(modifier, done) {
		mainModel.findAll().then(function(items) {
			var totalModifiers = [];

			totalModifiers.push((modifier.discountAll || 0));
			totalModifiers.push(modifier.discountMarket || 0);

			for (var i=0; i < items.length; i++) {

				var product = items[i],
					itemModifiers = [],
					value = product.valueField,
					itemValue = 0,
					itemModifiersValue = 0,
					rObject = {};

				itemModifiers.push((modifier['discount' + product.getTypeModifier()]) || 0);
				itemModifiers.push((modifier['discount' + product.getClassModifier()]) || 0);

				itemModifiers = itemModifiers.concat(totalModifiers);
				itemModifiersValue = API.methods.sumArray(itemModifiers);
				itemModifiersValue = API.methods.minMax(config.numbers.modules.modifiers.minDiscount, config.numbers.modules.modifiers.maxDiscount, itemModifiersValue);
				itemValue = ((value * (itemModifiersValue*-1))/100) + value;

				rObject.currentPrice = itemValue;
				rObject.discountField = itemModifiersValue;

				product.update(rObject);
			}

			return done();
		});
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.name, 'string'],
			[req.body.description, 'string', config.numbers.modules.items.descriptionLength],
			[req.body.type, 'number', [queryValues(req).allowedPostValues.typesValue[0], queryValues(req).allowedPostValues.typesValue[(queryValues(req).allowedPostValues.typesValue.length)-1]]],
			[req.body.class, 'number', [queryValues(req).allowedPostValues.classesValue[0], queryValues(req).allowedPostValues.classesValue[(queryValues(req).allowedPostValues.classesValue.length)-1]]],
			[[req.body.value, req.body.year], 'number', [0, 999999]],
			[req.body.deployable, 'boolean'],
			[[req.body.classname, req.body.info], 'string']
		], true)) { return 0; }

		mainModel.findOne({where:{'nameField': req.body.name}}).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.name))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.classname) update.classnameField = req.body.classname;
			if (req.body.description) update.descriptionField = req.body.description;
			if (req.body.type) update.typeField = req.body.type;
			if (req.body.class) update.classField = req.body.class;
			if (req.body.value) update.valueField = req.body.value;
			if (req.body.deployable) update.deployableField = req.body.deployable;
			if (req.body.info) update.infoField = req.body.info;
			if (req.body.year) update.productionYear = req.body.year;
			if (req.body.detail1) update.detailField1 = req.body.detail1;
			if (req.body.detail2) update.detailField2 = req.body.detail2;
			if (req.body.detail3) update.detailField3 = req.body.detail3;
			if (req.body.detail4) update.detailField4 = req.body.detail4;
			if (req.body.detail5) update.detailField5 = req.body.detail5;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) { API.methods.sendResponse(req, res, true, config.messages().new_entry, entry); });
			});
		});
	}

	function duplicateItem(req, res) {

		if (!API.methods.validateParameter(req, res, [[req.body.name, 'string']], true)) { return 0; }

		if (!API.methods.validateParameter(req, res, [
			[req.body.description, 'string', config.numbers.modules.items.descriptionLength],
			[req.body.type, 'number', [queryValues(req).allowedPostValues.typesValue[0], queryValues(req).allowedPostValues.typesValue[(queryValues(req).allowedPostValues.typesValue.length)-1]]],
			[req.body.class, 'number', [queryValues(req).allowedPostValues.classesValue[0], queryValues(req).allowedPostValues.classesValue[(queryValues(req).allowedPostValues.classesValue.length)-1]]],
			[[req.body.value, req.body.year], 'number', [0, 999999]],
			[req.body.deployable, 'boolean'],
			[[req.body.classname, req.body.info], 'string']
		])) { return 0; }

		mainModel.findOne({where:{nameField: req.body.name}}).then(function(clone) {
			if (!API.methods.validate(req, res, [!clone], config.messages().entry_exists(req.body.name))) { return 0; }

			mainModel.findOne({where:{hashField: req.params.Hash}}).then(function(entry) {
				if (!API.methods.validate(req, res, [entry])) { return 0; }
				var update = {};

				update.nameField = req.body.name;
				update.classnameField = (req.body.classname || entry.classnameField);
				update.descriptionField = (req.body.description || entry.descriptionField);
				update.typeField = (req.body.type || entry.typeField);
				update.classField = (req.body.class || entry.classField);
				update.valueField = (req.body.value || entry.valueField);
				update.deployableField = (req.body.deployable || entry.deployableField);
				update.infoField = (req.body.info || entry.infoField);
				update.productionYear = (req.body.year || entry.productionYear);
				update.detailField1 = (req.body.detail1 || entry.detailField1);
				update.detailField2 = (req.body.detail2 || entry.detailField2);
				update.detailField3 = (req.body.detail3 || entry.detailField3);
				update.detailField4 = (req.body.detail4 || entry.detailField4);
				update.detailField5 = (req.body.detail5 || entry.detailField5);

				mainModel.sync({force: false}).then(function() {
					mainModel.create(update).then(function(nEntry) {
						API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
					});
				});
			});
		});
	}

	function put(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.name, 'string'],
			[req.body.description, 'string', config.numbers.modules.items.descriptionLength],
			[req.body.type, 'number', [queryValues(req).allowedPostValues.typesValue[0], queryValues(req).allowedPostValues.typesValue[(queryValues(req).allowedPostValues.typesValue.length)-1]]],
			[req.body.class, 'number', [queryValues(req).allowedPostValues.classesValue[0], queryValues(req).allowedPostValues.classesValue[(queryValues(req).allowedPostValues.classesValue.length)-1]]],
			[[req.body.value, req.body.year], 'number', [0, 999999]],
			[req.body.deployable, 'boolean'],
			[[req.body.classname, req.body.info], 'string']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (req.body.name) update.nameField = req.body.name;
			if (req.body.classname) update.classnameField = req.body.classname;
			if (req.body.description) update.descriptionField = req.body.description;
			if (req.body.type) update.typeField = req.body.type;
			if (req.body.class) update.classField = req.body.class;
			if (req.body.value) update.valueField = req.body.value;
			if (req.body.deployable) update.deployableField = req.body.deployable;
			if (req.body.info) update.infoField = req.body.info;
			if (req.body.year) update.productionYear = req.body.year;
			if (req.body.detail1) update.detailField1 = req.body.detail1;
			if (req.body.detail2) update.detailField2 = req.body.detail2;
			if (req.body.detail3) update.detailField3 = req.body.detail3;
			if (req.body.detail4) update.detailField4 = req.body.detail4;
			if (req.body.detail5) update.detailField5 = req.body.detail5;

			mainModel.findOne({where:{'nameField': req.body.name}}).then(function(duplicate) {
				if (!API.methods.validate(req, res, [!duplicate], config.messages().entry_param_exists('item name'))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
					});
				});
			});
		});
	}

	function getPlayer(req, res) {

		var ID = req.params.Hash;

		if(!API.methods.validate(req, res, [ID])) { return 0; }

		if(!API.methods.validate(req, res, [(
			(req.playerInfo.hashField == ID) ||
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		PlayerModel.findOne({where: {"hashField":ID}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID))) { return 0; }

			player.getItems().then(function(entries) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function addItemRecursive(req, res, items, entry, entry_type, amounts, done) {
		var loopItems = items,
			loopAmounts = amounts,
			methodItem = entry_type == "player" ? methodItemPlayer : methodItemPMC;

		if (loopItems.length > 0) {
			var curItem = items[0],
				curAmount = amounts[0];

			methodItem(req, res, curItem, entry, curAmount, function() {
				var newLoopItems = JSON.parse(JSON.stringify(loopItems)),
					newLoopAmounts = JSON.parse(JSON.stringify(loopAmounts));

				newLoopItems.splice(0, 1);
				newLoopAmounts.splice(0, 1);
				return addItemRecursive(req, res, newLoopItems, entry, entry_type, newLoopAmounts, done);
			});
		} else { return done(true); }
	}

	function methodItemPlayer(req, res, entry, player, p_amount, done) {

		var amount = (p_amount || 0);

		if(!API.methods.validate(req, res, [entry, player])) { return 0; }

		player.hasItem(entry.hashField, function(item) {

			if (item) {
				var finalAmount = (item.amountField + parseInt(amount));

				if (finalAmount <= 0) {
					item.destroy().then(function() {
						return done(true);
					});
				} else {
					item.update({ amountField: finalAmount}).then(function() {
						PlayerItems.sync({force: false}).then(function() {
							return done(true);
						});
					});
				}
			} else {
				if(!API.methods.validate(req, res, [(amount > 0)])) { return 0; }

				player.addNewItem(entry.hashField, amount, true, function(newItem) { return done(true); });
			}
		});
	}

	function methodItemPMC(req, res, entry, pmc, p_amount, done) {

		var amount = (p_amount || 0);

		if(!API.methods.validate(req, res, [entry, pmc])) { return 0; }

		pmc.hasItem(entry.hashField, function(item) {

			if (item) {
				var finalAmount = (item.amountField + parseInt(amount));

				if (finalAmount <= 0) {
					item.destroy().then(function() {
						return done(true);
					});
				} else {
					item.update({ amountField: finalAmount}).then(function() {
						PMCItems.sync({force: false}).then(function() {
							return done(true);
						});
					});
				}
			} else {
				if(!API.methods.validate(req, res, [(amount > 0)])) { return 0; }

				pmc.addNewItem(entry.hashField, amount, true, function(newItem) { return done(true);});
			}
		});
	}

	function postPlayer(req, res) {

		var ID = req.body.item,
			ID2 = req.body.player,
			amount = (req.body.amount || 0);

		if(!API.methods.validate(req, res, [(
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		if(!API.methods.validate(req, res, [ID, ID2])) { return 0; }

		mainModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PlayerModel.findOne({where: {"hashField":ID2}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID2))) { return 0; }

			player.addItem(entry, { amountField: amount }).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().new_entry);
			});
		});
		});
	}

	function putPlayer(req, res) {

		var ID = req.body.item,
			ID2 = req.body.player,
			update = {};

		if (!API.methods.validate(req, res, [ID, ID2, (req.body.amount || req.body.deployed)])) { return 0; }

		if (!API.methods.validate(req, res, [(
			(req.playerInfo.hashField == ID2) ||
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		if (req.body.amount) update.amountField = req.body.amount;
		if (req.body.deployed) update.deployedField = req.body.deployed;

		ItemModel.findOne({where:{'hashField': ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PlayerModel.findOne({where:{'hashField': ID2}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID))) { return 0; }
		PlayerItems.findOne({where:{'itemId': entry.id, 'PlayerId': player.id}}).then(function(item){
			if (!API.methods.validate(req, res, [item], 'The player does not own this item.')) { return 0; }

			item.update({ amountField:(item.amountField + parseInt(update.amountField)), deployedField: (update.deployedField || item.deployedField) }).then(function() {
				PlayerItems.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), item);
				});
			});
		});
		});
		});
	}

	function getPMC(req, res) {

		var ID = req.params.Hash;

		if(!API.methods.validate(req, res, [ID])) { return 0; }

		if(!API.methods.validate(req, res, [(
			(req.playerInfo.PMCId) ||
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		if (req.playerInfo.PMCId) {
			if(!API.methods.validate(req, res, [(
				(req.playerInfo.PMC.hashField = ID) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }
		}

		PMCModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }

			entry.getItems().then(function(entries) {
				API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
			});
		});
	}

	function postPMC(req, res) {

		var ID = req.body.item,
			ID2 = req.body.pmc,
			amount = (req.body.amount || 0);

		if(!API.methods.validate(req, res, [ID, ID2])) { return 0; }

		mainModel.findOne({where: {"hashField":ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PMCModel.findOne({where: {"hashField":ID2}}).then(function(pmc) {
			if (!API.methods.validate(req, res, [pmc], config.messages().entry_not_found(ID2))) { return 0; }

			if(!API.methods.validate(req, res, [(
				((req.playerInfo.PMCId == pmc.id) && (req.playerInfo.playerTier <= config.privileges().tiers.admin)) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

			pmc.addItem(entry, { amountField: amount }).then(function() {
				API.methods.sendResponse(req, res, true, config.messages().new_entry);
			});
		});
		});
	}

	function putPMC(req, res) {

		var ID = req.body.item,
			ID2 = req.body.pmc,
			update = {};

		if (!API.methods.validate(req, res, [ID, ID2, (req.body.amount || req.body.deployed)])) { return 0; }

		if (req.body.amount) update.amountField = req.body.amount;
		if (req.body.deployed) update.deployedField = req.body.deployed;

		ItemModel.findOne({where:{'hashField': ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PMCModel.findOne({where:{'hashField': ID2}}).then(function(pmc) {
			if (!API.methods.validate(req, res, [pmc], config.messages().entry_not_found(ID))) { return 0; }

			if(!API.methods.validate(req, res, [(
				(req.playerInfo.PMCId == pmc.id) ||
				(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
			)], config.messages().bad_permission)) { return 0; }

		PMCItems.findOne({where:{'itemId': entry.id, 'PMCId': pmc.id}}).then(function(item){
			if (!API.methods.validate(req, res, [item], 'The PMC does not own this item.')) { return 0; }

			item.update({ amountField:(item.amountField + parseInt(update.amountField)), deployedField: (update.deployedField || item.deployedField) }).then(function() {
				PMCItems.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), item);
				});
			});
		});
		});
		});
	}

})();