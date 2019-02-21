(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var LocationsModel = sequelize.define('locations_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				gridRef: {
					type: DataTypes.STRING,
					field: 'grid_ref'
				},
				positionField: {
					type: DataTypes.TEXT,
					field: 'position',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('positionField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('positionField', API.methods.setPseudoArray(val));
					}
				},
				typeField: {
					type: DataTypes.STRING,
					field: 'type'
				},
				sizeField: {
					type: DataTypes.INTEGER,
					field: 'size'
				},
				elevationField: {
					type: DataTypes.INTEGER,
					field: 'elevation'
				},
				importanceField: {
					type: DataTypes.INTEGER,
					field: 'importance'
				},
				tenabilityField: {
					type: DataTypes.INTEGER,
					field: 'tenability',
					defaultValue: 0
				},
				ownerField: {
					type: DataTypes.INTEGER,
					field: 'owner',
					defaultValue: 0
				},
				insertableField: {
					type: DataTypes.BOOLEAN,
					field: 'insertable',
					defaultValue: true
				},
				extractableField: {
					type: DataTypes.BOOLEAN,
					field: 'extractable',
					defaultValue: true
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
					singular: 'Location',
					plural: 'Locations'
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
					getLocationTypes: function() {
						return {
							"Capital": 0,
							"City": 1,
							"Village": 2,
							"Airport": 3,
							"Port": 4,
							"Hill": 5,
							"Vegetation": 6,
							"Strategic": 7,
							"View Point": 8
						};
					},
					associate: function(models) {
						LocationsModel.belongsTo(models.maps);
					}
				}
			}
		);

		return LocationsModel;
	};

})();