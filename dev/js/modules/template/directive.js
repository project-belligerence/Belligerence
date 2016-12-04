(function() {
	'use strict';

	TemplateDirectiveFunctions.$inject = ["$scope"];

	function TemplateDirectiveFunctions($scope) {
		var vm = this;

		$scope.myVariable = true;
	}

	function TemplateDirectiveFunction() {
		return {
			scope: {
			},
			restrict : "EA",
			templateUrl: "",
			controller: TemplateDirectiveFunctions
		};
	}

	exports.function = TemplateDirectiveFunction;
})();