(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var TransactionHistoryModel = sequelize.define('transaction_history_table',
			{
				buyerHash: { // hashField of the buying PLAYER
					type: DataTypes.STRING,
					field: 'buyer'
				},
				buyerIPField: { // IP of the buying player
					type: DataTypes.STRING,
					field: 'buyer_ip',
					defaultValue: 'CLASSIFIED'
				},
				recipientType: { // The type of the purchase target, be it PMC or Player
					type: DataTypes.STRING,
					field: 'recipient_type'
				},
				recipientHash: { // The hashField of the entitiy receiving the purchase.
					type: DataTypes.STRING,
					field: 'recipient',
					defaultValue: 'buyer'
				},
				sellerHash: { // hashField of the selling entity - player, store or system.
					type: DataTypes.STRING,
					field: 'seller',
					defaultValue: 'system'
				},
				sellerType: { // Type of the seller - player, store, or system.
					type: DataTypes.STRING,
					field: 'seller_type',
					defaultValue: 'system'
				},
				typeField: { // Type of the purchase - market, upgrade, bureaucracy or service.
					type: DataTypes.STRING,
					field: 'type'
				},
				objectField: { // Contains the objects purchased.
					type: DataTypes.TEXT, // PSEUDOARRAY
					field: 'object',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('objectField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('objectField', API.methods.setPseudoArray(val));
					}
				},
				amountField: { // Amount of items purchased, or rank for upgrade.
					type: DataTypes.TEXT, // PSEUDOARRAY
					field: 'amount',
					get: function() {
						var API = require('./../../routes/api.js');
						return API.methods.getPseudoArray(this.getDataValue('amountField'));
					},
					set: function(val) {
						var API = require('./../../routes/api.js');
						this.setDataValue('amountField', API.methods.setPseudoArray(val));
					}
				},
				costField: { // The value of the transaction.
					type: DataTypes.FLOAT,
					field: 'cost'
				},
				detailsField: { // Whatever relevant details not included in the previous categories.
					type: DataTypes.STRING,
					field: 'details'
				},
				notesField: { // Notes attached to the purchase.
					type: DataTypes.STRING,
					field: 'notes'
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);

						model.setDataValue('hashField', newHash);
					}
				}
			}
		);

		return TransactionHistoryModel;
	};

})();