(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var StoreModel = sequelize.define('stores_table',
			{
				nameField: {
					type: DataTypes.TEXT,
					field: 'name'
				},
				subTitleField: {
					type: DataTypes.TEXT,
					field: 'subtitle'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				pictureField: {
					type: DataTypes.STRING,
					field: 'status'
				},
				typesField: {
					type: DataTypes.STRING,
					field: 'types'
				},
				prestigeRequired: {
					type: DataTypes.INTEGER,
					field: 'prestige'
				},
				requiredUpgradesField: {
					type: DataTypes.TEXT,
					field: 'required_upgrades',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getDoublePseudoArray(this.getDataValue('requiredUpgradesField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('requiredUpgradesField', API.methods.setDoublePseudoArray(val));
					}
				},
				blacklistedUpgradesField: {
					type: DataTypes.TEXT,
					field: 'blacklisted_upgrades',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getDoublePseudoArray(this.getDataValue('blacklistedUpgradesField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDoublePseudoArray('blacklistedUpgradesField', API.methods.setPseudoArray(val));
					}
				},
				statusField: {
					type: DataTypes.INTEGER,
					field: 'status',
					defaultValue: 0
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				name: {
					singular: 'store',
					plural: 'stores',
				},
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);
						model.setDataValue('hashField', newHash);
					}
				},
				classMethods: {
					associate: function(models) {
						StoreModel.belongsToMany(models.items, { through: models.store_stock });
						StoreModel.hasMany(models.store_lines);
					}
				},
				instanceMethods: {
					checkStockAvailable: function(req, res, products, amountBought, done) {
						var config = require('./../../config.js'),
							API = require('./../../routes/api.js'),
							StoreStockModel = require('./../index.js').getModels().store_stock;

						StoreStockModel.findAll({where:{'storeId': this.getDataValue('id')}}).then(function(owned_stock) {
							var actualAmount = [],
								actualDiscount = [];

							for (var i = 0; i < products.length; i++) {
								var currentProduct = products[i],
									foundProduct = false;

								for (var j = 0; j < owned_stock.length; j++) {
									if (currentProduct.id === owned_stock[j].itemId) {
										foundProduct = true;

										if (!API.methods.validate(req, res, [(owned_stock[j].availableField)], config.messages().modules.stores.item_not_available(currentProduct.nameField))) { return 0; }
										if (!API.methods.validate(req, res, [(owned_stock[j].amountField > 0)], config.messages().modules.stores.item_out_of_stock_specific(currentProduct.nameField))) { return 0; }

										actualAmount.push(API.methods.minMax(0, owned_stock[j].amountField, amountBought[i]));
										actualDiscount.push(owned_stock[j].discountField);
									}
 								}
								if (!API.methods.validate(req, res, [foundProduct], config.messages().modules.stores.item_not_owned_specific(currentProduct.nameField))) { return 0; }
							}

							var rObject = {};

							rObject.actualAmount = actualAmount;
							rObject.actualDiscount = actualDiscount;

							return done(rObject);
						});
					}
				}
			}
		);

		return StoreModel;
	};

})();