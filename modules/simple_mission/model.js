(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var SimpleMisionModel = sequelize.define('simple_mission',
			{
				nameField: {
					type: DataTypes.TEXT,
					field: 'name'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				requiredPrestige: {
					type: DataTypes.INTEGER,
					field: 'req_prestige',
					defaultValue: 1
				},
				locationMap: {
					type: DataTypes.STRING,
					field: 'location_map',
					defaultValue: "Altis"
				},
				locationGrid: {
					type: DataTypes.STRING,
					field: 'location_grid',
					defaultValue: "000-000"
				},
				typeField: {
					type: DataTypes.STRING,
					field: 'mission_type'
				},
				costFunds: {
					type: DataTypes.INTEGER,
					field: 'cost_funds'
				},
				rewardFunds: {
					type: DataTypes.INTEGER,
					field: 'reward_funds'
				},
				missionStatus: {
					type: DataTypes.STRING,
					field: 'mission_status',
					defaultValue: 0
				},
				contractOwner: {
					type: DataTypes.STRING,
					field: 'contract_owner'
				},
				codeInit: {
					type: DataTypes.TEXT,
					field: 'code_init'
				},
				codeComplete: {
					type: DataTypes.TEXT,
					field: 'code_complete'
				},
				codeFail: {
					type: DataTypes.TEXT,
					field: 'code_fail'
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);

						model.setDataValue('hashField', newHash);
					}
				}
			}
		);

		return SimpleMisionModel;
	};

})();