(function() {
	'use strict';

	var moduleName = 'Template',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.controller((moduleLower + 'Controller'), require("./controller").function)
		.factory((moduleLower + 'Services'), require("./services").function)
		.directive((moduleLower + 'Directive'), require("./directive").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Template Page",
		url: "",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};
})();