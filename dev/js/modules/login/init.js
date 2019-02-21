(function() {
	'use strict';

	var moduleName = 'Login';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.controller(('BannedController'), require("./controller_banned").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), require("./directive").function)
	;

	exports.route = {
		url: "/",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName)
	};

	exports.banned = {
		url: "banned",
		templateUrl: ('partial/banned.ejs'),
		controller: "BannedController",
		controllerAs: "CtrlBanned"
	};
})();