(function() {
	'use strict';

	var moduleName = 'Cheers';

	angular.module((moduleName + 'Module'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), require("./directive").function)
	;

	exports.route = {
		url: "/",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName)
	};
})();