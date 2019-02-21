(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var MissionsModel = sequelize.define('missions_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				difficultyField: {
					type: DataTypes.INTEGER,
					field: 'difficulty'
				},
				rewardAField: {
					type: DataTypes.INTEGER,
					field: 'reward_a'
				},
				rewardBField: {
					type: DataTypes.INTEGER,
					field: 'reward_b'
				},
				advisoriesField: {
					type: DataTypes.STRING,
					field: 'advisories',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('advisoriesField'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('advisoriesField', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				expiredField: {
					type: DataTypes.BOOLEAN,
					field: 'expired',
					defaultValue: false
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'Mission',
					plural: 'Missions'
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
						MissionsModel.belongsTo(models.objectives, { onDelete: "CASCADE", foreignKey: { allowNull: true } });
						MissionsModel.belongsTo(models.factions, { as: "FactionA" });
						MissionsModel.belongsTo(models.factions, { as: "FactionB" });
						MissionsModel.belongsTo(models.maps, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
						MissionsModel.belongsTo(models.locations, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
						MissionsModel.belongsTo(models.conflicts, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
					}
				}
			}
		);

		return MissionsModel;
	};

})();