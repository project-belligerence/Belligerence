(function(){

	'use strict';

	var config = require('./../../config.js');

	module.exports = function(sequelize, DataTypes) {
			var AccessKeysModel = sequelize.define('accesskey_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				seedField: {
					type: DataTypes.STRING,
					field: 'seed'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				skipSteamField: {
					type: DataTypes.BOOLEAN,
					field: 'skip_steam',
					defaultValue: false
				},
				fundsField: {
					type: DataTypes.INTEGER,
					field: 'funds',
					defaultValue: 0
				},
				privilegeField: {
					type: DataTypes.INTEGER,
					field: 'privilege',
					defaultValue: config.privileges().tiers.user
				},
				hashField: {
					type: DataTypes.STRING,
					field: 'access_hash'
				},
				usedField: {
					type: DataTypes.BOOLEAN,
					field: 'used',
					defaultValue: false
				}
			},
			{
				hooks: {
					beforeCreate: function(model, options) {
			            var bcrypt = require('bcrypt-nodejs'),
			            	seed = model.getDataValue('seedField'),
			            	salt = bcrypt.genSaltSync(1),
        					hash = bcrypt.hashSync(seed, salt);
        				model.setDataValue('hashField', hash);
					}
				}
			}
		);

		return AccessKeysModel;
	};

})();