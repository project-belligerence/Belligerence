(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var FactionsModel = sequelize.define('factions_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				demonymField: {
					type: DataTypes.STRING,
					field: 'demonym'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				loadoutField: {
					type: DataTypes.STRING,
					field: 'loadout'
				},
				sideField: {
					type: DataTypes.INTEGER,
					field: 'side',
					defaultValue: 0
				},
				assetsField: {
					type: DataTypes.INTEGER,
					field: 'assets',
					defaultValue: 1000
				},
				currentAssetsField: {
					type: DataTypes.INTEGER,
					field: 'current_assets',
					defaultValue: 1000
				},
				techField: {
					type: DataTypes.INTEGER,
					field: 'tech',
					defaultValue: 5
				},
				trainingField: {
					type: DataTypes.INTEGER,
					field: 'training',
					defaultValue: 5
				},
				munificenceField: {
					type: DataTypes.INTEGER,
					field: 'munificence',
					defaultValue: 5
				},
				organizationField: {
					type: DataTypes.INTEGER,
					field: 'organization',
					defaultValue: 5
				},
				isrField: {
					type: DataTypes.INTEGER,
					field: 'isr',
					defaultValue: 5
				},
				tacticsField: {
					type: DataTypes.INTEGER,
					field: 'tactics',
					defaultValue: 0
				},
				policyField: {
					type: DataTypes.INTEGER,
					field: 'policy',
					defaultValue: 0
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
						this.setDataValue('blacklistedUpgradesField', API.methods.setDoublePseudoArray(val));
					}
				},
				areasOfInterest: {
					type: DataTypes.STRING,
					field: 'areas_of_interest',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('areasOfInterest'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('areasOfInterest', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
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
					singular: 'Faction',
					plural: 'Factions'
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
					getPolicies: function() {
						return {
							"Defensive": 0,
							"Aggressive": 1
						};
					},
					getDoctrines: function() {
						return {
							"Terrorism": 0,
							"Guerilla Warfare": 1,
							"Surgical Strikes": 2,
							"Combined Arms": 3
						};
					},
					associate: function(models) {
						FactionsModel.belongsTo(models.maps);
						FactionsModel.belongsToMany(models.conflicts, { through: models.participants });
					}
				}
			}
		);

		return FactionsModel;
	};

})();