(function() {
	'use strict';

	var moduleName = 'Signup';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Sign up",
		url: (moduleName.toLowerCase()),
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {}
	};
})();