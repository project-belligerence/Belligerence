(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ModifierModel = sequelize.define('modifiers_table',
			{
				nameField: {
					type: DataTypes.TEXT,
					field: 'name'
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: false
				},
				discountAll: {
					type: DataTypes.INTEGER,
					field: 'discounts_all',
					defaultValue: 0
				},
				discountMarket: {
					type: DataTypes.INTEGER,
					field: 'discounts_market',
					defaultValue: 0
				},
				discountItems: {
					type: DataTypes.INTEGER,
					field: 'discounts_items',
					defaultValue: 0
				},
				discountWeapons: {
					type: DataTypes.INTEGER,
					field: 'discounts_weapons',
					defaultValue: 0
				},
				discountVehicles: {
					type: DataTypes.INTEGER,
					field: 'discounts_vehicles',
					defaultValue: 0
				},
				discountUpgrades: {
					type: DataTypes.INTEGER,
					field: 'discounts_upgrades',
					defaultValue: 0
				},
				discountBureaucracy: {
					type: DataTypes.INTEGER,
					field: 'discounts_bureaucracy',
					defaultValue: 0
				},
				discountMissionsAll: {
					type: DataTypes.INTEGER,
					field: 'discounts_missions_all',
					defaultValue: 0
				},
				bonusMissionsAll: {
					type: DataTypes.INTEGER,
					field: 'bonus_missions_all',
					defaultValue: 0
				}
			},
			{
				instanceMethods: {
					setActiveState: function(state, done) {
						if (done) {
							return this.update({ "activeField": state}).then(function(){
								return done();
							});
						} else {
							return this.update({ "activeField": state});
						}
					}
				}
			}
		);

		return ModifierModel;
	};

})();