(function() {
	'use strict';

	var moduleName = 'Intel';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.controller((moduleName.toLowerCase() + 'ComposeController'), require("./controller_compose").function)
		.controller((moduleName.toLowerCase() + 'EditController'), require("./controller_edit").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), require("./directive").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: moduleName,
		url: (moduleName.toLowerCase()),
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			playerInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }]
		}
	};

	exports.routeSingle = {
		name: moduleName.toLowerCase(),
		routeName: moduleName,
		url: (moduleName.toLowerCase() + "/view/:intelHash?comments"),
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			playerInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }]
		}
	};

	exports.routeCompose = {
		name: moduleName.toLowerCase() + "Compose",
		routeName: "Compose Intel",
		url: (moduleName.toLowerCase() + "/compose"),
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + "_compose" + '.ejs'),
		controller: (moduleName.toLowerCase() + 'ComposeController'),
		controllerAs: ('Ctrl' + moduleName + "Compose"),
		resolve: {
			playerInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }]
		}
	};

	exports.routeEdit = {
		name: moduleName.toLowerCase() + "Edit",
		routeName: "Edit Intel",
		url: (moduleName.toLowerCase() + "/edit/:intelHash"),
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + "_edit" + '.ejs'),
		controller: (moduleName.toLowerCase() + 'EditController'),
		controllerAs: ('Ctrl' + moduleName + "Edit"),
		resolve: {
			playerInfo: ['playerServices' , function(playerServices) { return playerServices.getSelf(); }],
			intelInfo: ['intelServices', '$stateParams',
				function(intelServices, $stateParams) { return intelServices.getIntel({hashField: $stateParams.intelHash}); }
			]
		}
	};
})();