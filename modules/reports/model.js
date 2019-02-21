(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ReportsModel = sequelize.define('reports_table',
			{
				reasonField: { // Details why the report was filed in the first place.
					type: DataTypes.STRING,
					field: 'reason'
				},
				typeField: { // Type of report: 'rules', 'illegal', 'bug'
					type: DataTypes.STRING,
					field: 'type'
				},
				contentField: { // Type of content that was reported: 'players', 'pmc', 'intel', 'item', 'store', 'upgrade', 'comment'
					type: DataTypes.STRING,
					field: 'content'
				},
				resolvedField: { // Whether the report was resolved by the moderators.
					type: DataTypes.BOOLEAN,
					field: 'resolved',
					defaultValue: false
				},
				issuerHash: { // The hash of the reporting player.
					type: DataTypes.STRING,
					field: 'issuer'
				},
				reportedHash: { // The hash of the content reported.
					type: DataTypes.STRING,
					field: 'reported'
				},
				hashField: { // hash to identify the report.
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

		return ReportsModel;
	};

})();