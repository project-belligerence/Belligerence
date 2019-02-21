(function() {
	'use strict';

	var moduleName = "Operations",
		moduleNameSingle = "Operation",
		moduleLower = moduleName.toLowerCase(),
		moduleLowerSingle = moduleNameSingle.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.controller((moduleName + "Controller"), require("./controller").function)
	;

	function routeSingle() {
		var routeParams = [
			"view"
		].join("&?");

		return {
			name: moduleName.toLowerCase(),
			routeName: moduleName,
			url: (moduleLower) + "?" + routeParams,
			templateUrl: ('partial/' + moduleLower + '.ejs'),
			controller: (moduleName + "Controller"),
			controllerAs: ("Ctrl" + moduleName),
			resolve: {
				selfInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }]
			}
		};
	}
	exports.single = routeSingle();

})();