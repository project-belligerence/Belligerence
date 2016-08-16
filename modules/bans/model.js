(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var BansModel = sequelize.define('bans_table',
			{
				bannedHash: {
					type: DataTypes.STRING,
					field: 'banned'
				},
				issuerHash: {
					type: DataTypes.STRING,
					field: 'issuer'
				},
				reasonField: {
					type: DataTypes.TEXT,
					field: 'reason'
				},
				expirationDate: {
					type: DataTypes.DATE,
					field: 'expiration_date'
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: true,
					get: function() {
						var expirationDate = this.getDataValue('expirationDate'),
							todayDate = (new Date());
						if (expirationDate <= todayDate) {
							return false;
						} else { return this.getDataValue('activeField'); }
					}
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

		return BansModel;
	};

})();