(function() {
	'use strict';

	function getModule(module) { return ("./modules/" + module + "/init"); }

	angular.module('appUIRoutes', []).config(AppUIMainRoutes);

	AppUIMainRoutes.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

	function AppUIMainRoutes($stateProvider, $locationProvider, $urlRouterProvider) {

		$locationProvider.html5Mode({ enabled: true, requireBase: true });

		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				noTrailingSlash = (path[path.length-1] !== '/');

			if (noTrailingSlash) { return path + "/"; }
		});

		$stateProvider
			.state('frontpage', require(getModule('frontpage')).route)
		;
	}
})();