(function() {
	'use strict';

	function getModule(module) { return ("./modules/" + module + "/init"); }

	angular.module('appUIRoutes', []).config(AppUIMainRoutes);

	AppUIMainRoutes.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

	function AppUIMainRoutes($stateProvider, $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode({ enabled: true, requireBase: true });

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
					.state('app.public.banned', require(getModule('login')).banned)
					.state('app.public.signup', require(getModule('signup')).route)
					.state('app.public.player', require(getModule('player')).route)
					.state('app.public.pmc', require(getModule('pmc')).route)
					.state('app.public.intel', require(getModule('intel')).route)
					.state('app.public.intel-single', require(getModule('intel')).routeSingle)
					.state('app.public.view-operators', require(getModule('units')).routeOperators)
					.state('app.public.view-outfits', require(getModule('units')).routeOutfits)
					.state('app.public.market', require(getModule('market')).route)
					.state('app.public.buy', require(getModule('market')).buy)
					.state('app.public.store', require(getModule('market')).stores)
					.state('app.public.items', require(getModule('items')).list)
					.state('app.public.item-single', require(getModule('items')).single)
					.state('app.public.maps', require(getModule('maps')).list)
					.state('app.public.map-single', require(getModule('maps')).single)
					.state('app.public.factions', require(getModule('factions')).list)
					.state('app.public.faction-single', require(getModule('factions')).single)
					.state('app.public.objectives', require(getModule('objectives')).list)
					.state('app.public.objective-single', require(getModule('objectives')).single)
					.state('app.public.conflicts', require(getModule('conflicts')).list)
					.state('app.public.conflict-single', require(getModule('conflicts')).single)
					.state('app.public.missions', require(getModule('missions')).list)
					.state('app.public.mission-single', require(getModule('missions')).single)
					.state('app.public.upgrades', require(getModule('upgrades')).route)
					.state('app.public.upgrade-single', require(getModule('upgrades')).single)
					.state('app.public.tos', require(getModule('legal')).legal)

				.state('app.private', new routeObject())
					.state('app.private.dashboard', require(getModule('dashboard')).route)
					.state('app.private.messages', require(getModule('messages')).route)
					.state('app.private.operations', require(getModule('operations')).single)
					.state('app.private.intel-compose', require(getModule('intel')).routeCompose)
					.state('app.private.intel-edit', require(getModule('intel')).routeEdit)
					.state('app.private.bureaucracy-operator', require(getModule('bureaucracy')).routeOperator)
					.state('app.private.bureaucracy-outfit', require(getModule('bureaucracy')).routeOutfit)
					.state('app.private.new-outfit', require(getModule('signup')).createOutfit)
					.state('app.private.checkout', require(getModule('market')).checkout)

				.state('app.admin', new routeObject())
					.state('app.admin.menu', require(getModule('admin')).route)
		;
	}
})();