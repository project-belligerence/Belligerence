(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var CommentsModel = sequelize.define('comments_table',
			{
				titleField: {
					type: DataTypes.TEXT,
					field: 'title'
				},
				bodyField: {
					type: DataTypes.TEXT,
					field: 'body'
				},
				typeField: {
					type: DataTypes.STRING,
					field: 'type'
				},
				commenterField: { // hashField
					type: DataTypes.STRING,
					fielld: 'commentator'
				},
				subjectField: { // hashField
					type: DataTypes.STRING,
					fielld: 'subject'
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

		return CommentsModel;
	};

})();