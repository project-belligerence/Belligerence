(function() {

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var InviteModel = sequelize.define('invites_table',
			{
				typeField: {
					type: DataTypes.STRING,
					field: 'type'
				},
				noteField: {
					type: DataTypes.TEXT,
					field: 'note'
				},
				pointA: {
					type: DataTypes.STRING,
					field: 'point_a'
				},
				pointB: {
					type: DataTypes.STRING,
					field: 'point_b'
				},
				pointC: {
					type: DataTypes.STRING,
					field: 'point_c'
				},
				pointD: {
					type: DataTypes.STRING,
					field: 'point_d'
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

		return InviteModel;
	};

})();