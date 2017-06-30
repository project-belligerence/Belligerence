(function() {
	'use strict';

	PMCControllerFunction.$inject = [
		"$rootScope", "$scope","$state", "$stateParams", "$timeout",
		"apiServices", "generalServices", "uiServices", "unitsServices",
		"pmcInfo", "selfInfo", "selfFriends", "pmcUnits", "selfPMCFriends"
	];

	function PMCControllerFunction($rootScope, $scope, $state, $stateParams, $timeout, apiServices, generalServices, uiServices, unitsServices, pmcInfo, selfInfo, selfFriends, pmcUnits, selfPMCFriends) {
		var vm = this;

		vm.pmcInfo = pmcInfo[0];

		if ((pmcInfo.length === 0 || !(pmcInfo))) return $state.go("app.public.frontpage");

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.selfFriends = (selfFriends || []);
		vm.pmcUnits = pmcUnits;
		vm.selfPMCFriends = (selfPMCFriends || []);

		vm.currentTab = 1;

		vm.displayContract = apiServices.displayContract;
		vm.displayPrivilege = apiServices.displayPrivilege;

		vm.addAsFriend = addAsFriend;
		vm.checkIfFriend = checkIfFriend;
		vm.sendMessage = sendMessage;
		vm.sendReport = sendReport;
		vm.getString = getString;
		vm.setTab = setTab;
		vm.canAskFriend = canAskFriend;
		vm.canApply = canApply;
		vm.askAlly = askAlly;
		vm.askJoinPMC = askJoinPMC;

		vm.statsItems = [
			new statsItem('Current Funds', 'card', 'funds')
		];

		vm.unitsRadialOptions = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: true,
			items: []
		};

		console.log("PMC INFO:", vm.pmcInfo);
		console.log("PMC Friends:", vm.selfPMCFriends);
		console.log("SELF INFO:", vm.selfInfo);
		console.log("Friend?", checkIfFriend());
		console.log("Same PMC?", (vm.selfInfo.PMCId === vm.pmcInfo.id));
		console.log("canAskFriend()", canAskFriend());

		$rootScope.$broadcast("updatePageTitle", vm.pmcInfo.display_name + " | Outfit");

		function askAlly() {return unitsServices.askAddAlly({alias: vm.pmcInfo.display_name, hash: vm.pmcInfo.hashField});}
		function askJoinPMC() {return unitsServices.askJoinPMC({alias: vm.pmcInfo.display_name, hash: vm.pmcInfo.hashField});}

		function statsItem(text, icon, value) { return { text: text, icon: ("ion-" + icon),	value: value };}

		function doResize() { return uiServices.centerHexagon("#unit-avatar", "#header", true); }

		function canAskFriend() { return ((vm.selfInfo.playerTier <= 1) && (!(checkIfFriend)) && (vm.selfInfo.PMCId !== vm.pmcInfo.id)); }

		function canApply() {
			return ((vm.selfInfo.PMCId === undefined) && (vm.pmcInfo.open_applications === 1) && (vm.pmcInfo.size > vm.pmcInfo.totalPlayers));
		}

		function checkIfFriend() {
			var isFriend = false;
			for (var i in vm.selfPMCFriends) {if (vm.selfPMCFriends[i].friendHash === vm.pmcInfo.hashField) isFriend = true;}
			return isFriend;
		}

		function addAsFriend() {return unitsServices.askAddFriend({alias: vm.pmcInfo.aliasField, hash: vm.pmcInfo.hashField});}
		function sendMessage() {return unitsServices.askSendMessage({alias: vm.pmcInfo.aliasField, hash: vm.pmcInfo.hashField});}

		function sendReport() {return unitsServices.askReportPMC({alias: vm.pmcInfo.display_name, hash: vm.pmcInfo.hashField});}

		function getString(value) {
			var rString = "";
			switch(value) {
				case "friends": {
					rString = checkIfFriend() ? "You are already Allied with this Outfit." : "Propose an Alliance with this Outfit.";
					rString = (vm.selfInfo.playerTier <= 1) ? rString : "You lack the permission for this action.";
					rString = (vm.selfInfo.PMCId !== vm.pmcInfo.id) ? rString : "You are already part of this Outfit.";
				} break;
				case "apply": {
					rString = canAskFriend() ? "You may not apply to this Outfit." : "Apply for membership with this Outfit.";
					rString = (vm.pmcInfo.open_applications === 1) ? rString : "This Outfit is not open for applications.";
					rString = (vm.pmcInfo.size > vm.pmcInfo.totalPlayers) ? rString : "This Outfit is full at this time.";
				}
			}
			return rString;
		}

		function setTab(tab) {
			if (vm.currentTab !== tab) {
				vm.currentTab = -1;
				$timeout(function() { vm.currentTab = tab; }, 300);
			}
		}

		doResize();
		$(window).resize(doResize);
		$scope.$on('$destroy', function() {$(window).off("resize", doResize);});
		if (vm.pmcInfo === undefined) return $state.go("app.public.frontpage");
	}

	exports.function = PMCControllerFunction;
})();