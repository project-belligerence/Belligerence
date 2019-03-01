(function() {
	'use strict';

	RoutesServicesFunction.$inject = ["$rootScope", "$state", "$timeout", "$cookies", "apiServices", "playerServices", "alertsServices"];

	function RoutesServicesFunction($rootScope, $state, $timeout, $cookies, apiServices, playerServices, alertsServices) {

		var methods = {
			directToBannedRoute: directToBannedRoute,
			securePrivateRoute: securePrivateRoute,
			secureAdminRoute: secureAdminRoute,
			routeToDashboard: routeToDashboard,
			secureUnloggedRoute: secureUnloggedRoute,
			scrollToTop: scrollToTop,
			updatePageTitle: updatePageTitle,
			transitionRoute: transitionRoute,
			endTransitionRoute: endTransitionRoute,
			setAnonymousSessionToken: setAnonymousSessionToken
		};

		function updatePageTitle(event, toState, toParams, fromState, fromParams) {
			$rootScope.$broadcast("updatePageTitle", toState.routeName);
		}

		function failRoute() { $rootScope.routeError = 5; }
		function cleanRoute() { $rootScope.routeError = null; }

		function directToBannedRoute(event, toState, toParams, fromState, fromParams) {
			if ($rootScope.routeError === 10) {
				event.preventDefault();
				if ((toState.name) && (toState.url !== "banned")) if (fromState.name === "") $state.go("app.public.banned");
				return true;
			}
		}

		function securePrivateRoute(event, toState, toParams, fromState, fromParams) {
			var prevFromState = fromState;
			if (((toState.name) && (toState.name.match(/^app\.private\./))) && !(apiServices.getToken())) {
				failRoute();
				event.preventDefault();
				alertsServices.addNewAlert("warning", "You must be logged in to continue.");
				if (prevFromState.name === "") $state.go("app.public.frontpage");
				return true;
			}
		}

		function secureAdminRoute(event, toState, toParams, fromState, fromParams) {
			var prevFromState = fromState,
				cancelRoute = function() {
					event.preventDefault();
					alertsServices.addNewAlert("warning", "Insufficient permissions to view this page.");
					if (prevFromState.name === "") $state.go("app.public.frontpage");
					return true;
				};

			if ((toState.name && (toState.name.match(/^app\.admin\./)))) {
				playerServices.getSelf(true).then(function(data) {
					if (data && (apiServices.getToken())) {
						if (data.playerPrivilege > 3) { return cancelRoute(); }
					} else { return cancelRoute(); }
				});
			}
		}

		function secureUnloggedRoute(event, toState, toParams, fromState, fromParams) {
			if (((toState.name) && (toState.name === "app.public.signup")) && (apiServices.getToken())) {
				event.preventDefault();
				alertsServices.addNewAlert("warning", "Please terminate your current session if you wish to register a new account.");
				return $state.go("app.private.dashboard");
			}
		}

		function routeToDashboard(event, toState, toParams, fromState, fromParams) {
			if ((toState.name === "app.public.frontpage") && (apiServices.getToken())) {
				event.preventDefault();
				return $state.go('app.private.dashboard');
			}
		}

		function transitionRoute(event, toState, toParams, fromState, fromParams) {
			$timeout(function() {
				var currentRoute = $state.current.name;

				if ((currentRoute === fromState.name) && (toState.name !== fromState.name) && (!$rootScope.routeError)) {
					$("#page-top").addClass("darken");
					$("#loading-bar .bar").addClass("broaden");
				}
			}, 1000);
		}

		function endTransitionRoute(event, toState, toParams, fromState, fromParams) {
			$("#page-top").removeClass("darken");
			$("#loading-bar .bar").removeClass("broaden");
			cleanRoute();
		}

		function scrollToTop(event, toState, toParams, fromState, fromParams) {
			$("html, body").animate({ scrollTop: 0 }, {
				duration: 250,
				easing: 'linear'
			});
		}

		function setAnonymousSessionToken() {
			if (!$cookies.get("anonymousSessionToken")) {
				var uniqId = _.uniqueId(_.now());
				$cookies.put("anonymousSessionToken", uniqId);
			}
		}

		return methods;
	}

	exports.function = RoutesServicesFunction;
})();