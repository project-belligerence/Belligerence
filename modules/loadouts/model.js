(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var LoadoutModel = sequelize.define('loadouts_table',
			{
				ownerHash: {
					type: DataTypes.STRING,
					field: 'owner_hash'
				},
				ownerType: {
					type: DataTypes.STRING,
					field: 'owner_type'
				},
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				descriptionField: {
					type: DataTypes.STRING,
					field: 'description',
					defaultValue: "No description."
				},
				bookmarkField: {
					type: DataTypes.BOOLEAN,
					field: 'bookmarked',
					defaultValue: false
				},
				contentField: {
					type: DataTypes.TEXT,
					field: 'content',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getDoublePseudoArray(this.getDataValue('contentField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('contentField', API.methods.setDoublePseudoArray(val));
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

		return LoadoutModel;
	};

})();