(function() {
	'use strict';

	TemplateDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices"];

	function TemplateDirectiveFunctions($scope, $timeout, apiServices) {
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