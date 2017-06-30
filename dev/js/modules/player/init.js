(function() {
	'use strict';

	var moduleName = 'Player';

	angular.module((moduleName + 'Module'), [])
		.controller((moduleName.toLowerCase() + 'Controller'), require("./controller").function)
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;

	exports.route = {
		name: moduleName.toLowerCase(),
		url: "operator/:playerHash",
		routeName: "Operator page",
		templateUrl: ('partial/' + (moduleName.toLowerCase()) + '.ejs'),
		controller: (moduleName.toLowerCase() + 'Controller'),
		controllerAs: ('Ctrl' + moduleName),
		resolve: {
			playerInfo: ['generalServices', '$stateParams',
				function (generalServices, $stateParams) {return generalServices.getPlayer($stateParams.playerHash);}
			],
			selfInfo: ['playerServices', function (playerServices) {return playerServices.getSelf();}],
			selfFriends: ['playerServices', function (playerServices) {return playerServices.getFriendsSelf();}]
		}
	};
})();