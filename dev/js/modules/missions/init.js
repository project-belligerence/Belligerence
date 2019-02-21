(function() {
	'use strict';

	var moduleName = "Missions",
		moduleNameSingle = "Mission",
		moduleLower = moduleName.toLowerCase(),
		moduleLowerSingle = moduleNameSingle.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
		.directive((moduleLower + 'Directive'), require("./directive").function)
		.controller((moduleLower + 'Controller'), require("./controller").function)
		.controller(("Single" + moduleNameSingle + "Controller"), require("./single-controller").function)
	;

	function routeList() {
		var routeParams = [
			"qName",
			"qFactionASide",
			"qFactionBSide",
			"qLocationTypes",
			"qMap",
			"qObjective",
			"qConflict",
			"qFactionA",
			"qFactionB",
			"qRewardMin", "qRewardMax"
		].join("&?");

		return {
			name: moduleName.toLowerCase(),
			routeName: (moduleName + " list"),
			url: (moduleLower + "?page&?order&?sort&?" + routeParams),
			templateUrl: ('partial/' + moduleLower + '.ejs'),
			controller: (moduleLower + 'Controller'),
			controllerAs: ('Ctrl' + moduleName),
			resolve: {}
		};
	}

	function routeSingle() {
		var getObjectFunc = "getMission";

		return {
			name: moduleName.toLowerCase(),
			routeName: moduleName,
			url: (moduleLowerSingle + "/:objectHash?tab"),
			templateUrl: ('partial/' + moduleLowerSingle + '.ejs'),
			controller: ("Single" + moduleNameSingle + "Controller"),
			controllerAs: ("CtrlSingle" + moduleNameSingle),
			resolve: {
				selfInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }],
				selfFriends: ['playerServices', function (playerServices) {return playerServices.getFriendsSelf();}],
				selfUpgrades: ['upgradesServices', function (upgradesServices) { return upgradesServices.getUpgradesSelf(); }],
				objectInfo: ['generalServices', '$stateParams',
					function (generalServices, $stateParams) { return generalServices[getObjectFunc]($stateParams.objectHash); }
				]
			}
		};
	}

	exports.list = routeList();
	exports.single = routeSingle();

})();