(function() {
	'use strict';

	var moduleName = 'Dashboard';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Dashboard",
		url: (moduleName.toLowerCase()) + "?page&?tab",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			playerInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }]
		}
	};
})();