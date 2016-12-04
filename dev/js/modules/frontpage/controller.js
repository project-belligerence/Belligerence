(function() {
	'use strict';

	FrontPageControllerFunction.$inject = ["$scope", "$timeout"];

	function FrontPageControllerFunction($scope, $timeout) {
		var vm = this;

		$scope.displayLogin = false;
		$scope.displayLogin2 = false;

		$timeout(function() { $scope.displayLogin = true; }, 250);
		$timeout(function() { $scope.displayLogin2 = true; }, 550);
	}

	exports.function = FrontPageControllerFunction;
})();