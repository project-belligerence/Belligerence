(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var NegotiationsModel = sequelize.define('negotiations_table',
			{
				sideField: {
					type: DataTypes.INTEGER,
					field: 'side'
				},
				percentField: {
					type: DataTypes.INTEGER,
					field: 'percent',
					defaultValue: 1
				},
				turnField: {
					type: DataTypes.INTEGER,
					field: 'turn',
					defaultValue: 1
				},
				roundField: {
					type: DataTypes.INTEGER,
					field: 'round',
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
					singular: 'Negotiation',
					plural: 'Negotiations'
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
						NegotiationsModel.belongsTo(models.pmc, { as: "Outfit", onDelete: "CASCADE", foreignKey: { allowNull: false } });
						NegotiationsModel.belongsTo(models.players, { as: "Freelancer", onDelete: "CASCADE", foreignKey: { allowNull: false } });
						NegotiationsModel.belongsTo(models.missions, { onDelete: "CASCADE", foreignKey: { allowNull: false } });
					}
				}
			}
		);

		return NegotiationsModel;
	};

})();
