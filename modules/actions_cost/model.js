(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var ActionsCostModel = sequelize.define('actions_cost_table',
			{
				nameField: { // Name of the cost table
					type: DataTypes.TEXT,
					field: 'name'
				},
				activeField: { // Whether the table is active or not
					type: DataTypes.BOOLEAN,
					field: 'active',
					defaultValue: false
				},
				costInvitesPlayer: { // Cost to invite a player to a PMC
					type: DataTypes.INTEGER,
					field: 'invites_player',
					defaultValue: 0
				},
				costInvitesPMC: { // Cost to form an alliance with a PMC
					type: DataTypes.INTEGER,
					field: 'invites_pmc',
					defaultValue: 0
				},
				costPostIntelBase: { // Base cost to post an Intel
					type: DataTypes.INTEGER,
					field: 'intel_cost',
					defaultValue: 0
				},
				costBuyPrestigePlayer: { // Base cost to improve your prestige
					type: DataTypes.INTEGER,
					field: 'prestige_player',
					defaultValue: 0
				},
				costBuyPrestigePMC: { // Base cost to improve your PMC prestige
					type: DataTypes.INTEGER,
					field: 'prestige_pmc',
					defaultValue: 0
				},
				costUpgradeSizePMC: { // Base cost to upgrade the size of your PMC
					type: DataTypes.INTEGER,
					field: 'size_pmc',
					defaultValue: 0
				}
			},
			{
				instanceMethods: {
					setActiveState: function(state) { return this.update({ "activeField": state }); }
				}
			}
		);

		return ActionsCostModel;
	};

})();