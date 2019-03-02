(function() {
	'use strict';

	var moduleName = 'Legal';

	angular.module((moduleName + 'Module'), [])
		.controller(("LegalController"), require("./controller").function)
		.directive(('cookiesDirective'), require("./cookies-directive").function)
	;

	exports.legal = {
		name: moduleName.toLowerCase(),
		routeName: "Legal",
		url: "legal",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: "LegalController",
		controllerAs: ('Ctrl' + moduleName)
	};

	exports.app_rules = {
		name: moduleName.toLowerCase(),
		routeName: "Rules",
		url: "rules",
		templateUrl: ('partial/rules.ejs'),
		controller: "LegalController",
		controllerAs: ('Ctrl' + moduleName)
	};

	exports.about = {
		name: moduleName.toLowerCase(),
		routeName: "About & Acknowledgements",
		url: "about",
		templateUrl: ('partial/about.ejs'),
		controller: "LegalController",
		controllerAs: ('Ctrl' + moduleName)
	};

})();