(function() {
	'use strict';

	UnitsServicesFunction.$inject = ["uiServices", "alertsServices", "generalServices", "playerServices", "pmcServices"];

	function UnitsServicesFunction(uiServices, alertsServices, generalServices, playerServices, pmcServices) {

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

			askSendMessage: askSendMessage,

			askReportPlayer: askReportPlayer,
			askReportPMC: askReportPMC,

			askPromotePlayer: askPromotePlayer,
			askDemotePlayer: askDemotePlayer,

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
						yes: { text: 'Do it', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
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
						yes: { text: 'Go ahead', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
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
						yes: { text: 'Do it', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return pmcServices.demotePlayer(args.hash, args.tier);}
				else { return false; }
			});
		}

		function askAddFriend(args) {
			var
				modalOptions = {
					header: { text: 'Add as friend?', icon: 'ion-person-add' },
					body: {	text: 'Are you sure you want to send ' + args.alias + ' a friend request?' },
					choices: {
						yes: { text: 'Send request', icon: 'ion-plus-round', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			newModal.result.then(function(choice) {
				if (choice) { generalServices.sendPlayerFriendRequest(args.hash); }
				else { return false; }
			});
		}

		function askRemoveFriend(args) {
			var
				modalOptions = {
					header: { text: 'Remove friend?', icon: 'ion-minus' },
					body: {	text: 'Are you sure you want to remove ' + args.alias + ' from your friends list?' },
					choices: {
						yes: { text: 'Remove', icon: 'ion-minus', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return newModal.result.then(function(choice) {
				if (choice) { return playerServices.removeFriend(args.hash); }
				else { return false; }
			});
		}

		function askAddAlly(args) {
			var
				modalOptions = {
					header: { text: 'Propose alliance?', icon: 'ion-network' },
					body: {	text: 'Are you sure you want to propose an alliance between ' + args.alias + ' and your own Outfit?' },
					choices: {
						yes: { text: 'Send request', icon: 'ion-plus-round', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			newModal.result.then(function(choice) {
				if (choice) { generalServices.sendPMCFriendRequest(args.hash); }
				else { return false; }
			});
		}

		function askReportPlayer(args) {
			var
			modalOptions = { alias: args.alias,	hash: args.hash, content: "player", types: ["harassment", "illegal", "bug", "rules"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				console.log(choice);
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function askSendMessage(args) {
			var
				modalOptions = { receiver: { alias: args.alias,	hash: args.hash	}},
				newModal = uiServices.createModal('SendMessage', modalOptions);

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
				console.log(choice);
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function askJoinPMC(args) {
			var
				modalOptions = {
					header: { text: 'Apply to this Outfit?', icon: 'ion-clipboard' },
					body: {	text: 'Are you sure you want to apply to join ' + args.alias + '?' },
					choices: {
						yes: { text: 'Send application', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			newModal.result.then(function(choice) {
				if (choice) { generalServices.requestJoinPMC(args.hash); }
				else { return false; }
			});
		}

		return methods;
	}

	exports.function = UnitsServicesFunction;
})();