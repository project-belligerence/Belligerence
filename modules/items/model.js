(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ItemModel = sequelize.define('items_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name',
					defaultValue: 'Generic Item'
				},
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				contentField: { // Mod @name, @A3, @APEX, @RHS_GREF, etc
					type: DataTypes.INTEGER,
					field: 'content'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				typeField: {
					type: DataTypes.STRING,
					field: 'type',
					defaultValue: "4"
				},
				classField: {
					type: DataTypes.STRING,
					field: 'class',
					defaultValue: "01"
				},
				valueField: {
					type: DataTypes.FLOAT,
					field: 'value',
					defaultValue: 0
				},
				currentPrice: { // Dummy field
					type: DataTypes.INTEGER,
					field: 'current_price',
					defaultValue: 0
				},
				discountField: { // Dummy field
					type: DataTypes.INTEGER,
					field: 'discount',
					defaultValue: 0
				},
				deployableField: {
					type: DataTypes.BOOLEAN,
					field: 'deployable',
					defaultValue: false
				},
				infoField: { // Wikipedia link
					type: DataTypes.TEXT,
					field: 'info'
				},
				productionYear: {
					type: DataTypes.INTEGER,
					field: 'production_year',
					defaultValue: 1980
				},
				detailField1: {
					type: DataTypes.STRING,
					field: 'detail_1'
				},
				detailField2: {
					type: DataTypes.STRING,
					field: 'detail_2'
				},
				detailField3: {
					type: DataTypes.STRING,
					field: 'detail_3'
				},
				detailField4: {
					type: DataTypes.STRING,
					field: 'detail_4'
				},
				detailField5: {
					type: DataTypes.STRING,
					field: 'detail_5'
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				name: {
					singular: 'item',
					plural: 'items',
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
						ItemModel.belongsToMany(models.stores, { through: models.store_stock });
					}
				},
				instanceMethods: {
					getClassName: function() {
						var config = require('./../../config.js'),
							typeV = (this.getDataValue('typeField')),
							classV = (this.getDataValue('classField')),
							classNumber = typeV.toString() + classV.toString();
        				return config.enums.classes[classNumber].label;
					},
					getTypeName: function() {
						var config = require('./../../config.js');
        				return config.enums.types[this.getDataValue('typeField')].label;
					},
					getClassModifier: function() {
						var config = require('./../../config.js'),
							typeV = (this.getDataValue('typeField')),
							classV = (this.getDataValue('classField')),
							classNumber = classV;
        				return config.enums.classes[classNumber].modifier;
					},
					getTypeModifier: function() {
						var config = require('./../../config.js');
        				return config.enums.types[this.getDataValue('typeField')].modifier;
					},
					generatePrice: function(model) {
						var ModifierModel = require('./../index.js').getModels().modifiers,
							config = require('./../../config.js'),
							API = require('./../../routes/api.js');

						return ModifierModel.findOne({ where: {"activeField": true }}).then(function(modifier) {
							var totalModifiers = [];

							totalModifiers.push((modifier.discountAll || 0));
							totalModifiers.push(modifier.discountMarket || 0);

							var product = model,
								itemModifiers = [],
								value = parseInt(product.valueField),
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

							product.update(rObject).then(function(model) { return true; });
						});
					}
				}
			}
		);

		ItemModel.afterCreate(function(model, options) { return model.generatePrice(model); });

		return ItemModel;
	};

})();