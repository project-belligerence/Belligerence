(function() {
	'use strict';

	function getModule(module) { return ("./modules/" + module + "/init"); }

	angular.module('appUIRoutes', []).config(AppUIMainRoutes);

	AppUIMainRoutes.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

	function AppUIMainRoutes($stateProvider, $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode({ enabled: true, requireBase: true });

		// $urlRouterProvider.rule(function($injector, $location) {
		// 	var path = $location.path(),
		// 		noTrailingSlash = (path[path.length-1] !== '/');

		// 		console.log($location, path, noTrailingSlash);

		// 	if (noTrailingSlash) { return path + "/"; }
		// });

		var routeObject = function(defaultR, url) {
			var rObject = { abstract: true,	template: "<ui-view/>" };

			if (defaultR) rObject.default = defaultR;
			if (url) rObject.url = url;

			return rObject;
		};

		$urlRouterProvider.otherwise('/');
		$stateProvider
			.state('app', new routeObject('.public', '/'))
				.state('app.public', new routeObject('frontpage'))
					.state('app.public.frontpage', require(getModule('frontpage')).route)
					.state('app.public.signup', require(getModule('signup')).route)
					.state('app.public.player', require(getModule('player')).route)
					.state('app.public.pmc', require(getModule('pmc')).route)

				.state('app.private', new routeObject())
					.state('app.private.dashboard', require(getModule('dashboard')).route)
		;
	}
})();