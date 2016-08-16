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