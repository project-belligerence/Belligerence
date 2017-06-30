(function() {
	'use strict';

	PlayerControllerFunction.$inject = ["$rootScope", "$scope", "$state", "$stateParams", "apiServices", "uiServices", "unitsServices", "playerInfo", "selfInfo", "selfFriends"];

	function PlayerControllerFunction($rootScope, $scope, $state, $stateParams, apiServices, uiServices, unitsServices, playerInfo, selfInfo, selfFriends) {
		var vm = this;

		vm.playerInfo = playerInfo[0];

		if ((playerInfo.length === 0 || !(playerInfo))) return $state.go("app.public.frontpage");

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.selfFriends = (selfFriends || []);
		vm.displayContract = apiServices.displayContract;
		vm.displayPrivilege = apiServices.displayPrivilege;

		console.log("PLAYER INFO:", vm.playerInfo);
		console.log("SELF INFO:", vm.selfInfo);
		console.log("SELF FRIENDS:", vm.selfFriends);

		function statsItem(text, icon, value) { return { text: text, icon: ("ion-" + icon),	value: value };}

		vm.statsItems = [
			new statsItem('Current Funds', 'card', 'currentFunds'),
			new statsItem('Successful Missions', 'trophy', 'missionsWonNum'),
			new statsItem('Failed Missions', 'close', 'missionsfailedNum')
		];

		doResize();
		$(window).resize(doResize);

		function doResize() { return uiServices.centerHexagon("#unit-avatar", "#header"); }

		$scope.$on('$destroy', function() {$(window).off("resize", doResize);});

		vm.addAsFriend = addAsFriend;
		vm.checkIfFriend = checkIfFriend;
		vm.checkOwnProfile = checkOwnProfile;
		vm.sendMessage = sendMessage;
		vm.sendReport = sendReport;
		vm.removeAsFriend = removeAsFriend;

		vm.getString = getString;

		$rootScope.$broadcast("updatePageTitle", vm.playerInfo.aliasField + " | Operator");

		function checkIfFriend() {
			var isFriend = false;
			for (var i in vm.selfFriends) {if (vm.selfFriends[i].friendHash === vm.playerInfo.hashField) isFriend = true;}
			if (checkOwnProfile() === true) isFriend = true;
			return isFriend;
		}

		function checkOwnProfile() {return (vm.playerInfo.hashField === vm.selfInfo.hashField);}

		function addAsFriend() {return unitsServices.askAddFriend({alias: vm.playerInfo.aliasField, hash: vm.playerInfo.hashField});}
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