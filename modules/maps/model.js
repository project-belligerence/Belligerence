(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var MapsModel = sequelize.define('maps_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				demonymField: {
					type: DataTypes.STRING,
					field: 'demonym'
				},
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				squarekmField: {
					type: DataTypes.INTEGER,
					field: 'square_km'
				},
				climateField: {
					type: DataTypes.INTEGER,
					field: 'climate'
				},
				latitudeField: {
					type: DataTypes.FLOAT,
					field: 'latitude'
				},
				longitudeField: {
					type: DataTypes.FLOAT,
					field: 'longitude'
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
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
					singular: 'Map',
					plural: 'Maps'
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
					getClimates: function() {
						return {
							"Moderate": 0,
							"Continental": 1,
							"Dry": 2,
							"Tropical": 3
						};
					},
					associate: function(models) {
						MapsModel.hasMany(models.locations, { onDelete: "CASCADE", foreignKey: { allowNull: true } });
						MapsModel.hasMany(models.factions, { onDelete: "CASCADE", foreignKey: { allowNull: true } });
						MapsModel.hasMany(models.conflicts, { onDelete: "CASCADE", foreignKey: { allowNull: true } });
					}
				}
			}
		);

		return MapsModel;
	};

})();