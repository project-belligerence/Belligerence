(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices) {
		var vm = this;

		$scope.myVariable = true;
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {
			},
			restrict : "EA",
			templateUrl: "",
			controller: ObjectDirectiveFunctions
		};
	}

	exports.function = ObjectDirectiveFunction;
})();