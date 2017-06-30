(function() {
	'use strict';

	module.exports = {
		banned: 'YOU ARE BANNED.',
		bad_permission: 'Insufficient permissions to execute this task.',
		authorized: 'Authentication successful.',
		invalid_params: 'Invalid or no parameters specified.',
		no_results: 'No results were found.',
		invalid_password: 'Invalid password.',
		return_entry: 'Returning entry.',
		return_entries: 'Returning entries.',
		no_entry: 'Invalid entry.',
		no_entries: 'No entries so far.',
		entry_deleted: 'The entry has been deleted',
		new_entry: 'New entry successfully created.',
		duplicate_entry: 'This entry already exists',
		entry_param_exists: function(param) { return 'An entry with this ' + param + ' already exists.'; },
		entry_exists: function(entry) { return 'Entry ' + entry + ' already exists.'; },
		entry_not_found: function(entry) { return 'Could not find entry ' + entry + '.'; },
		entry_updated: function(entry) { return 'Entry ' + entry + ' updated successfully.'; },

		modules: {
			tags: {
				tooMany: 'You have hit the limit of maximum tags.'
			},
			reports: {
				duplicate: 'You have already filed this report.'
			},
			settings: {
				settings_updated: 'Your settings have been updated.',
				machine_included: 'This machine has already been white-listed.',
				machine_not_included: 'This machine is not currently white-listed.',
				min_machines: 'At least one machine should be white-listed.'
			},
			players: {
				already_registered: 'You are already registered.',
				already_freelancer: 'You are already a Freelancer.',
				already_soldier: 'You are already a Soldier.',
				freelancer_cant_create_pmc: 'Freelancers are not allowed to create PMCs.'
			},
			pmc: {
				that_in_pmc: 'This player is already part of a PMC.',
				not_in_pmc: 'You are currently not part of a PMC.',
				self_in_pmc: 'You are already part of a PMC.',
				action_not_allowed_soldiers: 'This action is not allowed for Soldiers without a PMC.',
				not_open_applications: 'This PMC is not currently open for applications.',
				tier_changed: function(good) { return 'The member has been ' + (good ? 'promoted' : 'demoted') + '.'; },
				higher_tier_req: 'This member needs to be of a higher tier before being promoted to owner.',
				now_leader: function(member, pmc) { return (member) + ' is now the leader of the PMC.'; },
				was_kicked: 'The player has been kicked out the PMC.',
				cant_leave_leader: 'You cannot leave a populated PMC as the leader. Transfer ownership to another member and try again.',
				size_up: 'The PMC size was successfully increased.',
				pmc_full: 'The PMC is full.'
			},
			bans: {
				no_reason: 'No reason given.'
			},
			friends: {
				own_pmc: 'You can\'t be friends with your own PMC.',
				own_self: 'You can\'t be friends with yourself!',
				already_friends: 'You are already friends with this player.',
				already_friends_pmc: 'Your PMC is already friends with this PMC.',
				friend_removed: 'The Operator has been removed from your friends list.'
			},
			messages: {
				message_to_self: "You wouldn't want to send a message to yourself.",
				new_message: "The message has been sent successfully!"
			},
			items: {
				not_owned: 'This item is not owned.'
			},
			intel: {
				hidden: 'Hidden'
			},
			invites: {
				invalid: 'Invalid Invite type.',
				request_playerPMC: 'Player requests membership with PMC.',
				invite_playerPMC: 'PMC invites player to join their ranks.',
				friends_player: 'Player invites another player to be their friend.',
				friends_PMC: 'PMC is inviting another PMC to be their allies.',
				invite_created: 'The invitation was sent successfully.',
				invite_exists: 'This invitation has already been sent.'
			},
			economy: {
				no_funds: 'Insufficient funds.',
				success: 'Purchase successful.',
				no_fundsF: function(p) { return 'This transaction requires ' + "D$" + " " + p.neededFunds + ", with only " + "D$" + " " + p.currentFunds + " currently in your possession."; }
			},
			modifiers: {
				no_active: 'No modifier is currently active.',
				activated: function(modifier) { return'The selected modifier ' + modifier + ' is now enabled.'; }
			},
			upgrades: {
				max_tier: 'This upgrade is as its maximum rank.',
				wrong_type: 'This upgrade is not compatible with your current job.',
				upgrade_toggled: function(word) { return 'Upgrade ownership is now ' + word + ' outsiders.'; },
				upgrade_prominence_toggled: function(word) { return 'Upgrade prominence is now ' + word + ' outsiders.'; },
				transaction_upgrade_low_rank: function(upgrade, curRank, nedRank) { return 'In order to complete this transaction, the upgrade "' + upgrade + '" needs to be at rank ' + nedRank + ' or higher, currently at ' + curRank + '.'; },
				transaction_upgrade_high_rank: function(upgrade, curRank, nedRank) { return 'In order to complete this transaction, the upgrade "' + upgrade + '" cannot be at or above rank ' + nedRank + ', currently at ' + curRank + '.'; }
			},
			uploads: {
				success: 'Uploaded completed.',
				failure: 'Upload has failed.',
				wrong_file: 'Wrong file uploaded.',
				wrong_type: 'Invalid file type.',
				file_size: 'The uploaded file is too large.'
			},
			stores: {
				item_owned: 'The store already owns this item.',
				item_not_owned: 'The store does not own this item.',
				item_not_owned_specific: function(item) { return 'The store does not own the ' + item + "."; },
				item_out_of_stock_specific: function(item) { return 'The store is out of the ' + item + "."; },
				item_not_available: function(item) { return item + " are not currently available."; },
				low_prestige: 'You lack the sufficient prestige to shop at this store.',
				status: {
					"dead": 'The store owner is dead, and will never come back - rest in peace.',
					"wounded": 'The store owner is currently wounded, and will need some time to recover.',
					"missing": 'The store owner has disappeared, and nobody knows where to.'
				}
			},

			api: {
				invalidDataType: function(constr, value) {
					var API = require('./../routes/api.js');
					return 'Value (' + value + ') [' + API.methods.getType(value) + '] is of invalid data-type (' + constr + ').';
				},
				textTooBig: function(constr, value) {
					return 'Length of value (' + value + ') is beyond (' + constr + ') characters.';
				},
				valueTooBig: function(constr, value) {
					return 'Length of value (' + value + ') is beyond (' + constr + ').';
				},
				textOutLimits: function(constr, value) {
					return 'Length of value (' + value + ') is not within ' + constr[0] + ' or ' + constr[1] + ' characters.';
				},
				valueOutLimits: function(constr, value) {
					return 'Length of value (' + value + ') is not within ' + constr[0] + ' or ' + constr[1] + '.';
				},
				valueNotAllowed: function(value) {
					return '"' + value + '" is not an allowed input value.';
				},
				valueUndefined: function(value) {
					return 'A required value provided is undefined.';
				}
			}
		}
	};

})();