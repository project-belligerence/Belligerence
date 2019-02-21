(function() {
	'use strict';

	var moduleName = 'Units',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), require("./directive").function)
		.controller((moduleName.toLowerCase() + 'OperatorsController'), require("./controller_operators").function)
		.controller((moduleName.toLowerCase() + 'OutfitsController'), require("./controller_outfit").function)
	;

	function routeOperatorSetup() {
		return {
			name: "Operator" + moduleName.toLowerCase(),
			url: moduleLower + "/operators?page&order&sort&alias&description&location&contract&prestigeMin&prestigeMax&unemployedOnly&tags&email&status",
			routeName: "Operators",
			templateUrl: ('partial/units_operators.ejs'),
			controller: (moduleName.toLowerCase() + 'OperatorsController'),
			controllerAs: ('Ctrl' + moduleName + "Operators"),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}],
				selfFriends: ['playerServices', function (playerServices) {return playerServices.getFriendsSelf();}]
			}
		};
	}

	function routeOutfitSetup() {
		return {
			name: "Outfit" + moduleName.toLowerCase(),
			url: moduleLower + "/outfits?page&order&sort&name&location&tags&open&players&prestigeMin&prestigeMax",
			routeName: "Outfit",
			templateUrl: ('partial/units_outfits.ejs'),
			controller: (moduleName.toLowerCase() + 'OutfitsController'),
			controllerAs: ('Ctrl' + moduleName + "Outfits"),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
			}
		};
	}

	exports.routeOperators = routeOperatorSetup();
	exports.routeOutfits = routeOutfitSetup();
})();