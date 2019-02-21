(function() {
	'use strict';

	UnitsDirectiveFunctions.$inject = ["$scope", "$rootScope", "$timeout", "$uibModal", "$document", "apiServices", "unitsServices", "alertsServices"];

	function UnitsDirectiveFunctions($scope, $rootScope, $timeout, $uibModal, $document, apiServices, unitsServices, alertsServices) {
		var vm = this, i;

		vm.displayMode = ($scope.displayMode || "ranked");

		$scope.radialOptions = apiServices.cloneValue(($scope.interactionOptions || {isOpen: false, toggleOnClick: true, enableDefaults: true, items:[]}));

		vm.applyControlledClass = apiServices.applyControlledClass;

		if ($scope.radialOptions.enableDefaults) {

			switch (vm.displayMode) {
				case "pmc-friends": {
					$scope.radialOptions.items.push(
						{content: 'Profile', icon: 'ion-document-text', tooltip: 'Opens the Outfit profile.',
						 route: unitsServices.getPMCProfile }
					);
				} break;
				case "interest": {
					if (apiServices.getToken()) {
						$scope.radialOptions.items.push({
							content: 'Message', icon: 'ion-email', tooltip: 'Sends the Operator a message.',
						 	condition: checkMessage, function: unitsServices.askSendMessage
						});
					}
					$scope.radialOptions.items.push({
						content: 'Profile', icon: 'ion-document-text', tooltip: 'Opens the Operator profile.',
						 route: unitsServices.getPlayerProfile
					});
				} break;
				default: {
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
				} break;
			}
		}

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
			$scope.organizedTiers = [[0],[1],[2],[3],[4],[5]];
			for (i in units) { $scope.organizedTiers[((units[i].playerTier === undefined) ? 5 : units[i].playerTier)].push(units[i]); }
		}

		function reloadUnits(event, units) {
			$scope.unitsList = [];
			$timeout(function() { $scope.unitsList = units;	}, 250);
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
				displayMode: "@",
				styleClass: "@"
			},
			restrict : "E",
			templateUrl: 'directive/units.ejs',
			controller: UnitsDirectiveFunctions,
			controllerAs: "CtrlUnits"
		};
	}

	exports.function = UnitsDirectiveFunction;
})();