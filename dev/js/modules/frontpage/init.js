(function() {
	'use strict';

	var moduleName = 'Frontpage';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
	;

	exports.route = {
		url: "",
		routeName: "Frontpage",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName)
	};
})();