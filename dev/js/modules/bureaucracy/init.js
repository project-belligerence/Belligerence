(function() {
	'use strict';

	var moduleName = 'Bureaucracy',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.controller((moduleLower + 'OperatorController'), require("./operator_controller").function)
		.controller((moduleLower + 'OutfitController'), require("./outfit_controller").function)
	;

	function routeOperatorSetup() {
		return {
			name: "Operator " + moduleName.toLowerCase(),
			url: "bureaucracy/operator",
			routeName: "Bureaucracy | Operator",
			templateUrl: ('partial/bureaucracy_operator.ejs'),
			controller: (moduleName.toLowerCase() + 'OperatorController'),
			controllerAs: ('Ctrl' + moduleName + "Operator"),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
			}
		};
	}

	function routeOutfitSetup() {
		return {
			name: "Outfit " + moduleName.toLowerCase(),
			url: "bureaucracy/outfit",
			routeName: "Bureaucracy | Outfit",
			templateUrl: ('partial/bureaucracy_outfit.ejs'),
			controller: (moduleName.toLowerCase() + 'OutfitController'),
			controllerAs: ('Ctrl' + moduleName + "Outfit"),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}],
				selfFriends: ['playerServices', function (playerServices) {return playerServices.getFriendsSelf();}]
			}
		};
	}

	exports.routeOperator = routeOperatorSetup();
	exports.routeOutfit = routeOutfitSetup();
})();