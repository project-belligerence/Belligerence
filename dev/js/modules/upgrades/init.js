(function() {
	'use strict';

	var moduleName = 'Upgrades',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.directive((moduleLower + 'Directive'), require("./directive").function)
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.controller(("SingleUpgradeController"), require("./single-controller").function)
	;

	function routeTree() {
		return {
			name: moduleName.toLowerCase(),
			routeName: "Upgrades Tree",
			url: "upgrades?tree&?upgrade",
			templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
			controller: (moduleName.toLowerCase() + 'Controller'),
			controllerAs: ('Ctrl' + moduleName),
			resolve: {
				selfInfo: ['playerServices', function (playerServices) { return playerServices.getSelf(); }],
				upgradesOwned: ['upgradesServices', function(upgradesServices) { return upgradesServices.getUpgradesSelf(); }],
				upgradesList: ['upgradesServices', function(upgradesServices) { return upgradesServices.getUpgradeTree(); }],
				upgradesData: ['upgradesServices', function(upgradesServices) { return upgradesServices.getUpgradesData(); }],
			}
		};
	}

	function routeSingle() {
		return {
			name: moduleName.toLowerCase(),
			routeName: "Upgrade View",
			url: "upgrade/:upgradeHash",
			templateUrl: ('partial/upgrade.ejs'),
			controller: ("SingleUpgradeController"),
			controllerAs: ("CtrlSingleUpgrade"),
			resolve: {
				selfInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }],
				upgradesOwned: ['upgradesServices', function(upgradesServices) { return upgradesServices.getUpgradesSelf();}],
				upgradesData: ['upgradesServices', function(upgradesServices) { return upgradesServices.getUpgradesData();}],
				upgradeInfo: ['upgradesServices', '$stateParams',
					function (upgradesServices, $stateParams) {return upgradesServices.getUpgrade($stateParams.upgradeHash);}
				]
			}
		};
	}

	exports.route = routeTree();
	exports.single = routeSingle();

})();