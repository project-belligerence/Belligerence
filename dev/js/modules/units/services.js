(function() {
	'use strict';

	UnitsServicesFunction.$inject = ["uiServices", "alertsServices", "generalServices", "playerServices", "pmcServices", "fundsServices"];

	function UnitsServicesFunction(uiServices, alertsServices, generalServices, playerServices, pmcServices, fundsServices) {

		var methods = {
			centerUnits: centerUnits,

			checkRank: checkRank,
			checkFriend: checkFriend,
			checkMessage: checkMessage,

			checkDemote: checkDemote,
			checkPromote: checkPromote,

			getPlayerProfile: getPlayerProfile,
			getPMCProfile: getPMCProfile,

			askKickPlayer: askKickPlayer,

			askAddFriend: askAddFriend,
			askAddAlly: askAddAlly,

			askRemoveFriend: askRemoveFriend,
			askRemoveAlly: askRemoveAlly,

			askSendMessage: askSendMessage,

			askReportPlayer: askReportPlayer,
			askReportPMC: askReportPMC,

			askPromotePlayer: askPromotePlayer,
			askDemotePlayer: askDemotePlayer,

			askInviteToOutfit: askInviteToOutfit,
			askJoinPMC: askJoinPMC
		};

		function centerUnits() { uiServices.centerElements(".unit", ".unit-avatar .medium");}

		function notPlayer(a, p) {return (p.hashField !== a.hash);}

		function checkDemote(a, p) { return (checkRank(a, p) && (a.tier < 4)); }
		function checkPromote(a, p) { return (checkRank(a, p) && (a.tier > 1)); }

		function checkRank(a, p) {return ((p.playerTier < a.tier) && notPlayer(a, p));}
		function checkMessage(a, p) {return notPlayer(a, p);}

		function checkFriend(a, p, f) {
			var i, r = false;
			for (i in f) { if (f[i].friendHash === a.hash) { r = true; break; }}
			return (notPlayer(a, p) && !(r));
		}

		function getPlayerProfile(args) {
			return ("operator/" + args.hash);
		}

		function getPMCProfile(args) {
			return ("outfit/" + args.hash);
		}

		function askKickPlayer(args) {
			var
				modalOptions = {
					header: { text: 'Kick Operator?', icon: 'ion-alert-circled' },
					body: {	text: 'Are you sure you want to kick ' + args.alias + ' from the Outfit?' },
					choices: {
						yes: { text: 'Do it', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return pmcServices.kickPlayer(args.hash);	}
				else { return false; }
			});
		}

		function askPromotePlayer(args) {
			var
				modalOptions = {
					header: { text: 'Promote Operator?', icon: 'ion-star' },
					body: {	text: 'Are you sure you want to promote ' + args.alias + ' to the next Rank in the Outfit?' },
					choices: {
						yes: { text: 'Go ahead', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return pmcServices.promotePlayer(args.hash, args.tier);}
				else { return false; }
			});
		}

		function askDemotePlayer(args) {
			var
				modalOptions = {
					header: { text: 'Demote Operator?', icon: 'ion-ios-star-half' },
					body: {	text: 'Are you sure you want to demote ' + args.alias + ' to the previous Rank in the Outfit?' },
					choices: {
						yes: { text: 'Do it', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return pmcServices.demotePlayer(args.hash, args.tier);}
				else { return false; }
			});
		}

		function askRemoveFriend(args) {
			var
				modalOptions = {
					header: { text: 'Remove friend?', icon: 'ion-minus' },
					body: {	text: 'Are you sure you want to remove ' + args.alias + ' from your friends list?' },
					choices: {
						yes: { text: 'Remove', icon: 'ion-minus' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return newModal.result.then(function(choice) {
				if (choice) { return playerServices.removeFriend(args.hash); }
				else { return false; }
			});
		}

		function askRemoveAlly(args) {
			var
				modalOptions = {
					header: { text: 'Dissolve alliance?', icon: 'ion-minus' },
					body: {	text: 'Are you sure you want to dissolve your Outfit alliance with ' + args.alias + '?' },
					choices: {
						yes: { text: 'Dissolve', icon: 'ion-minus' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return newModal.result.then(function(choice) {
				if (choice) { return pmcServices.removeAlliance(args.hash); }
				else { return false; }
			});
		}

		function askAddFriend(args) {
			var
				modalOptions = {
					header: { text: 'Add as friend?', icon: 'ion-person-add' },
					body: {	text: 'Are you sure you want to send ' + args.alias + ' a friend request?' },
					choices: {
						yes: { text: 'Send request', icon: 'ion-plus-round' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}, context: "player", target: args.hash
				}, newModal = uiServices.createModal('SendInvite', modalOptions)
			;

			newModal.result.then(function(params) {
				if (params.choice) { generalServices.sendPlayerFriendRequest(args.hash, params.note); }
				else { return false; }
			});
		}

		function askAddAlly(args) {
			fundsServices.getActionCost("costInvitesPMC").then(function(inviteCost) {
				var	modalOptions = {
						header: { text: 'Propose alliance?', icon: 'ion-network' },
						body: {	text: 'Are you sure you want to propose an alliance between ' + args.alias + ' and your own Outfit?' },
						choices: {
							yes: { text: 'Send request', icon: 'ion-plus-round' },
							no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
						}, context: "pmc", target: args.hash, cost: inviteCost
					}, newModal = uiServices.createModal('SendInvite', modalOptions);

				newModal.result.then(function(params) {
					if (params.choice) { generalServices.sendPMCFriendRequest(args.hash, params.note, inviteCost); }
					else { return false; }
				});
			});
		}

		function askInviteToOutfit(args) {
			fundsServices.getActionCost("costInvitesPlayer").then(function(inviteCost) {
				var	modalOptions = {
					header: { text: 'Invite to your Outfit?', icon: 'ion-android-people' },
					body: {	text: 'Are you sure you want to invite ' + args.alias + ' to your Outfit?' },
					choices: {
						yes: { text: 'Send invite', icon: 'ion-plus-round' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}, context: "player", target: args.hash, cost: (inviteCost * args.prestige)
				}, newModal = uiServices.createModal('SendInvite', modalOptions);

				newModal.result.then(function(params) {
					if (params.choice) { generalServices.inviteJoinPMC(args.hash, params.note, (inviteCost * args.prestige)); }
					else { return false; }
				});
			});
		}

		function askJoinPMC(args) {
			var modalOptions = {
				header: { text: 'Apply to this Outfit?', icon: 'ion-clipboard' },
				body: {	text: 'Are you sure you want to apply to join ' + args.alias + '?' },
				choices: {
					yes: { text: 'Send application', icon: 'ion-checkmark' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}, context: "pmc", target: args.hash
			}, newModal = uiServices.createModal('SendInvite', modalOptions);

			newModal.result.then(function(params) {
				if (params.choice) { generalServices.requestJoinPMC(args.hash, params.note); }
				else { return false; }
			});
		}

		function askReportPlayer(args) {
			var
			modalOptions = { alias: args.alias,	hash: args.hash, content: "player", types: ["harassment", "illegal", "bug", "rules"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function askSendMessage(args) {
			var
				modalOptions = { receiver: { alias: args.alias,	hash: args.hash	}};
			if (args.suggestions) {	modalOptions.suggestions = { title: (args.suggestions.title || null), body: (args.suggestions.body || null) }; }

			var newModal = uiServices.createModal('SendMessage', modalOptions);

			return newModal.result.then(function(params) {
				if (params.choice) { return generalServices.sendMessage(params);}
				else { return false; }
			});
		}

		function askReportPMC(args) {
			var
			modalOptions = { alias: args.alias,	hash: args.hash, content: "pmc", types: ["harassment", "illegal", "bug", "rules"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		return methods;
	}

	exports.function = UnitsServicesFunction;
})();