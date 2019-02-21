(function(){

	'use strict';
	/* jshint shadow:true */

	module.exports = function(sequelize, DataTypes) {
			var UpgradesModel = sequelize.define('upgrades_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name',
					defaultValue: 'Generic Upgrade'
				},
				slugField: { // Simple name, like my-upgrade
					type: DataTypes.STRING,
					field: 'slug'
				},
				ingameVariable: { // A variable that's automatically assigned to the players in-game
					type: DataTypes.STRING,
					field: 'ingame'
				},
				typeField: { // 0 - All, 1 - Freelancer, 2 - Outfit
					type: DataTypes.INTEGER,
					field: 'type',
					defaultValue: 0
				},
				kindField: { // if it's an contract, certification, attack, gotta decide on them all
					type: DataTypes.INTEGER,
					field: 'kind',
					defaultValue: 0
				},
				iconName: {
					type: DataTypes.STRING,
					field: 'icon',
					defaultValue: 'generic'
				},
				hasUIField: {
					type: DataTypes.BOOLEAN,
					field: 'has_ui',
					defaultValue: false
				},
				flavortextField: {
					type: DataTypes.TEXT,
					field: 'flavor_text'
				},
				flavortextUpgradesField: {
					type: DataTypes.TEXT,
					field: 'flavor_text_upgrades',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('flavortextUpgradesField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('flavortextUpgradesField', API.methods.setPseudoArray(val));
					}
				},
				maxTier: {
					type: DataTypes.INTEGER,
					field: 'max_tier',
					defaultValue: 0
				},
				baseCost: {
					type: DataTypes.INTEGER,
					field: 'base_cost',
					defaultValue: 1
				},
				costMultiplier: {
					type: DataTypes.FLOAT,
					field: 'cost_multiplier',
					defaultValue: 1.5
				},
				parentUpgrade: { // Hashfield for whatever upgrade this is parented to
					type: DataTypes.STRING,
					field: 'parent'
				},
				requiredUpgradesField: {
					type: DataTypes.TEXT,
					field: 'required_upgrades',
					get: function() {
						var API = require('./../../routes/api.js'),
							currentRequired = API.methods.getDoublePseudoArray(this.getDataValue('requiredUpgradesField')),
							parentUpgrade = this.getDataValue('parentUpgrade');
						if (parentUpgrade !== "") {
							var found = false;
							for (var i in currentRequired) if (currentRequired[i][0] === parentUpgrade) found = true;
							if (!found) currentRequired.unshift([parentUpgrade, "1"]);
						}
						return currentRequired;
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
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'upgrade',
					plural: 'upgrades',
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
						UpgradesModel.belongsToMany(models.pmc, { through: models.pmc_upgrades });
						UpgradesModel.belongsToMany(models.players, { through: models.player_upgrades });
					}
				}
			}
		);

		return UpgradesModel;
	};

})();