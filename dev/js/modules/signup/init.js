(function() {
	'use strict';

	var moduleName = 'Signup';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.controller((moduleName.toLowerCase() + 'NewOutfitController'), require("./new-outfit_controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Sign up",
		url: (moduleName.toLowerCase()) + "?step&key",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {}
	};

	function routeCreateOutfit() {
		return {
			name: "New Outfit",
			url: "new-outfit",
			routeName: "New Outfit",
			templateUrl: ('partial/new_outfit.ejs'),
			controller: (moduleName.toLowerCase() + 'NewOutfitController'),
			controllerAs: ('Ctrl' + moduleName + "NewOutfit"),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
			}
		};
	}

	exports.createOutfit = routeCreateOutfit();
})();