(function() {
	'use strict';

	RoutesServicesFunction.$inject = ["$rootScope", "$state", "apiServices", "alertsServices"];

	function RoutesServicesFunction($rootScope, $state, apiServices, alertsServices) {

		var methods = {
			securePrivateRoute: securePrivateRoute,
			routeToDashboard: routeToDashboard,
			secureUnloggedRoute: secureUnloggedRoute,
			scrollToTop: scrollToTop,
			updatePageTitle: updatePageTitle
		};

		function updatePageTitle(event, toState, toParams, fromState, fromParams) {
			$rootScope.$broadcast("updatePageTitle", toState.routeName);
		}

		function securePrivateRoute(event, toState, toParams, fromState, fromParams) {
			if (((toState.name) && (toState.name.match(/^app\.private\./))) && !(apiServices.getToken())) {
				event.preventDefault();
				alertsServices.addNewAlert("warning", "You must be logged in to continue.");
				return $state.go("app.public.frontpage");
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

		function scrollToTop(event, toState, toParams, fromState, fromParams) {
			$("html, body").animate({ scrollTop: 0 }, {
				duration: 250,
				easing: 'linear'
			});
		}

		return methods;
	}

	exports.function = RoutesServicesFunction;
})();