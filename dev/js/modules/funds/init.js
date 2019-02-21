(function() {
	'use strict';

	var moduleName = 'Funds',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.controller((moduleLower + 'Controller'), require("./controller").function)
		.factory((moduleLower + 'Services'), require("./services").function)
		.directive((moduleLower + 'Directive'), require("./directive").function)
	;

	exports.route = {
		name: moduleLower,
		routeName: moduleName,
		templateUrl: ('partial/' + moduleLower + '.ejs'),
		controller: (moduleLower + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {}
	};
})();