(function() {
	'use strict';

	CheersDirectiveFunctions.$inject = ["$scope", "$log", "$timeout", "apiServices", "cheersServices"];

	function CheersDirectiveFunctions($scope, $log, $timeout, apiServices, cheersServices) {
		var vm = this;

		$scope.cheersAmount = $scope.initialCheers;
		$scope.isCheered = apiServices.boolString($scope.initialCheered);

		$scope.doCheer = doCheer;
		$scope.isLoading = false;

		if ($scope.showText === undefined) $scope.showText = true;

		$scope.doButtonSize = ($scope.buttonSize || "small");

		function doCheer() {
			$scope.isLoading = true;
			cheersServices.cheerContent($scope.cheerTarget, $scope.cheerType).then(function(data) {
				$timeout(function() {
					if (data) {
						if (data.data) {
							$scope.cheersAmount = data.data.currentCount;
							$scope.isCheered = true;
						} else {
							$scope.cheersAmount--;
							$scope.isCheered = false;
						}
					}
					$scope.isLoading = false;
				}, 400);
			});
		}
	}

	function CheersDirectiveFunction() {
		return {
			scope: {
				initialCheers: "@",
				initialCheered: "@",
				cheerTarget: "@",
				cheerType: "@",
				buttonSize: "@",
				showText: "@"
			},
			restrict : "E",
			templateUrl: 'directive/cheers.ejs',
			controller: CheersDirectiveFunctions
		};
	}

	exports.function = CheersDirectiveFunction;
})();