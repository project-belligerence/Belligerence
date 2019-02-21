(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var StoreStock = sequelize.define('store_stock',
			{
				amountField: {
					type: DataTypes.INTEGER,
					field: 'amount',
					defaultValue: 0
				},
				discountField: {
					type: DataTypes.INTEGER,
					field: 'store_discount',
					defaultValue: 0
				},
				supplyAmount: { // Target amount of the item that should be added to the store
					type: DataTypes.INTEGER,
					field: 'supply_amount',
					defaultValue: 0
				},
				minSupplyPercent: { // Min percent that will be added per resupply, to 100%
					type: DataTypes.INTEGER,
					field: 'min_supply_percent',
					defaultValue: 100
				},
				discountDeviation: { // How much the discount value will deviate, -x% to x%
					type: DataTypes.INTEGER,
					field: 'discount_deviation',
					defaultValue: 50
				},
				availableField: {
					type: DataTypes.BOOLEAN,
					field: 'available',
					defaultValue: false
				}
			}
		);

		return StoreStock;
	};

})();