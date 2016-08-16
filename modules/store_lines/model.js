(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var StoreLinesModel = sequelize.define('store_lines',
			{
				lineField: {
					type: DataTypes.TEXT,
					field: 'line'
				},
				chanceField: {
					type: DataTypes.INTEGER,
					field: 'chance',
					defaultValue: 95
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
				name: {
					singular: 'storeLine',
					plural: 'storeLines',
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
						StoreLinesModel.belongsTo(models.stores);
					}
				}
			}
		);

		return StoreLinesModel;
	};

})();