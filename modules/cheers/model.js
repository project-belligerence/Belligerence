(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var CheersModel = sequelize.define('cheers_table',
			{
				senderHash: { // The Hash of the player who's cheered for the content.
					type: DataTypes.STRING,
					field: 'sender'
				},
				targetHash: { // The Hash of the content that was cheered.
					type: DataTypes.STRING,
					field: 'target'
				},
				typeField: { // The type of the content: "intel"
					type: DataTypes.STRING,
					field: 'type'
				}
			}
		);

		return CheersModel;
	};

})();