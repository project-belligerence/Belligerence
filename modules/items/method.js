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
	exports.getAllTypeHead = getAllTypeHead;
	exports.getAllLimited = getAllLimited;
	exports.get = get;
	exports.deleteEntry = deleteEntry;
	exports.put = put;
	exports.getPlayer = getPlayer;
	exports.putPlayer = putPlayer;
	exports.postPlayer = postPlayer;
	exports.getPMC = getPMC;
	exports.putPMC = putPMC;
	exports.postPMC = postPMC;
	exports.addItemRecursive = addItemRecursive;
	exports.updateItemsValue = updateItemsValue;
	exports.getItemsTypeClass = getItemsTypeClass;
	exports.getItemContent = getItemContent;
	exports.deployItem = deployItem;
	exports.deployItemsRecursiveFUNC = deployItemsRecursiveFUNC;
	exports.resetDeployedItems = resetDeployedItems;

	exports.getInventorySelf = getInventorySelf;
	exports.getInventoryPlayer = getInventoryPlayer;
	exports.getInventoryPMC = getInventoryPMC;

	exports.queryValues = queryValues;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: [
				'createdAt', 'name', 'description', 'type', 'classname', 'content', 'class', 'value', 'current_price', 'discount',
				'deployable', 'info', 'production_year', 'detail_1', 'detail_2', 'detail_3', 'detail_4', 'detail_5',
				'totalComments'],
			allowedPostValues: {
				typesValue: [0,1,2,3,4,5,6,7,8,9],
				classesValue: [
					1,2,3,4,5,6,7,8,9,901,
					11,12,13,14,15,
					21,22,23,24,25,
					31,32,33,34,35,
					41,42,43,44,45,
					51,52,53,54,55,
					61,62,63,64,65,
					71,72,73,74,75,
					81,82,83,84,85,
					91,92,93,94,95
				]
			},
			generateWhereQuery:	function(req) {
				var object = {};

				if (API.methods.isValid(req.query.qName)) { object.name = { $like: "%" + req.query.qName + "%" }; }
				if (API.methods.isValid(req.query.qClassname)) { object.classname = { $like: "%" + req.query.qClassname + "%" }; }
				if (API.methods.isValid(req.query.qContent)) { object.content = { $like: "%" + req.query.qContent + "%" }; }
				if (API.methods.isValid(req.query.qDescription)) { object.description = { $like: "%" + req.query.qDescription + "%" }; }
				if (API.methods.isValid(req.query.qType)) { object.type = { $like: req.query.qType }; }
				if (API.methods.isValid(req.query.qClass)) { object.class = { $like: req.query.qClass }; }
				if (API.methods.isValid(req.query.qValue)) { req.query.qValue = JSON.parse(req.query.qValue); object.value = { $between: [(req.query.qValue.min || 0), (req.query.qValue.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qDeployable)) { object.deployable = { $like: API.methods.getBoolean(req.query.qDeployable, true) }; }
				if (API.methods.isValid(req.query.qInfo)) { object.info = { $like: "%" + req.query.qInfo + "%" }; }
				if (API.methods.isValid(req.query.qDetail1)) { object.detail_1 = { $like: req.query.qDetail1 }; }
				if (API.methods.isValid(req.query.qDetail2)) { object.detail_2 = { $like: "%" + req.query.qDetail2 + "%" }; }
				if (API.methods.isValid(req.query.qDetail3)) { object.detail_3 = { $like: "%" + req.query.qDetail3 + "%" }; }
				if (API.methods.isValid(req.query.qDetail4)) { object.detail_4 = { $like: "%" + req.query.qDetail4 + "%" }; }
				if (API.methods.isValid(req.query.qDetail5)) { object.detail_5 = { $like: "%" + req.query.qDetail5 + "%" }; }

				if (API.methods.isValid(req.query.qCurrentPrice)) { req.query.qCurrentPrice = JSON.parse(req.query.qCurrentPrice); object.current_price = { $between: [(req.query.qCurrentPrice.min || 0), (req.query.qCurrentPrice.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qDiscount)) { req.query.qDiscount = JSON.parse(req.query.qDiscount); object.discount = { $between: [(req.query.qDiscount.min || 0), (req.query.qDiscount.max || 9999999)]}; }
				if (API.methods.isValid(req.query.qYear)) { req.query.qYear = JSON.parse(req.query.qYear); object.production_year = { $between: [(req.query.qYear.min || 0), (req.query.qYear.max || 9999999)]}; }

				return object;
			}
		};
	}

	function getItemContent(req, res) {
		var allMods = [
			"Vanilla", "APEX",
			"Karts DLC", "Helicopters DLC", "Marksmen DLC",
			"Jets DLC", "Laws of War DLC", "TAC-OPS DLC", "Tanks DLC",
			"RHS",
			"CUP",
			"HLC",
			"R3F",
			"Project_OPFOR",
			"TRYK",
			"RDS",
			"TF47",
			"FHQ",
			"Infinite_AIO",
			"KA"
		], rObject = [];
		for (var i in allMods) { var cMod = allMods[i];	rObject.push({text: cMod, data: i}); }
		API.methods.sendResponse(req, res, true, config.messages().return_entries, rObject);
	}

	function getAll(req, res) {
		mainModel.findAndCountAll(API.methods.generatePaginatedQuery(req, res, queryValues(req))).then(function(entries) {
			API.methods.sendResponse(req, res, true, config.messages().return_entries, entries);
		});
	}

	function getAllTypeHead(req, res) {
		req.serverValues = {};
		req.serverValues.overriddenContext = true;
		req.serverValues.contextLimit = 6;
		getAllLimited(req, res);
	}

	function getAllLimited(req, res) {
		if (!req.serverValues) req.serverValues = {};
		if (!req.serverValues.overriddenContext) req.serverValues.contextLimit = 21;

		var InventoryTable = 'items_tables',
			generatedQueryValues = queryValues(req),
			baseAttributes = "name as nameField, classname as classnameField, content as contentField, " +
							 "description as descriptionField, type as typeField, class as classField, " +
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
			API.methods.sendResponse(req, res, true, config.messages().return_entry, entry);
		});
	}

	function getItemsTypeClass(req, res) {
		var rObject = {};
		rObject.typeField = config.enums.types;
		rObject.classField = config.enums.classes;
		API.methods.sendResponse(req, res, true, config.messages().return_entry, rObject);
	}

	function resetDeployedItems(req, res) {
		var hasPMC =  req.playerInfo.PMC,
			InventoryModel = req.playerInfo.PMC ? PMCItems : PlayerItems,
			purchaserHash = req.playerInfo.PMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField;

		InventoryModel.findAll({ where: {"ownerHash": purchaserHash}}).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entry)) { return 0; }

			Promise.all(entries.map(function(object) {
				return object.update({"deployedAmount": 0});
			})).then(function(result) {
				API.methods.sendResponse(req, res, true, "Deployed items reset.");
			});
		});
	}

	function deployItem(req, res) {
		deployItemFUNC(req, res, function(nEntry) {
			API.methods.sendResponse(req, res, true, config.messages().return_entry, nEntry);
		});
	}

	function deployItemFUNC(req, res, callback) {
		var hasPMC =  req.playerInfo.PMC,
			InventoryModel = req.playerInfo.PMC ? PMCItems : PlayerItems,
			purchaserHash = req.playerInfo.PMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField;

		InventoryModel.findOne({ where: {"ownerHash": purchaserHash, "itemHash": req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }
			entry.update({"deployedAmount": req.body.amount }).then(function(nEntry) {
				return callback(nEntry);
			});
		});
	}

	function deployItemsRecursiveFUNC(req, res, items, callback) {
		var hasPMC =  req.playerInfo.PMC,
			InventoryModel = req.playerInfo.PMC ? PMCItems : PlayerItems,
			purchaserHash = req.playerInfo.PMC ? req.playerInfo.PMC.hashField : req.playerInfo.hashField;

		InventoryModel.findAll({ where: {"ownerHash": purchaserHash}}).then(function(entries) {
			if (!API.methods.validate(req, res, [entries], config.messages().no_entry)) { return 0; }

			Promise.all(entries.map(function(object) {
				return object.update({"deployedAmount": 0});
			})).then(function(result) {
				deployItemRecursiveLoopFUNC(req, res, items, entries, function(done) {
					return callback(done);
				});
			});
		});
	}

	function deployItemRecursiveLoopFUNC(req, res, items, inventoryList, done) {
		var loopItems = items,
			loopInventory = inventoryList;

		if (loopItems.length > 0) {
			var curItem = loopItems[0],
				curHash = curItem[0],
				curAmount = curItem[1],
				foundEntry;

			for (var i in loopInventory) {
				var cInv = inventoryList[i];
				if (cInv.itemHash === curHash) {
					foundEntry = cInv;
					break;
				}
			}

			loopItems.splice(0, 1);
			loopInventory.splice(0, 1);

			if (foundEntry) {
				foundEntry.update({"deployedAmount": Math.min(curAmount, foundEntry.amountField) }).then(function(nEntry) {
					return deployItemRecursiveLoopFUNC(req, res, loopItems, loopInventory, done);
				});
			} else { return deployItemRecursiveLoopFUNC(req, res, loopItems, loopInventory, done); }
		} else { return done(true); }
	}

	function getInventorySelf(req, res) {
		req.serverValues = {};
		req.serverValues.contextLimit = 999;
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
				baseAttributes = "items_tables.id as itemId, name as nameField, classname as classnameField, content as contentField, " +
								 "description as descriptionField, type as typeField, class as classField, " +
								 "value as valueField, current_price as currentPrice, discount as discountField, deployable as deployableField, " +
								 "info as infoField, production_year as productionYear, " +
								 "detail_1 as detailField1, detail_2 as detailField2, detail_3 as detailField3, detail_4 as detailField4, detail_5 as detailField5, " +
								 "hashField, " + InventoryTable + ".amount as amountOwned, " + InventoryTable + ".deployed_amount as deployedAmount, items_tables.createdAt as ownedSince",
				countQuery =	"(SELECT COUNT(*) FROM `comments_tables`" +
							 	"WHERE comments_tables.subjectField = items_tables.hashField" +
								") AS totalComments";

			generatedQueryValues.allowedSortValues.push('amount', 'deployed');

			API.methods.generateRawQuery(req, res,
				InventoryTable,
				baseAttributes + ", " + countQuery + " ",
				"LEFT JOIN `items_tables` ON " + InventoryTable + ".item = items_tables.hashField",
				"(items_tables.value > 0) AND (" + InventoryTable + ".amount > 0) AND (" + InventoryTable + ".owner = '" + purchaserHash + "')",
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
			[req.body.nameField, 'string'],
			[req.body.descriptionField, 'string', config.numbers.modules.items.descriptionLength],
			[req.body.typeField, 'number', queryValues(req).allowedPostValues.typesValue],
			[req.body.classField, 'number', queryValues(req).allowedPostValues.classesValue],
			[[req.body.valueField, req.body.contentField, req.body.productionYear], 'number', [0, 999999]],
			[[req.body.classnameField, req.body.infoField], 'string']
		], true)) { return 0; }

		var ITEMS_FUNC_QUERY = { where: {} };
		ITEMS_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }, { 'classnameField': req.body.classnameField }];

		mainModel.findOne(ITEMS_FUNC_QUERY).then(function(entry) {
			if (!API.methods.validate(req, res, [!entry], config.messages().entry_exists(req.body.nameField))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.contentField)) update.contentField = req.body.contentField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
			if (API.methods.isValid(req.body.classField)) update.classField = req.body.classField;
			if (API.methods.isValid(req.body.valueField)) update.valueField = req.body.valueField;
			if (API.methods.isValid(req.body.deployableField)) update.deployableField = req.body.deployableField;
			if (API.methods.isValid(req.body.infoField)) update.infoField = req.body.infoField;
			if (API.methods.isValid(req.body.productionYear)) update.productionYear = req.body.productionYear;
			if (API.methods.isValid(req.body.detailField1)) update.detailField1 = req.body.detailField1;
			if (API.methods.isValid(req.body.detailField2)) update.detailField2 = req.body.detailField2;
			if (API.methods.isValid(req.body.detailField3)) update.detailField3 = req.body.detailField3;
			if (API.methods.isValid(req.body.detailField4)) update.detailField4 = req.body.detailField4;
			if (API.methods.isValid(req.body.detailField5)) update.detailField5 = req.body.detailField5;

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(entry) {
					updateItemsValue("", function(done) {
						API.methods.sendResponse(req, res, true, config.messages().new_entry, entry);
					});
				});
			});
		});
	}

	function put(req, res) {
		if (!API.methods.validateParameter(req, res, [
			[req.body.nameField, 'string'],
			[req.body.descriptionField, 'string', config.numbers.modules.items.descriptionLength],
			[req.body.typeField, 'number', queryValues(req).allowedPostValues.typesValue],
			[req.body.classField, 'number', queryValues(req).allowedPostValues.classesValue],
			[[req.body.valueField, req.body.contentField, req.body.productionYear], 'number', [0, 999999]],
			[[req.body.classnameField, req.body.infoField], 'string']
		])) { return 0; }

		mainModel.findOne({where:{'hashField': req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(req.params.Hash))) { return 0; }

			var update = {};

			if (API.methods.isValid(req.body.nameField)) update.nameField = req.body.nameField;
			if (API.methods.isValid(req.body.classnameField)) update.classnameField = req.body.classnameField;
			if (API.methods.isValid(req.body.contentField)) update.contentField = req.body.contentField;
			if (API.methods.isValid(req.body.descriptionField)) update.descriptionField = req.body.descriptionField;
			if (API.methods.isValid(req.body.typeField)) update.typeField = req.body.typeField;
			if (API.methods.isValid(req.body.classField)) update.classField = req.body.classField;
			if (API.methods.isValid(req.body.valueField)) update.valueField = req.body.valueField;
			if (API.methods.isValid(req.body.deployableField)) update.deployableField = req.body.deployableField;
			if (API.methods.isValid(req.body.infoField)) update.infoField = req.body.infoField;
			if (API.methods.isValid(req.body.productionYear)) update.productionYear = req.body.productionYear;
			if (API.methods.isValid(req.body.detailField1)) update.detailField1 = req.body.detailField1;
			if (API.methods.isValid(req.body.detailField2)) update.detailField2 = req.body.detailField2;
			if (API.methods.isValid(req.body.detailField3)) update.detailField3 = req.body.detailField3;
			if (API.methods.isValid(req.body.detailField4)) update.detailField4 = req.body.detailField4;
			if (API.methods.isValid(req.body.detailField5)) update.detailField5 = req.body.detailField5;

			var ITEMS_FUNC_QUERY = { where: {} };
			ITEMS_FUNC_QUERY.where.$or = [{ 'nameField': req.body.nameField }, { 'classnameField': req.body.classnameField }];

			mainModel.findOne(ITEMS_FUNC_QUERY).then(function(duplicate) {
				if (!API.methods.validate(req, res, [(duplicate ? (entry.hashField === duplicate.hashField) : true)], config.messages().entry_exists(req.body.nameField))) { return 0; }

				entry.update(update).then(function() {
					mainModel.sync({force: false}).then(function() {
						updateItemsValue("", function(done) {
							API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.displaynameField), entry);
						});
					});
				});
			});
		});
	}

	function duplicateItem(req, res) {
		mainModel.findOne({where:{hashField: req.params.Hash}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry])) { return 0; }
			var update = {};

			update.nameField = entry.nameField + " (copy)";
			update.classnameField = (req.body.classname || entry.classnameField);
			update.contentField = (req.body.content || entry.contentField);
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

			update.classnameField = update.classnameField + "_copy";

			mainModel.sync({force: false}).then(function() {
				mainModel.create(update).then(function(nEntry) {

					var destination = config.folders.uploads + "/" + config.folders.uploads_images + "/" + config.folders.modules + "/" + "items/",
						filename = destination + "main_" + req.params.Hash + ".jpg",
						filenameThumb = destination + "thumb_" + req.params.Hash + ".jpg",
						filename_new = destination + "main_" + nEntry.hashField + ".jpg",
						filenameThumb_new = destination + "thumb_" + nEntry.hashField + ".jpg",
						fs = require('fs');

					fs.stat(filename, function(err, stat) {
						if (err === null) {
							fs.createReadStream(filename).pipe(fs.createWriteStream(filename_new));
							fs.createReadStream(filenameThumb).pipe(fs.createWriteStream(filenameThumb_new));
						}

						updateItemsValue("", function(done) {
							API.methods.sendResponse(req, res, true, config.messages().new_entry, nEntry);
						});
					});
				});
			});
		});
	}

	function deleteEntry(req, res) {
		var objectID = req.params.Hash,
			fs = require('fs'),
			UploadMethods = require('./../index.js').getMethods().upload;

		mainModel.findOne({where: { "hashField": objectID }}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().no_entry)) { return 0; }

			var destination = (config.folders.uploads + "/" + config.folders.uploads_images + "/" + config.folders.modules + "/" + "items/"),
				params = { path: destination, filename: req.params.Hash, extension: ".jpg" };

			UploadMethods.deleteContentImageFUNC(params, function() {
				entry.destroy().then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_deleted);
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

	function methodItemPlayer(req, res, entry, player, p_amount,  done) {

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
					item.update({ amountField: finalAmount }).then(function() {
						PlayerItems.sync({force: false}).then(function() {
							return done(true);
						});
					});
				}
			} else {
				if(!API.methods.validate(req, res, [(amount > 0)])) { return 0; }

				player.addNewItem(entry.hashField, entry.classnameField, entry.typeField, entry.classField, amount, 0, function(newItem) { return done(true); });
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

				pmc.addNewItem(entry.hashField, entry.classnameField, entry.typeField, entry.classField, amount, 0, function(newItem) { return done(true);});
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

		if (!API.methods.validate(req, res, [ID, ID2, (req.body.amount || req.body.deployed_amount)])) { return 0; }

		if (!API.methods.validate(req, res, [(
			(req.playerInfo.hashField == ID2) ||
			(req.playerInfo.playerPrivilege <= config.privileges().tiers.admin)
		)], config.messages().bad_permission)) { return 0; }

		if (req.body.amount) update.amountField = req.body.amount;
		if (req.body.deployed_amount) update.deployedAmount = req.body.deployed_amount;

		ItemModel.findOne({where:{'hashField': ID}}).then(function(entry) {
			if (!API.methods.validate(req, res, [entry], config.messages().entry_not_found(ID))) { return 0; }
		PlayerModel.findOne({where:{'hashField': ID2}}).then(function(player) {
			if (!API.methods.validate(req, res, [player], config.messages().entry_not_found(ID))) { return 0; }
		PlayerItems.findOne({where:{'itemId': entry.id, 'PlayerId': player.id}}).then(function(item){
			if (!API.methods.validate(req, res, [item], 'The player does not own this item.')) { return 0; }

			item.update({ amountField:(item.amountField + parseInt(update.amountField)), deployedAmount: parseInt(update.deployedAmount)}).then(function() {
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

		if (!API.methods.validate(req, res, [ID, ID2, (req.body.amount || req.body.deployed_amount)])) { return 0; }

		if (req.body.amount) update.amountField = req.body.amount;
		if (req.body.deployed_amount) update.deployedAmount = req.body.deployed_amount;

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

			item.update({ amountField:(item.amountField + parseInt(update.amountField)), deployedAmount: parseInt(update.deployedAmount)}).then(function() {
				PMCItems.sync({force: false}).then(function() {
					API.methods.sendResponse(req, res, true, config.messages().entry_updated(entry.nameField), item);
				});
			});
		});
		});
		});
	}

})();