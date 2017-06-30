(function() {
	'use strict';

	UnitsDirectiveFunctions.$inject = ["$scope", "$rootScope", "$timeout", "$uibModal", "$document", "apiServices", "unitsServices", "alertsServices"];

	function UnitsDirectiveFunctions($scope, $rootScope, $timeout, $uibModal, $document, apiServices, unitsServices, alertsServices) {
		var vm = this, i;

		vm.displayMode = ($scope.displayMode || "ranked");

		$scope.radialOptions = apiServices.cloneValue(($scope.interactionOptions || {isOpen: false, toggleOnClick: true, enableDefaults: true, items:[]}));

		if ($scope.radialOptions.enableDefaults) {
			if (apiServices.getToken()) {
				$scope.radialOptions.items.push(
					{content: 'Message', icon: 'ion-email', tooltip: 'Sends the Operator a message.',
					 condition: checkMessage, function: unitsServices.askSendMessage },

					{content: 'Profile', icon: 'ion-document-text', tooltip: 'Opens the Operator profile.',
					 route: unitsServices.getPlayerProfile }
				);

				if (vm.displayMode !== "friends") {
					$scope.radialOptions.items.push(
						{content: 'Befriend', icon: 'ion-person-add', tooltip: 'Add the Operator to your friends list.',
						 condition: checkFriend, function: unitsServices.askAddFriend }
					);
				}
			} else {
				$scope.radialOptions.items.push(
					{content: 'Profile', icon: 'ion-document-text', tooltip: 'Opens the Operator profile.',
					 route: unitsServices.getPlayerProfile }
				);
			}

			if (vm.displayMode === "pmc-friends") {
				$scope.radialOptions.items = [];

				$scope.radialOptions.items.push(
					{content: 'Profile', icon: 'ion-document-text', tooltip: 'Opens the Outfit profile.',
					 route: unitsServices.getPMCProfile }
				);
			}
		}

		console.log(vm.displayMode);

		$timeout(function() { unitsServices.centerUnits(); }, 0);

		switch (vm.displayMode) {
			case "ranked": {
				$rootScope.$on('unitsDirectiveReloadUnits', initializeTiers);
				initializeTiers(null, $scope.unitsList);
			} break;
			default: {
				$rootScope.$on('unitsDirectiveReloadUnits', reloadUnits);
			} break;
		}

		function initializeTiers(event, units) {
			$scope.organizedTiers = [[0],[1],[2],[3],[4]];
			for (i in units) { $scope.organizedTiers[units[i].playertier].push(units[i]); }
			$timeout(function() { unitsServices.centerUnits(); }, 0);
		}

		function reloadUnits(event, units) {
			$scope.unitsList = [];
			$timeout(function() {
				$scope.unitsList = units;
				$timeout(function() { unitsServices.centerUnits(); }, 0);
			}, 250);
		}

		function checkFriend(a) { return unitsServices.checkFriend(a, $scope.playerInfo, $scope.friendsList); }
		function checkMessage(a) { return unitsServices.checkMessage(a, $scope.playerInfo); }
	}

	function UnitsDirectiveFunction() {
		return {
			scope: {
				interactionOptions: "=",
				unitsList: "=",
				pmcInfo: "=",
				playerInfo: "=",
				friendsList: "=",
				displayMode: "@"
			},
			restrict : "E",
			templateUrl: 'directive/units.ejs',
			controller: UnitsDirectiveFunctions,
			controllerAs: "CtrlUnits"
		};
	}

	exports.function = UnitsDirectiveFunction;
})();