(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ConflictsModel = sequelize.define('conflicts_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: true
				},
				statusField: {
					type: DataTypes.INTEGER,
					field: 'status',
					defaultValue: 0
				},
				victorField: {
					type: DataTypes.INTEGER,
					field: 'victor',
					defaultValue: 0
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'Conflict',
					plural: 'Conflicts'
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
					getStatus: function() {
						return {
							"Ongoing": 0,
							"Suspended": 1,
							"Finished": 2
						};
					},
					associate: function(models) {
						ConflictsModel.belongsTo(models.maps);
						ConflictsModel.belongsToMany(models.factions, { through: models.participants });
					}
				},
			}
		);

		return ConflictsModel;
	};

})();