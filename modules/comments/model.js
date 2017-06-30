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
					field: 'commenterField'
				},
				subjectField: { // hashField
					type: DataTypes.STRING,
					field: 'subjectField'
				},
				cheersDetails: { // Dummy field that contains the hashes of all users that have cheered the content.
					type: DataTypes.STRING,
					field: 'cheers'
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