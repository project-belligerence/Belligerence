(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var PlayerItems = sequelize.define('player_items',
			{
				ownerHash: {
					type: DataTypes.STRING,
					field: 'owner'
				},
				itemHash: {
					type: DataTypes.STRING,
					field: 'item'
				},
				amountField: {
					type: DataTypes.INTEGER,
					field: 'amount',
					defaultValue: 0
				},
				deployedField: {
					type: DataTypes.BOOLEAN,
					field: 'deployed',
					defaultValue: false
				}
			}
		);

		return PlayerItems;
	};

})();