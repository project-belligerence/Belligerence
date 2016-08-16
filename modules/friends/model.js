(function(){

	'use strict';

	module.exports = function(sequelize, DataTypes) {
			var FriendsModel = sequelize.define('friends_table',
			{
				friendAHash: { // The hashField for the Friend A, typically the one who made the invitation.
					type: DataTypes.STRING,
					field: 'friend_a'
				},
				friendBHash: { // The hashField for the Friend B, typically the one who was invited and accepted the invitation.
					type: DataTypes.STRING,
					field: 'friend_b'
				},
				friendType: { // The type of Friendship, "player" or "pmc".
					type: DataTypes.STRING,
					field: 'type'
				}
			}
		);

		return FriendsModel;
	};

})();