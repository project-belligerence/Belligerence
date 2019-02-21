(function() {
	'use strict';

	UpgradesControllerFunction.$inject = [
		"$scope", "$state", "$stateParams", "$timeout", "apiServices", "generalServices", "selfInfo", "upgradesOwned", "upgradesData", "upgradeInfo", "upgradesServices", "alertsServices", "uiServices", "fundsServices"
	];

	function UpgradesControllerFunction($scope, $state, $stateParams, $timeout, apiServices, generalServices, selfInfo, upgradesOwned, upgradesData, upgradeInfo, upgradesServices, alertsServices, uiServices, fundsServices) {
		var vm = this;

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.upgradeInfo = upgradeInfo;
		vm.upgradesData = upgradesData.upgradesData;

		vm.upgradesOwned = upgradesServices.resetOwnedUpgradesProperties(upgradesOwned);

		vm.matchOwnedUpgrade = matchOwnedUpgrade;
		vm.askPurchaseUpgrade = askPurchaseUpgrade;
		vm.numberToArray = apiServices.numberToArray;

		vm.allowPurchase = false;
		vm.hasRelatedUpgrades = ((vm.upgradeInfo.blacklistedUpgrades.length > 0) || (vm.upgradeInfo.requiredUpgrades.length > 0));

		vm.matchedUpgrade = matchOwnedUpgrade(vm.upgradeInfo.hashField);
		vm.validUpgradeType = upgradesServices.validUpgradeType(vm.selfInfo, upgradeInfo);

		vm.finalUpgradePrice = getUpgradeCost();
		vm.updateWindowTitle = updateWindowTitle;

		var ownedUpgradesStatus = getSingleUpgradeStatus(upgradesServices.validateUpgrades(vm.upgradeInfo, vm.upgradesOwned));

		vm.updateWindowTitle();

		fundsServices.getCurrentFunds().then(function(funds) {
			vm.currentFunds = funds;

			vm.allowPurchase = (
				(vm.matchedUpgrade.rankField < vm.upgradeInfo.maxTier) &&
				(vm.currentFunds >= vm.finalUpgradePrice) &&
				(vm.validUpgradeType) &&
				(ownedUpgradesStatus.valid)
			);
		});

		function getUpgradeCost() {	return ((vm.upgradeInfo.baseCost * (vm.matchedUpgrade.rankField + 1)) * vm.upgradeInfo.costMultiplier); }

		function askPurchaseUpgrade() {
			upgradesServices.confirmBuyUpgrade(vm.upgradeInfo, vm.finalUpgradePrice).then(function(data) {
				if (data.success) {
					fundsServices.showChangedFunds(data.data.neededFunds, "subtract");
					$state.reload();
				}
			});
		}

		function getSingleUpgradeStatus(upgradeStatus) {
			var paramUpgradeStatus = (angular.isUndefinedOrNull(upgradeStatus) ? 0 : upgradeStatus.status);

			return {
				valid: ((paramUpgradeStatus === 0) || (paramUpgradeStatus === 3)),
				text: ((paramUpgradeStatus === 1) ? "Missing Upgrades" : ((paramUpgradeStatus === 2) ? "Conflicting Upgrades" : "Related Upgrades")),
				button: {
					'no-upgrades': (paramUpgradeStatus === 0),
					'warning': (paramUpgradeStatus === 1),
					'black': (paramUpgradeStatus === 2),
					'success': (paramUpgradeStatus === 3),
					'flashing': (paramUpgradeStatus < 3)
				}
			};
		}

		function matchOwnedUpgrade(hash) {
			for (var i in vm.upgradesOwned)
				if (vm.upgradesOwned[i].hashField === hash) return vm.upgradesOwned[i].owned_upgrades;
			return {rankField: 0};
		}

		function updateWindowTitle() { uiServices.updateWindowTitle([vm.upgradeInfo.nameField, "Upgrade"]); }
    }

	exports.function = UpgradesControllerFunction;
})();