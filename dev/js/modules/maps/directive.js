(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices) {
		var vm = this;
		vm.displayObjects = false;

		initializeDirective(function() { vm.displayObjects = true; });

		function initializeDirective(cb) {
			initalizeFunctions();
			initializeVariables();

			vm.getClimates(function() {	return cb(true); });
		}

		function initializeVariables() {
			vm.objectList = ($scope.objectList || []);
		}

		function initalizeFunctions() {
			vm.getClimates = getClimates;
			vm.displayDirective = displayDirective;
			vm.limitDescription = limitDescription;
			vm.classSingleMap = classSingleMap;

			function classSingleMap() { return { single: (vm.objectList.length === 1) }; }

			function displayDirective() { return (vm.displayObjects); }

			function getClimates(cb) {
				generalServices.getClimates().then(function(climateTypes) {
					vm.climateTypes = climateTypes;
					return cb(true);
				});
			}

			function limitDescription(description) { return apiServices.limitString(description, 100, "[...]"); }
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: { objectList: "=" },
			restrict : "E",
			templateUrl: "directive/" + "maps" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Maps"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();