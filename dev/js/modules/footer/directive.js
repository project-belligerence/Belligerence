(function() {
	'use strict';

	FooterDirectiveFunctions.$inject = ["$rootScope", "$scope", "$state", "$q", "$timeout", "apiServices", "generalServices", "playerServices", "loginServices"];

	function FooterDirectiveFunctions($rootScope, $scope, $state, $q, $timeout, apiServices, generalServices, playerServices, loginServices) {
		var vm = this;

		initializeDirective();

		// ===================================================
		// ===================================================

		function initializeDirective() {
			initializeVariables();
			initializeFunctions();
			vm.intializeEvents();

			vm.refreshDataNav();
		}

		function initializeVariables() {
			vm.playerInfo = [];
			vm.uiData = {};
			vm.isLogged = false;
			vm.displayBar = true;

			vm.hiddenRoutes = [];
		}

		function initializeFunctions() {
			vm.intializeEvents = intializeEvents;
			vm.refreshDataNav = refreshDataNav;
			vm.getUIRoute = getUIRoute;

			function initializeData() {
				return playerServices.getSelf().then(function(data) {
					if (data) {
						vm.isLogged = true;
						vm.playerInfo = data;
					} else {
						vm.playerInfo = [];
						vm.isLogged = false;
						return false;
					}
				});
			}

			function intializeEvents() {
				$rootScope.$on("footer:refreshBar", initializeUI);
				$rootScope.$on("footer:changeBarState", function(e, state) {
					if (state && cannotDisplayFooter()) {
						vm.displayBar = false;
						return true;
					}
					vm.displayBar = state;
				});
			}

			function initializeUI() {
				vm.uiData.menus = initializeUIMenus();
				$timeout(function() {
					if (!cannotDisplayFooter()) vm.displayBar = true;
				}, 2500);
			}

			function cannotDisplayFooter() { return (apiServices.inArray($state.current.name, vm.hiddenRoutes)); }

			function getUIRoute(item) {	return (item.route + "(" + JSON.stringify(item.params) + ")"); }

			function refreshDataNav() { vm.displayBar = true;
				$timeout(1).then(function() { initializeData().then(initializeUI); });
			}

			function initializeUIMenus() {
				var interactiveMenus = [
					[
						{ name: "Intel", menu:
							[
								{ name: "View", route: "app.public.intel", icon: "ion-speakerphone" },
								{ name: "New", route: "app.private.intel-compose", class: "color-green", icon: "ion-plus", }
							]},
						{ name: "Units", menu:
							[
								{ name: "Operators", route: "app.public.view-operators", icon: "ion-person" },
								{ name: "Outfits", route: "app.public.view-outfits", icon: "ion-ios-people" }
							]},
					],
					[
						{ name: "Economy", menu:
							[
								{ name: "Exchange", route: "app.public.market", icon: "ion-card" },
								{ name: "Items", route: "app.public.items", icon: "ion-cube" }
							]},
						{ name: "Upgrades", route: "app.public.upgrades" },
						{ name: "Missions", route: "app.public.missions" }
					]
				],
				contentMenus = [
					[
						{
							name: "Content", menu: [
								{ name: "Factions", route: "app.public.factions", icon: "ion-flag" },
								{ name: "Objectives", route: "app.public.objectives", icon: "ion-pinpoint" },
								{ name: "Conflicts", route: "app.public.conflicts", icon: "ion-fireball" },
								{ name: "Maps", route: "app.public.maps", icon: "ion-map" }
							]
						}
					]
				];

				if (vm.isLogged) { }

				return { interactive: interactiveMenus, content: contentMenus };
			}
		}
	}

	function FooterDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/footer.ejs',
			controller: FooterDirectiveFunctions,
			controllerAs: "FooterController"
		};
	}

	exports.function = FooterDirectiveFunction;
})();