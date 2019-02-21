(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var AdvisoriesModel = sequelize.define('advisories_table',
			{
				nameField: {
					type: DataTypes.STRING,
					field: 'name'
				},
				descriptionField: {
					type: DataTypes.TEXT,
					field: 'description'
				},
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				iconName: {
					type: DataTypes.STRING,
					field: 'icon',
					defaultValue: 'generic'
				},
				valueField: {
					type: DataTypes.INTEGER,
					field: 'value',
					defaultValue: 0
				},
				disabledObjectives: {
					type: DataTypes.STRING,
					field: 'disabled_objectives',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('disabledObjectives'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('disabledObjectives', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				disabledMaps: {
					type: DataTypes.STRING,
					field: 'disabled_maps',
					get: function() {
						var API = require('./../../routes/api.js');
						return require("lodash").sortBy(API.methods.getPseudoArray(this.getDataValue('disabledMaps'), true));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('disabledMaps', API.methods.setPseudoArray(require("lodash").sortBy(val)));
					}
				},
				globalField: {
					type: DataTypes.BOOLEAN,
					field: 'global',
					defaultValue: false
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
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);
						model.setDataValue('hashField', newHash);
					}
				},
				classMethods: {},
			}
		);

		return AdvisoriesModel;
	};

})();