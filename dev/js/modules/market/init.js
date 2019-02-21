(function() {
	'use strict';

	var moduleName = 'Market',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.controller((moduleLower + 'Controller'), require("./controller").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "The Exchange",
		url: "market",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};

	exports.buy = {
		name: moduleName.toLowerCase(),
		routeName: "The Exchange | Buy",
		url: "market/buy?qName&?qPrestigeMin&?qPrestigeMax&?qTypes&?itemFilter",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};

	exports.stores = {
		name: moduleName.toLowerCase(),
		routeName: "Stores",
		url: "market/store/:storeHash",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};

	exports.checkout = {
		name: moduleName.toLowerCase(),
		routeName: "Checkout",
		url: "market/checkout",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}]
		}
	};

})();