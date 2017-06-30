(function() {
	'use strict';

	IntelDirectiveFunctions.$inject = ["$scope", "$timeout", "intelServices"];

	function IntelDirectiveFunctions($scope, $timeout, intelServices) {
		var vm = this;

		$scope.currentData = [];

		$scope.currentPage = 1;
		$scope.previousPage = $scope.currentPage;

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

			$scope.currentData = [];

			intelServices.getIntel(intelQuery).then(function(data) {
				if (data) {
					var timeWait = 0;
					if ($scope.currentData.length > 0) { $scope.currentData = []; timeWait = 250; }

					$timeout(function() {
						$scope.totalItems = data.count;
						$scope.currentData = data.data;

						$scope.isMinPage = ($scope.currentPage === Math.ceil($scope.totalItems / $scope.perPage));
						$scope.isMaxPage = ($scope.currentPage === 1);

						$scope.previousPage = $scope.currentPage;

						$timeout(function() { $scope.$broadcast('rebuild');	}, 0);
					}, 250);

				}
			});
		}

		function movePage(d) {
			var curPage = $scope.currentPage,
				intelContainer = $(".intel-container");

			switch (d) {
				case "n": {
					intelContainer.removeClass("anim-right");
					intelContainer.addClass("anim-left");
					$scope.currentPage = maxPage();
				} break;
				case "p": {
					intelContainer.removeClass("anim-left");
					intelContainer.addClass("anim-right");
					$scope.currentPage = minPage();
				} break;
				case -1: {
					if ($scope.previousPage > $scope.currentPage) {
						intelContainer.removeClass("anim-left");
						intelContainer.addClass("anim-right");
					} else {
						intelContainer.removeClass("anim-right");
						intelContainer.addClass("anim-left");
					}
					refreshIntel();
				}
			}

			if (curPage != $scope.currentPage) refreshIntel();
		}

		refreshIntel();
	}

	function IntelDirectiveLink(scope, elem, attrs) {

		var
			intelElement = ($(elem[0])),
			intelPagination = $("#intel-pagination"),
			scrollHandler = function() {
				var
					windowWidth = $(window).innerWidth(),
					windowPos = ($(this).scrollTop()),
					intelTopOffset = (intelElement.offset().top),
					intelHeight = document.getElementsByClassName('intel-container')[0].scrollHeight,

					endPadding = ((windowPos <= 360) ? 250 : 600)
				;

				intelHeight = ((intelHeight > 2000) ? 2500 : 1400);

				if (windowWidth <= 800) {
					if ( (windowPos >= (intelTopOffset - 200)) && (windowPos <= (intelTopOffset + (intelHeight - endPadding)))  ) {
						intelPagination.addClass("fixed");
					} else {
						intelPagination.removeClass("fixed");
					}
				}
			}
		;

		$(window).scroll(scrollHandler);
		scope.$on('$destroy', function() { $(window).off("scroll", scrollHandler); });
	}

	function IntelDirectiveFunction($timeout) {
		return {
			scope: {

			},
			restrict : "E",
			templateUrl: 'directive/intel.ejs',
			controller: IntelDirectiveFunctions,
			link: IntelDirectiveLink
		};
	}

	exports.function = IntelDirectiveFunction;
})();