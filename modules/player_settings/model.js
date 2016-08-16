(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var PlayerSettings = sequelize.define('player_settings',
			{
				playerHash: {
					type: DataTypes.STRING,
					field: 'player'
				},
				validMachines: {
					type: DataTypes.TEXT,
					field: 'valid_machines',
					defaultValue: '',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('validMachines'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('validMachines', API.methods.setPseudoArray(val));
					}
				},
				requireMachineValidation: {
					type: DataTypes.BOOLEAN,
					field: 'require_machine_validation',
					defaultValue: false
				}
			}
		);

		return PlayerSettings;
	};

})();