(function() {
	'use strict';

	var moduleName = 'Items',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.directive((moduleLower + 'Directive'), require("./directive").function)
		.controller((moduleLower + 'Controller'), require("./controller").function)
		.controller(("SingleItemController"), require("./single-controller").function)
	;

	function routeList() {
		return {
			name: moduleName.toLowerCase(),
			routeName: "Item list",
			url: "items?page&?order&?sort&?qName&?qClassname&?qContent?&qDescription&?qYearMin&?qYearMax&?qType&?qClass&?qValueMin&?qValueMax&?qDeployable&?qDetail1&?qDetail2&?qDetail3&?qDetail4&?qDetail5",
			templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
			controller: (moduleName.toLowerCase() + 'Controller'),
			controllerAs: ('Ctrl' + moduleName),
			resolve: {}
		};
	}

	function routeSingle() {
		return {
			name: moduleName.toLowerCase(),
			routeName: "Item View",
			url: "item/:itemHash",
			templateUrl: ('partial/item.ejs'),
			controller: ("SingleItemController"),
			controllerAs: ("CtrlSingleItem"),
			resolve: {
				selfInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }],
				itemInfo: ['generalServices', '$stateParams',
					function (generalServices, $stateParams) {return generalServices.getItem($stateParams.itemHash);}
				]
			}
		};
	}

	exports.list = routeList();
	exports.single = routeSingle();

})();