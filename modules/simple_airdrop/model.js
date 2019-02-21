(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var SimpleAirdropModel = sequelize.define('simple_airdrop',
			{
				classnameField: {
					type: DataTypes.STRING,
					field: 'classname'
				},
				gridField: {
					type: DataTypes.STRING,
					field: 'grid_ref',
					defaultValue: "000000"
				},
				colorField: {
					type: DataTypes.STRING,
					field: 'color',
				}
			}
		);

		return SimpleAirdropModel;
	};

})();