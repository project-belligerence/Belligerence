(function() {
	'use strict';

	OutfitControllerFunction.$inject = ["$state", "$scope", "$timeout", "apiServices", "pmcServices", "selfInfo", "selfFriends", "bureaucracyServices"];

	function OutfitControllerFunction($state, $scope, $timeout, apiServices, pmcServices, selfInfo, selfFriends, bureaucracyServices) {
		var vm = this;

		vm.selfInfo = selfInfo;
		vm.selfFriends = selfFriends;
		vm.unitsInfo = [];

		if (vm.selfInfo.PMC === null) $state.go('app.private.dashboard');

		pmcServices.getSelfPMC().then(function(pmc) {
			vm.selfPMC = pmc[0];

			pmcServices.getSelfPMCPlayers().then(function(units) {
				vm.unitsInfo = _.reject(units, function(o) { return (o.hashField === vm.selfInfo.hashField); });

				vm.menuOptions = [
					new vm.menuItem({
						title: "Leave Outfit", icon: "android-exit",
						description: "Exit your current Outfit.",
						state: "leave-outfit",
						enable: (vm.selfInfo.PMC),
						fn: leaveOutfit
					}),
					new vm.menuItem({
						title: "Transfer Outfit Leadership", icon: "person-stalker",
						description: "Gives control of your Outfit to another Soldier.",
						requirement: "Requires you to be its Commander.",
						state: "transfer-leadership",
						enable: ((vm.selfInfo.PMC) && (vm.selfInfo.contractType === 0) && (vm.selfInfo.playerTier === 0) && (vm.unitsInfo.length > 0))
					})
				];

				vm.pageState = "main";
			});
		});

		vm.pageState = "none";
		vm.currentSelectedClass = -1;

		vm.changeState = changeState;
		vm.selectClass = selectClassChange;

		vm.displayContract = apiServices.displayContract;
		vm.numberToArray = apiServices.numberToArray;

		vm.menuItem = bureaucracyServices.menuItem;

		vm.unitsRadialOptions = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: false,
			items: [
				{content: 'Make leader', icon: 'ion-person-add', tooltip: 'Selects this Operator to become the new Commander.',
				 function: transferOutfitLeadership }
			]
		};

		function changeState(state) {
			vm.pageState = "null";
			$timeout(250).then(function(){ vm.pageState = state; });
		}

		function selectClassChange(index) { vm.currentSelectedClass = index; }

		function leaveOutfit() {
			bureaucracyServices.askLeaveOutfit().then(function(choice) {
				if (choice) return bureaucracyServices.playerLeaveOutfit();
			});
		}

		function transferOutfitLeadership(args) {
			bureaucracyServices.askTransferLeadership().then(function(choice) {
				if (choice) bureaucracyServices.transferOutfitLeadership(args.hash);
			});
		}
	}

	exports.function = OutfitControllerFunction;
})();