(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var InterestModel = sequelize.define('interest_table',
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
				hashField: {
					type: DataTypes.STRING,
					defaultValue: ''
				}
			},
			{
				freezeTableName: true,
				name: {
					singular: 'Interest',
					plural: 'Interests'
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
						InterestModel.belongsTo(models.players, { as: "Poster", onDelete: "CASCADE", foreignKey: { allowNull: true } });
						InterestModel.belongsTo(models.missions, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
					}
				}
			}
		);

		return InterestModel;
	};

})();
