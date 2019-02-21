(function() {
	'use strict';

	var moduleName = "Conflicts",
		moduleNameSingle = "Conflict",
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
			"qName"
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
		var getObjectFunc = "getConflict";

		return {
			name: moduleName.toLowerCase(),
			routeName: moduleName,
			url: (moduleLowerSingle + "/:objectHash"),
			templateUrl: ('partial/' + moduleLowerSingle + '.ejs'),
			controller: ("Single" + moduleNameSingle + "Controller"),
			controllerAs: ("CtrlSingle" + moduleNameSingle),
			resolve: {
				selfInfo: ['playerServices' , function (playerServices) { return playerServices.getSelf(); }],
				objectInfo: ['generalServices', '$stateParams',
					function (generalServices, $stateParams) { return generalServices[getObjectFunc]($stateParams.objectHash); }
				],
				mapData: ['generalServices', function (generalServices) {return generalServices.getMapList();}]
			}
		};
	}

	exports.list = routeList();
	exports.single = routeSingle();

})();