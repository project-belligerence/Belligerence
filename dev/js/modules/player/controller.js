(function() {
	'use strict';

	PlayerControllerFunction.$inject = ["$rootScope", "$scope", "$state", "$stateParams", "apiServices", "generalServices", "uiServices", "unitsServices", "upgradesServices", "playerInfo", "selfInfo", "selfFriends"];

	function PlayerControllerFunction($rootScope, $scope, $state, $stateParams, apiServices, generalServices, uiServices, unitsServices, upgradesServices, playerInfo, selfInfo, selfFriends) {
		var vm = this;

		vm.playerInfo = playerInfo[0];
		vm.tierName = "";

		if ((playerInfo.length === 0 || !(playerInfo))) return $state.go("app.public.frontpage");

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.selfFriends = (selfFriends || []);
		vm.displayTierName = displayTierName;

		vm.statsItems = [
			new statsItem('Successful Missions', 'trophy', 'missionsWonNum'),
			new statsItem('Failed Missions', 'close', 'missionsfailedNum')
		];

		vm.addAsFriend = addAsFriend;
		vm.inviteToOutfit = inviteToOutfit;
		vm.checkIfFriend = checkIfFriend;
		vm.checkOwnProfile = checkOwnProfile;
		vm.sendMessage = sendMessage;
		vm.sendReport = sendReport;
		vm.removeAsFriend = removeAsFriend;
		vm.checkInviteOutfit = checkInviteOutfit;
		vm.realUnitAttr = realUnitAttr;
		vm.gV = gV;
		vm.eV = eV;

		vm.displayContract = apiServices.displayContract;
		vm.displayPrivilege = apiServices.displayPrivilege;
		vm.numberToArray = apiServices.numberToArray;
		vm.applyControlledClass = apiServices.applyControlledClass;
		vm.vv = apiServices.vv;

		vm.prominenceClass = upgradesServices.setProminenceClass;
		vm.rankComplete = upgradesServices.getRankComplete;

		vm.getString = getString;
		vm.upgradesBarText = upgradesBarText;

		displayTierName(vm.playerInfo);
		generalServices.getRegions().then(function(v) { vm.regionNames = v; });

		uiServices.updateWindowTitle([vm.playerInfo.aliasField, "Operator"]);

		// ====================================================================

		function eV(v) { return vm.vv(vm.playerInfo[v]); }

		function gV(v) {
			if (vm.eV(v)) return vm.playerInfo[v];

			switch(v) {
				case "contractType": { return 2; } break;
				case "bioField": { return "No description available."; } break;
				default: { return "???"; } break;
			}
		}

		function realUnitAttr(attr) {
			switch(attr) {
				case "side": {
					return (vm.playerInfo.PMC ? vm.playerInfo.PMC.sideField : vm.playerInfo.sideField);
				} break;
			}
		}

		function upgradesBarText() {
			return {
				text: (vm.playerInfo.PMC ? "Outfit Upgrades" : "Featured Upgrades"),
				hint: (vm.playerInfo.PMC ? "The Upgrades chosen by this Unit's Outfit to be featured." : "The Upgrades chosen by this Unit to be featured.")
			};
		}

		function statsItem(text, icon, value) { return { text: text, icon: ("ion-" + icon),	value: value };}

		function displayTierName(player) {
			if (player.PMC) {
				return generalServices.getPMCTiers(player.PMC.hashField).then(function(data) {
					vm.tierName = (data[0].tier_names[player.playerTier]);
				});
			} else { return "";	}
		}

		function checkIfFriend() {
			var isFriend = false;
			for (var i in vm.selfFriends) {if (vm.selfFriends[i].friendHash === vm.playerInfo.hashField) isFriend = true;}
			if (checkOwnProfile() === true) isFriend = true;
			return isFriend;
		}

		function checkInviteOutfit() {
			var canInvite = false;
			canInvite = (((vm.selfInfo.PMC !== undefined) && (vm.playerInfo.contractType === 1) && (vm.selfInfo.playerTier < 2)) && !(vm.playerInfo.PMC));
			if (checkOwnProfile() === true) canInvite = false;
			return canInvite;
		}

		function checkOwnProfile() { return (vm.playerInfo.hashField === vm.selfInfo.hashField); }

		function addAsFriend() { return unitsServices.askAddFriend({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField}); }

		function inviteToOutfit() { return unitsServices.askInviteToOutfit({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField, prestige: (Math.max(vm.playerInfo.playerPrestige, 1)) }); }

		function removeAsFriend() {
			unitsServices.askRemoveFriend({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField}).then(function(data) {
				if (data) $state.reload();
			});
		}

		function sendMessage() {return unitsServices.askSendMessage({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField});}
		function sendReport() {return unitsServices.askReportPlayer({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField});}

		function getString(value) {
			var rString = "";
			switch(value) {
				case "friends": {
					rString = checkIfFriend() ? "You are already friends with this Operator." : "Sends the Operator a friend request.";
					rString = checkOwnProfile() ? "You may not add yourself as a friend." : rString;
				} break;
			}
			return rString;
		}
	}

	exports.function = PlayerControllerFunction;
})();