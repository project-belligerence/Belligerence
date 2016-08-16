(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ActionsCostModel = sequelize.define('actions_cost_table',
			{
				nameField: {
					type: DataTypes.TEXT,
					field: 'name'
				},
				activeField: {
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: false
				},
				costInvitesPlayer: {
					type: DataTypes.INTEGER,
					field: 'invites_player',
					defaultValue: 0
				},
				costInvitesPMC: {
					type: DataTypes.INTEGER,
					field: 'invites_player',
					defaultValue: 0
				},
				costPostIntelPlayer: {
					type: DataTypes.INTEGER,
					field: 'intel_player',
					defaultValue: 0
				},
				costPostIntelPMC: {
					type: DataTypes.INTEGER,
					field: 'intel_pmc',
					defaultValue: 0
				},
				costPostIntelAnonymous: {
					type: DataTypes.INTEGER,
					field: 'intel_anonymous',
					defaultValue: 0
				},
				costBuyPrestigePlayer: {
					type: DataTypes.INTEGER,
					field: 'prestige_player',
					defaultValue: 0
				},
				costBuyPrestigePMC: {
					type: DataTypes.INTEGER,
					field: 'prestige_pmc',
					defaultValue: 0
				},
				costUpgradeSizePMC: {
					type: DataTypes.INTEGER,
					field: 'size_pmc',
					defaultValue: 0
				}
			},
			{
				instanceMethods: {
					setActiveState: function(state) { return this.update({ "activeField": state}); }
				}
			}
		);

		return ActionsCostModel;
	};

})();