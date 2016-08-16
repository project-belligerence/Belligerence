(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var MessagesModel = sequelize.define('messages_table',
			{
				titleField: {
					type: DataTypes.TEXT,
					field: 'title'
				},
				bodyField: {
					type: DataTypes.TEXT,
					field: 'body'
				},
				readField: {
					type: DataTypes.BOOLEAN,
					field: 'read',
					defaultValue: false
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
				},
				classMethods: {
					associate: function(models) {
						MessagesModel.belongsTo(models.players, { as: 'Sender' });
						MessagesModel.belongsTo(models.players, { as: 'Receiver' });
					}
				}
			}
		);

		return MessagesModel;
	};

})();