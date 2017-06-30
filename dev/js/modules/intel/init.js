(function() {
	'use strict';

	var moduleName = 'Intel';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), ["$timeout", require("./directive").function])
	;

	exports.route = {
		url: "/",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName)
	};
})();