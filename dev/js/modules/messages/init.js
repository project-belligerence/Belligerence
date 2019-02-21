(function() {
	'use strict';

	var moduleName = 'Messages';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Messages",
		url: (moduleName.toLowerCase()) + "?view&latest",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};
})();