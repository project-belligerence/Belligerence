(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ContractsModel = sequelize.define('contracts_table',
			{
				sideField: { // Side to which the Contract is being signed to
					type: DataTypes.INTEGER,
					field: 'side'
				},
				percentField: { // How much the Contract will deduct from the overall reward
					type: DataTypes.INTEGER,
					field: 'percent',
					defaultValue: 1
				},
				statusField: { // The current state of the Contract (pending, completed, failed)
					type: DataTypes.INTEGER,
					field: 'status',
					defaultValue: 0
				},
				redeemedField: { // Whether the Contract has been cashed in once completed
					type: DataTypes.BOOLEAN,
					field: 'redeemed',
					defaultValue: 0
				},
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'Contract',
					plural: 'Contracts'
				},
				hooks: {
					beforeCreate: function(model, options) {
						var md5 	= require("md5"),
							config 	= require('./../../config.js'),
							newHash = (md5((Math.random(9999999))+(new Date()))).substring(0,config.db.hashSize);
						model.setDataValue('hashField', newHash);
					}
				},
				classMethods: {
					associate: function(models) {
						ContractsModel.belongsTo(models.pmc, { as: "Employer", onDelete: "CASCADE", foreignKey: { allowNull: false } });
						ContractsModel.belongsTo(models.players, { as: "Contracted", onDelete: "CASCADE", foreignKey: { allowNull: true } });
						ContractsModel.belongsTo(models.missions, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
					}
				}
			}
		);

		return ContractsModel;
	};

})();
