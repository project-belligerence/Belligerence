(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var PMCUpgrades = sequelize.define('pmc_upgrades',
			{
				rankField: {
					type: DataTypes.INTEGER,
					field: 'rank',
					defaultValue: 1
				},
				visibleField: {
					type: DataTypes.BOOLEAN,
					field: 'visible',
					defaultValue: false
				},
				prominentField: {
					type: DataTypes.BOOLEAN,
					field: 'prominent',
					defaultValue: false
				}
			}
		);

		return PMCUpgrades;
	};

})();