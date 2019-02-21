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
		}

		function initalizeFunctions() {
			vm.displayDirective = displayDirective;
			vm.doMasonry = doMasonry;

			function displayDirective() { return (vm.displayObjects); }

			function doMasonry() {
				$timeout(function() {
					uiServices.uiMasonry(".objectives-directive", {
						itemSelector: ".objective-col", columnWidth: ".objective-col", percentPosition: false
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
			templateUrl: "directive/" + "objectives" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Objectives"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();