(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ParticipantModel = sequelize.define('participant_table',
			{
				leaderField: {
					type: DataTypes.BOOLEAN,
					field: 'leader',
					defaultValue: false
				},
				resolutionField: {
					type: DataTypes.INTEGER,
					field: 'resolution',
					defaultValue: 0
				},
				deployedAssetsField: {
					type: DataTypes.INTEGER,
					field: 'deployed_assets',
					defaultValue: 0
				},
				casualtiesField: {
					type: DataTypes.INTEGER,
					field: 'casualties',
					defaultValue: 0
				},
				techModifier: {
					type: DataTypes.INTEGER,
					field: 'tech',
					defaultValue: 0
				},
				trainingModifier: {
					type: DataTypes.INTEGER,
					field: 'training',
					defaultValue: 0
				},
				intelModifier: {
					type: DataTypes.INTEGER,
					field: 'intel',
					defaultValue: 0
				},
				munificenceModifier: {
					type: DataTypes.INTEGER,
					field: 'munificence',
					defaultValue: 0
				},
				statusField: {
					type: DataTypes.INTEGER,
					field: 'status',
					defaultValue: 0
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: true
				}
			},
			{ freezeTableName: true	}
		);

		return ParticipantModel;
	};

})();