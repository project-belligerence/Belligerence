(function(){
	'use strict';

	var SimpleAirdropModel = require('./../index.js').getModels().simple_airdrop,
		ItemModel = require('./../index.js').getModels().items,
		GeneralMethods  = require('./../index.js').getMethods().general_methods,
		config = require('./../../config.js'),
		API = require('./../../routes/api.js'),

		moduleName = "SimpleAirdrops",
		mainModel = SimpleAirdropModel;

	exports.post = post;

	function queryValues(req) {
		return {
			folderName: require('path').basename(__dirname),
			allowedSortValues: ['createdAt'],
			generateWhereQuery:	function(req) { var object = {}; return object; }
		};
	}

	function post(req, res) {

		if (!API.methods.validateParameter(req, res, [
			[req.body.dropObject, 'object'],
			[[req.body.gridref, (req.body.gridref || "000-000")], 'string'],
			[req.body.color, 'string']
		], false)) { return 0; }

		var mainEntity = API.methods.getMainEntity(req),
			droppedObject = req.body.dropObject;

		mainEntity.entityInventory.findOne({where:
			{ 'owner': mainEntity.entityHash, 'item_classname': droppedObject.classnameField }
		}).then(function(entry) {

			var dropValue = (droppedObject.valueField / 4),
				dropInsert = {
					classnameField: droppedObject.classnameField,
					gridField: req.body.gridref,
					colorField: req.body.color
				},
				inventoryUpdate = { amountField: (entry.amountField - 1) };

			entry.update(inventoryUpdate).then(function() {
				mainEntity.entityInventory.sync({force: false}).then(function() {
					GeneralMethods.spendFundsGeneralFunc(req, res, dropValue, function(r) {
						mainModel.sync({force: false}).then(function() {
							mainModel.create(dropInsert).then(function(drop) { API.methods.sendResponse(req, res, true, "Airdrop has been requested.", r.neededFunds); });
						});
					});
				});
			});
		});
	}

})();