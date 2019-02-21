(function() {
	'use strict';

	IntelDirectiveFunctions.$inject = ["$scope", "$timeout", "alertsServices", "apiServices", "intelServices", "playerServices", "websocketsServices"];

	function IntelDirectiveFunctions($scope, $timeout, alertsServices,apiServices, intelServices, playerServices, websocketsServices) {
		var vm = this;

		$scope.currentData = [];
		$scope.filterInputsTitle = '';
		$scope.filterInputsBody = '';

		$scope.currentPage = 1;
		$scope.$timeout = $timeout;
		$scope.previousPage = $scope.currentPage;
		$scope.playerInfo = [];

		$scope.perPage = 4;
		$scope.totalItems = 1;

		$scope.showBar = false;
		$scope.isLoading = true;
		$scope.displayFilters = false;

		$scope.askDeleteIntel =  askDeleteIntel;
		$scope.getPermissions = intelServices.getPermissions;
		$scope.refreshIntel = refreshIntel;
		$scope.movePage = movePage;
		$scope.toggleFilter = toggleFilter;
		$scope.changeFilterOrder = changeFilterOrder;
		$scope.changeSortType = changeSortType;
		$scope.changeVisibilityType = changeVisibilityType;
		$scope.changeSortMethod = changeSortMethod;
		$scope.changePostedAsMethod = changePostedAsMethod;
		$scope.setURL = setURL;
		$scope.genBackgroundPicture = intelServices.genBackgroundPicture;
		$scope.genIconColors = intelServices.genIconColors;

		$scope.isMaxPage = false;
		$scope.isMinPage = false;

		$scope.autoRefresh = true;

		initializeWebsockets();
		function initializeWebsockets() {
			var webSockets = {
				RefreshIntel: { onMessage: function() { if ($scope.autoRefresh) refreshIntel(); } }
			};
			websocketsServices.initCtrlWS($scope, webSockets);
		}

		setupFilters();

		$(".intel-container").addClass("anim-left");

		playerServices.getSelf().then(function(data) {
			$scope.playerInfo = (data || apiServices.returnUnloggedUser());

			$timeout(function(){refreshIntel();},250);
		});

		function maxPage() { return Math.min(Math.ceil($scope.totalItems / $scope.perPage), $scope.currentPage + 1); }
		function minPage() { return (Math.max($scope.currentPage - 1, 1)); }

		function askDeleteIntel(hash) {
			intelServices.askDeleteIntel(hash).then(function(data) {
				if (apiServices.statusError(data)) return false;

				if (data) {
					alertsServices.addNewAlert("success", "The Intel was removed.");
					refreshIntel();
				}
			});
		}

		function setupFilters() {
			var i, j;
			$scope.currentOrder = "DESC";
			$scope.typesDropdown = [];
			$scope.visibilityDropdown = [];
			$scope.postedAsDropdown = [];

			var intelTypes = intelServices.getIntelTypes();
			var visibilityTypes = intelServices.getIntelVisibility();
			var postedAsTypes = intelServices.getIntelPostedAs();

			for (i in intelTypes) { $scope.typesDropdown.push(intelServices.getTypeDetails(intelTypes[i])); }
			for (i in visibilityTypes) { $scope.visibilityDropdown.push(intelServices.getVisibilityDetails(visibilityTypes[i])); }
			for (i in postedAsTypes) { $scope.postedAsDropdown.push(intelServices.getPostedAsDetails(postedAsTypes[i])); }

			$scope.intelTypes = intelTypes;
			$scope.visibilityTypes = visibilityTypes;

			$scope.sortingMethods = {
				createdAt: { name: "Date",	value: "createdAt", icon: "ion-ios-calendar-outline" },
				totalCheers: { name: "Popular", value: "totalCheers", icon: "ion-star" },
				totalComments: { name: "Discussed", value: "totalComments", icon: "ion-chatbubble-working" }
			};

			changeSortType(0);
			changeVisibilityType(0);
			changeSortMethod("createdAt");
			changePostedAsMethod(0);
		}

		function changeFilterOrder() { $scope.currentOrder = (($scope.currentOrder === "ASC") ? "DESC" : "ASC"); }
		function changeSortType(index) { $scope.currentType = $scope.typesDropdown[index]; }
		function changeVisibilityType(index) { $scope.currentVisibility = $scope.visibilityDropdown[index]; }
		function changeSortMethod(value) { $scope.currentRank = $scope.sortingMethods[value]; }
		function changePostedAsMethod(value) { $scope.currentPostedAs = $scope.postedAsDropdown[value]; }

		function refreshIntel() {
			var intelQuery = {
				page: $scope.currentPage,
				order: $scope.currentOrder,
				sort: $scope.currentRank.value,

				qType: $scope.currentType.value,
				qVisibility: $scope.currentVisibility.value,
				qDisplay: $scope.currentPostedAs.value,

				qBody: $scope.filterInputsBody,
				qTitle: $scope.filterInputsTitle
			};

			$scope.currentData = [];
			$scope.isLoading = true;

			intelServices.getIntel(intelQuery).then(function(data) {
				if (data) {
					var timeWait = 0;
					if ($scope.currentData.length > 0) { $scope.currentData = []; timeWait = 250; }

					$timeout(function() {
						$scope.totalItems = data.count;
						$scope.currentData = data.data;

						$scope.isMinPage = (($scope.currentPage === Math.ceil($scope.totalItems / $scope.perPage)) || ($scope.totalItems === 0));
						$scope.isMaxPage = (($scope.currentPage === 1) || ($scope.totalItems === 0));

						$scope.previousPage = $scope.currentPage;

						$timeout(function() { $scope.$broadcast('rebuild');	}, 0);

						if ($scope.totalItems > 0) $timeout(function(){ intelServices.alignIntel(); }, 500);
					}, 450);
				}
				$timeout(function(){$scope.isLoading = false;}, 500);
			});
		}

		function movePage(d) {
			if ($scope.totalItems > 0) {

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
				$('html, body').animate({ scrollTop: ($('#intel-col').offset().top - 70) }, 'fast');

				if (curPage != $scope.currentPage) refreshIntel();
			}
		}

		function toggleFilter() {
			var currentFilter = $scope.displayFilters;
			$scope.displayFilters = undefined;
			setupFilters();
			$timeout(function() { $scope.displayFilters = !currentFilter;}, 50);
		}

		function setURL(hash) { return ((hash === "???") ? "intel" : "intel/view/" + hash); }
	}

	function IntelDirectiveLink(scope, elem, attrs) {

		scope.$timeout(function(){
			var
				intelElement = ($(elem[0])),
				intelPagination = $("#intel-pagination"),

				scrollHandler = function() {
					if ($(window).innerWidth() <= 991) {
						var currentScroll = ($(this).scrollTop()),
							elementPosition = (intelElement.offset().top),
							directiveHeight = $("#intel-col").height(),
							windowHeight = $(window).innerHeight(),
							startPadding = 100,
							endPadding = (windowHeight - 190),
							scrollingThrough = (((currentScroll - elementPosition) >= 0) && ((currentScroll - elementPosition) <= (directiveHeight - endPadding)));

						if (scrollingThrough) { intelPagination.addClass("fixed"); } else { intelPagination.removeClass("fixed"); }
					} else { intelPagination.removeClass("fixed"); }
				}
			;
			$(window).scroll(scrollHandler);
			scope.$on('$destroy', function() { $(window).off("scroll", scrollHandler); });
		}, 1000);
	}

	function IntelDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/intel.ejs',
			controller: IntelDirectiveFunctions,
			link: IntelDirectiveLink
		};
	}

	exports.function = IntelDirectiveFunction;
})();