(function() {
	'use strict';

	var events = {
		stateChangeStartEvent: stateChangeStartEvent,
		stateChangeSuccessEvent: stateChangeSuccessEvent
	};

	stateChangeStartEvent.$inject = ['$rootScope', "routesServices", "$state"];
	stateChangeSuccessEvent.$inject = ['$rootScope', "routesServices", "$state"];

	function stateChangeStartEvent($rootScope, routesServices, $state) {
		$rootScope.$on('$stateChangeStart', routesServices.securePrivateRoute);
		$rootScope.$on('$stateChangeStart', routesServices.secureUnloggedRoute);
		// $rootScope.$on('$stateChangeStart', routesServices.routeToDashboard); // This will re-direct logged users to the Dashboard
	}

	function stateChangeSuccessEvent($rootScope, routesServices, $state) {
		$rootScope.$on('$stateChangeSuccess', routesServices.scrollToTop);
		$rootScope.$on('$stateChangeSuccess', routesServices.updatePageTitle);
	}

	module.exports = events;
})();