(function() {
	'use strict';

	IntelDirectiveFunctions.$inject = ["$scope", "$timeout", "intelServices"];

	function IntelDirectiveFunctions($scope, $timeout, intelServices) {
		var vm = this;

		$scope.currentData = [];

		$scope.currentPage = 1;
		$scope.perPage = 4;
		$scope.totalItems = 1;

		$scope.showBar = false;

		$scope.refreshIntel = refreshIntel;
		$scope.movePage = movePage;

		function maxPage() { return Math.min(Math.ceil($scope.totalItems / $scope.perPage), $scope.currentPage + 1); }
		function minPage() { return Math.max($scope.currentPage - 1, 1); }

		$scope.isMaxPage = false;
		$scope.isMinPage = false;

		function refreshIntel() {
			var intelQuery = {
				page: $scope.currentPage
			};

			intelServices.getIntel(intelQuery).then(function(data) {
				if (data) {
					var timeWait = 0;
					if ($scope.currentData.length > 0) { $scope.currentData = []; timeWait = 250; }

					$timeout(function() {
						$scope.totalItems = data.count;
						$scope.currentData = data.data;

						$scope.isMinPage = ($scope.currentPage === Math.ceil($scope.totalItems / $scope.perPage));
						$scope.isMaxPage = ($scope.currentPage === 1);

						$timeout(function() { $scope.$broadcast('rebuild');	}, 0);
					}, timeWait);

				}
			});
		}

		function movePage(d) {
			var curPage = $scope.currentPage;
			switch (d) {
				case "n": {	$scope.currentPage = maxPage();	} break;
				case "p": {	$scope.currentPage = minPage(); } break;
			}

			if (curPage != $scope.currentPage) refreshIntel();
		}

		refreshIntel();
	}

	function IntelDirectiveFunction() {
		return {
			scope: {

			},
			restrict : "E",
			templateUrl: 'directive/intel.ejs',
			controller: IntelDirectiveFunctions
		};
	}

	exports.function = IntelDirectiveFunction;
})();