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
				itemClassname: {
					type: DataTypes.STRING,
					field: 'item_classname'
				},
				itemType: {
					type: DataTypes.STRING,
					field: 'item_type'
				},
				itemClass: {
					type: DataTypes.STRING,
					field: 'item_class'
				},
				amountField: {
					type: DataTypes.INTEGER,
					field: 'amount',
					defaultValue: 0
				},
				deployedAmount: {
					type: DataTypes.INTEGER,
					field: 'deployed_amount',
					defaultValue: 0
				}
			}
		);

		return PlayerItems;
	};

})();