(function() {
	'use strict';

	var moduleName = 'Admin',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.controller((moduleLower + 'Controller'), require("./controller").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Admin Menu",
		url: "admin?menu&?section&?editHash",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};
})();