(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices", "uiServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices, uiServices) {
		var vm = this;
		vm.displayObjects = false;

		initializeDirective(function() {
			vm.displayObjects = true;
		});

		function initializeDirective(cb) {
			initalizeFunctions();
			initializeVariables();

			vm.doMasonry();

			return cb(true);
		}

		function initializeVariables() {
			vm.objectList = ($scope.objectList || []);

			vm.modifiersList = [
				{ name: "Tech Rating", field: "techField", icon: "ion-monitor" },
				{ name: "Training", field: "trainingField", icon: "ion-university" },
				{ name: "Munificence", field: "munificenceField", icon: "ion-social-usd" },
				{ name: "Organization", field: "organizationField", icon: "ion-android-sync" },
				{ name: "ISR", field: "isrField", icon: "ion-camera" }
			];
		}

		function initalizeFunctions() {
			vm.displayDirective = displayDirective;
			vm.getTierClass = getTierClass;
			vm.doMasonry = doMasonry;

			vm.applyControlledClass = apiServices.applyControlledClass;

			function displayDirective() { return (vm.displayObjects); }

			function getTierClass(v) {
				var rV = "average";
				switch(true) {
					case (v <= 2): { rV = "awful"; } break;
					case (v > 2 && v <= 4): { rV = "poor"; } break;
					case (v > 4 && v <= 6): { rV = "average"; } break;
					case (v > 6 && v <= 8): { rV = "great"; } break;
					case (v >= 9): { rV = "extraordinary"; } break;
				}
				return rV;
			}

			function doMasonry() {
				$timeout(function() {
					uiServices.uiMasonry(".factions-directive", {
						itemSelector: ".faction-col", columnWidth: ".faction-col", percentPosition: false
					});
				}, 500);
			}
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {
				objectList: "=",
			},
			restrict : "E",
			templateUrl: "directive/" + "factions" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Factions"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();