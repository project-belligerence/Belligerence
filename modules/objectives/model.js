(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ObjectivesModel = sequelize.define('objectives_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				iconName: {
					type: DataTypes.STRING,
					field: 'icon',
					defaultValue: 'generic'
				},
				taskIconField: {
					type: DataTypes.STRING,
					field: 'task_icon',
					defaultValue: 'move'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				successDescField: {
					type: DataTypes.TEXT,
					field: 'success_desc'
				},
				failureDescField: {
					type: DataTypes.TEXT,
					field: 'failure_desc'
				},
				hourLimitField: {
					type: DataTypes.INTEGER,
					field: 'hour_limit',
					defaultValue: 1
				},
				difficultyField: {
					type: DataTypes.INTEGER,
					field: 'difficulty',
					defaultValue: 0
				},
				unitLimit: {
					type: DataTypes.INTEGER,
					field: 'unit_limit',
					defaultValue: 10
				},
				chanceField: {
					type: DataTypes.INTEGER,
					field: 'chance',
					defaultValue: 100
				},
				assetCostField: {
					type: DataTypes.INTEGER,
					field: 'asset_cost',
					defaultValue: 1000
				},
				assetDamageField: {
					type: DataTypes.INTEGER,
					field: 'asset_damage',
					defaultValue: 1000
				},
				baseRewardField: {
					type: DataTypes.INTEGER,
					field: 'base_reward',
					defaultValue: 0
				},
				doctrineTypes: {
					type: DataTypes.STRING,
					field: 'doctrines',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('doctrineTypes'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('doctrineTypes', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				locationTypes: {
					type: DataTypes.STRING,
					field: 'locations',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('locationTypes'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('locationTypes', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				disabledMaps: {
					type: DataTypes.STRING,
					field: 'disabled_maps',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('disabledMaps'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('disabledMaps', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				captureField: {
					type: DataTypes.BOOLEAN,
					field: 'capture',
					defaultValue: false
				},
				adversarialField: {
					type: DataTypes.BOOLEAN,
					field: 'adversarial',
					defaultValue: false
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: true
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'Objective',
					plural: 'Objectives'
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
					// associate: function(models) {
					// 	ObjectivesModel.belongsTo(models.missions, { foreignKey: { allowNull: true }});
					// }
				}
			}
		);

		return ObjectivesModel;
	};

})();