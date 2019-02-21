(function() {
	'use strict';

	var moduleName = 'PMC';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		routeName: "Outfit page",
		url: "outfit/:pmcHash",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			pmcInfo: ['generalServices', '$stateParams',
				function (generalServices, $stateParams) {
					var qObj = { qIncludeUpgrades: true, qVisible: true };
					return generalServices.getPMC($stateParams.pmcHash, qObj);
				}],
			pmcUnits: ['generalServices', '$stateParams',
				function (generalServices, $stateParams) { return generalServices.getPMCPlayers($stateParams.pmcHash); }],
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}],
			selfFriends: ['playerServices', function (playerServices) {return playerServices.getFriendsSelf();}]
		}
	};
})();