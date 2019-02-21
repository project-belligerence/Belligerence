(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices) {
		var vm = this;

		initializeDirective(function(success) {
			// if (success) console.log("vm.upgradeInfo", vm.upgradeInfo);
		});

		function initializeDirective(cb) {
			initalizeFunctions();
			return initializeVariables(cb);
		}

		function initializeVariables(callback) {
			vm.upgradeInfo = vm.getOwnedUpgrade();
			vm.upgradeClass = ($scope.mode || "default");

			return callback((!angular.isUndefinedOrNull(vm.upgradeInfo)));
		}

		function initalizeFunctions() {
			vm.getOwnedUpgrade = getOwnedUpgrade;
			vm.getUpgradeIcon = getUpgradeIcon;

			function getOwnedUpgrade() {
				var unit = $scope.unit;
				if (!(unit.owned_upgrades)) return false;
				return ((unit.owned_upgrades.length > 0) ? mergeObject(unit.owned_upgrades[0]) : false);
			}

			function mergeObject(obj) {
				var rObj = obj, rObjOwned = obj.owned_upgrade;
				delete rObj.owned_upgrade;
				return _.merge(rObj, rObjOwned);
			}

			function getUpgradeIcon() {
				var icon = vm.upgradeInfo.iconName,
					highRes = (vm.upgradeClass.split('-')[0] === "outfit"),
					iconSize = (highRes ? "main" : "thumb");
				return { "background-image": "url('/images/modules/upgrades/" + iconSize + "_" + icon + ".png')" };
			}
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: { unit: "=", mode: "@" },
			restrict : "E",
			templateUrl: "directive/" + "upgrades" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirectiveUpgrades"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();