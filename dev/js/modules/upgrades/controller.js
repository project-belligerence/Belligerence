(function() {
	'use strict';

	UpgradesControllerFunction.$inject = [
		"$rootScope", "$scope", "$state", "$stateParams", "$q", "$timeout", "apiServices", "generalServices", "selfInfo", "upgradesOwned", "upgradesList", "upgradesData", "upgradesServices", "uiServices", "fundsServices", "websocketsServices"
	];

	function UpgradesControllerFunction($rootScope, $scope, $state, $stateParams, $q, $timeout, apiServices, generalServices, selfInfo, upgradesOwned, upgradesList, upgradesData, upgradesServices, uiServices, fundsServices, websocketsServices) {
		var vm = this, i, j, cUpgrade, upgradesRenderElement = $("#upgrades-render");
		vm.upgradesOwned = (upgradesOwned || []);
		vm.upgradesData = upgradesData.upgradesData;
		vm.mainParentUpgrades = [];
		vm.currentTreeUpgrade = {};
		vm.singleUpgrade = {};
		vm.matchedUpgrade = {};
		vm.renderScreen = false;
		vm.showSingle = false;
		vm.haltTransition = false;

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		vm.renderTreeView = renderTreeView;
		vm.matchOwnedUpgrade = matchOwnedUpgrade;
		vm.numberToArray = apiServices.numberToArray;
		vm.askPurchaseUpgrade = askPurchaseUpgrade;
		vm.openUpgradeView = openUpgradeView;
		vm.askRespecTree = askRespecTree;
		vm.moveZoomScreen = upgradesServices.moveZoomScreen;
		vm.closeUpgradeView = closeUpgradeView;

		if (upgradesList) {
			if (upgradesList.data.success) { vm.upgradesList = _.reverse(upgradesList.data.data); }
			for (i in vm.upgradesList) { if (vm.upgradesList[i].parentUpgrade === "") vm.mainParentUpgrades.push(vm.upgradesList[i]); }
		}

		vm.upgradesOwned = upgradesServices.resetOwnedUpgradesProperties(vm.upgradesOwned);

		fundsServices.getCurrentFunds().then(function(funds) {
			vm.currentFunds = funds;

			renderTreeView(($stateParams.tree || vm.mainParentUpgrades[0].hashField));
			upgradesServices.styleUpgradeScreen().start();
		});

		vm.currentTreeHash = ($stateParams.tree || vm.mainParentUpgrades[0].hashField);

		// if ($stateParams.upgrade) openUpgradeView({hashField: $stateParams.upgrade});

		$scope.$on("$destroy", upgradesServices.styleUpgradeScreen().end);
		$scope.$on("$destroy", uiServices.bindScrollToElement("upgrades-main-page", "upgrades-zoom-area", upgradesServices.upgradeScrnRndrZoom));

		// =======================================================================
		// =======================================================================

		initializeWebsockets();

		function initializeWebsockets() {
			websocketsServices.initCtrlWS($scope, {
				NewUpgrade: {
					onMessage: resetTree,
					filter: function() {
						var entity = apiServices.getMainEntity(vm.selfInfo);
						return websocketsServices.joinFilter(["NewUpgrade", entity.type, entity.hash]);
					}
				}
			});
		}

		function getUpgradeCost(upgrade, matched) {	return ((upgrade.baseCost * (matched.rankField + 1)) * upgrade.costMultiplier); }

		function resetTree() {
			return $q(function(resolve, reject) {
				upgradesServices.getUpgradesSelf().then(function(ownedUpgrades) {
					fundsServices.getCurrentFunds().then(function(currentFunds) {

						vm.upgradesOwned = (ownedUpgrades || []);
						vm.currentFunds = currentFunds;

						vm.upgradesOwned = upgradesServices.resetOwnedUpgradesProperties(vm.upgradesOwned);

						renderTreeView(vm.currentTreeHash, false, true, true);

						return resolve(true);
					});
				});
			});
		}

		function renderTreeView(hash, reset, uiReset, forceChange) {
			if ((vm.currentTreeUpgrade.hashField !== hash) || (forceChange)) {
				if (!uiReset) vm.renderScreen = false;

				closeUpgradeView();

				$timeout(500).then(function() {
					var cUpgrade = vm.mainParentUpgrades[0];
					for (var i in vm.upgradesList) { if (vm.upgradesList[i].hashField === hash) cUpgrade = vm.upgradesList[i]; }

					vm.currentTreeUpgrade = cUpgrade;
					vm.currentTreeHash = hash;

					$("#upgrades-render").empty();

					vm.upgradesOwned = upgradesServices.resetOwnedUpgradesProperties(vm.upgradesOwned);

					var upgradeIcon = upgradesServices.createNewUpgradeIcon(vm.upgradesOwned, 0, 0, upgradesRenderElement, cUpgrade);
					$(upgradeIcon).bind('click', function() { openUpgradeView(cUpgrade); });

					getUpgradeChildren(cUpgrade.hashField, true);

					if (!uiReset) upgradesServices.initDraggingOnScreen(reset);

					$timeout(100).then(function() { vm.renderScreen = true; });
				});

				return cUpgrade;
			}
		}

		function closeUpgradeView() {
			vm.showSingle = false;
			vm.singleUpgrade = {};
			fundsServices.setFundsClass(vm.showSingle);
		}

		function refreshUpgradeView(upgrade) {
			closeUpgradeView();
			resetTree().then(function() { openUpgradeView(upgrade); });
		}

		function openUpgradeView(upgrade, reopen) {
			if ((upgrade.hashField !== vm.singleUpgrade.hashField) && (!reopen) && (!vm.haltTransition)) {

				closeUpgradeView();

				upgradesServices.getUpgrade(upgrade.hashField).then(function(fUpgrade) {

					vm.singleUpgrade = fUpgrade;

					vm.validUpgradeType = upgradesServices.validUpgradeType(vm.selfInfo, fUpgrade);

					fUpgrade.hasRelatedUpgrades = ((fUpgrade.blacklistedUpgrades.length > 0) || (fUpgrade.requiredUpgrades.length > 0));
					vm.matchedUpgrade = matchOwnedUpgrade(fUpgrade.hashField);
					vm.finalUpgradePrice = getUpgradeCost(fUpgrade, vm.matchedUpgrade);

					var ownedUpgradesStatus = getSingleUpgradeStatus(upgradesServices.validateUpgrades(fUpgrade, vm.upgradesOwned));

					fUpgrade.allowPurchase = (
						(vm.matchedUpgrade.rankField < fUpgrade.maxTier) &&
						(vm.currentFunds >= vm.finalUpgradePrice) &&
						(vm.validUpgradeType) && (ownedUpgradesStatus.valid)
					);

					// updateURL('upgrade', fUpgrade.hashField);

					vm.showSingle = true;
					$timeout(1).then(function(){ upgradesServices.centerOnUpgrade(fUpgrade); });

					fundsServices.setFundsClass(vm.showSingle);
				});
			}
		}

		function getUpgradeChildren(hash, mainParent) {
			var i, nChildIndex = 0, totalChildren = 0;
			for (i in vm.upgradesList) if (vm.upgradesList[i].parentUpgrade === hash) totalChildren++;

			vm.upgradesList.forEach(function(e, i) {
				var cUpgrade = e;
				if (cUpgrade.parentUpgrade === hash) {

					var upgradeIcon = upgradesServices.createNewUpgradeIcon(vm.upgradesOwned, totalChildren, nChildIndex, upgradesRenderElement, cUpgrade, mainParent);
					$(upgradeIcon).bind('click', function() { openUpgradeView(cUpgrade); });

					nChildIndex++;
					getUpgradeChildren(cUpgrade.hashField, false);
				}
			});
		}

		function matchOwnedUpgrade(hash) {
			for (var i in vm.upgradesOwned)
				if (vm.upgradesOwned[i].hashField === hash) return vm.upgradesOwned[i].owned_upgrades;

			return {rankField: 0};
		}

		function askPurchaseUpgrade() {
			var openUpgrade = vm.singleUpgrade;

			upgradesServices.confirmBuyUpgrade(vm.singleUpgrade, vm.finalUpgradePrice).then(function(data) {
				if (data.success) {
					fundsServices.showChangedFunds(data.data.neededFunds, "subtract");
					refreshUpgradeView(openUpgrade);
				}
			});
		}

		function askRespecTree() {
			var openUpgrade = vm.singleUpgrade;

			upgradesServices.confirmRespecTree(vm.singleUpgrade).then(function(result) {
				if (result.success) {
					fundsServices.showChangedFunds(result.data);
					refreshUpgradeView(openUpgrade);
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

		function updateURL(property, value) {
			var newState = {};
			newState[property] = value;

			$stateParams = newState;
			$state.params = newState;
			$state.go($state.$current.self.name, newState, {notify: false});
		}

    }

	exports.function = UpgradesControllerFunction;
})();