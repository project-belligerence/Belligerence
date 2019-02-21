(function() {
	'use strict';

	CheersDirectiveFunctions.$inject = ["$scope", "$log", "$timeout", "apiServices", "cheersServices"];

	function CheersDirectiveFunctions($scope, $log, $timeout, apiServices, cheersServices) {
		var vm = this;

		vm.cheersAmount = $scope.initialCheers;
		vm.isCheered = apiServices.boolString($scope.initialCheered);

		vm.doCheer = doCheer;
		vm.isLoading = false;

		vm.showText = angular.isUndefinedOrNull($scope.showText) ? true : apiServices.boolString($scope.showText);

		vm.doButtonSize = ($scope.buttonSize || "small");

		function doCheer() {
			vm.isLoading = true;
			cheersServices.cheerContent($scope.cheerTarget, $scope.cheerType).then(function(data) {
				$timeout(function() {
					if (data) {
						if (data.data) {
							vm.cheersAmount = data.data.currentCount;
							vm.isCheered = true;
						} else {
							vm.cheersAmount--;
							vm.isCheered = false;
						}
					}
					vm.isLoading = false;
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
			controller: CheersDirectiveFunctions,
			controllerAs: "CheersController"
		};
	}

	exports.function = CheersDirectiveFunction;
})();