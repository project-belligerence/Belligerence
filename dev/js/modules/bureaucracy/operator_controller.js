(function() {
	'use strict';

	OutfitControllerFunction.$inject = ["$state", "$scope", "$timeout", "apiServices", "selfInfo", "bureaucracyServices"];

	function OutfitControllerFunction($state, $scope, $timeout, apiServices, selfInfo, bureaucracyServices) {
		var vm = this;

		vm.selfInfo = selfInfo;

		vm.pageState = "main";
		vm.currentSelectedClass = -1;

		vm.changeState = changeState;
		vm.selectClass = selectClassChange;
		vm.confirmClassChange = confirmClassChange;

		vm.displayContract = apiServices.displayContract;
		vm.numberToArray = apiServices.numberToArray;

		vm.menuItem = bureaucracyServices.menuItem;

		vm.menuOptions = [
			new vm.menuItem(
				{
					title: "Switch class", icon: "arrow-swap",
					description: "Changes your current contract type at the cost of resetting your account. Requires you not to be part of an Outfit.",
					state: "class-change",
					enable: (!vm.selfInfo.PMC),
					route: "app.private.bureaucracy-operator"
				}
			),
			new vm.menuItem(
				{
					title: "New Outfit", icon: "ios-people",
					description: "Start a new Outfit as its Commander. Requires you not to be part of an Outfit.",
					state: "class-change",
					enable: ((vm.selfInfo.contractType <= 1) && !(vm.selfInfo.PMC)),
					route: "app.private.new-outfit"
				}
			)
		];

		function changeState(state) {
			vm.pageState = "null";
			$timeout(250).then(function(){vm.pageState = state;});
		}

		function confirmClassChange() {
			bureaucracyServices.askClassChange().then(function(choice) {
				if (choice) {
					switch (vm.currentSelectedClass) {
						case 2: { return bureaucracyServices.playerGoSoldierSelf();	} break;
						case 3: { return bureaucracyServices.playerGoFreelancerSelf(); } break;
					}
				}
			});
		}

		function selectClassChange(index) { vm.currentSelectedClass = index; }
	}

	exports.function = OutfitControllerFunction;
})();