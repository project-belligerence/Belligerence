(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var PMCSettings = sequelize.define('pmc_settings',
			{
				pmcHash: {
					type: DataTypes.STRING,
					field: 'pmc'
				},
				validMachines: {
					type: DataTypes.TEXT,
					field: 'valid_machines',
					defaultValue: ''
				}
			}
		);

		return PMCSettings;
	};

})();