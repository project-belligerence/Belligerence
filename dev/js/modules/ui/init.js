(function() {
	'use strict';

	var moduleName = 'UI';

	angular.module((moduleName + 'ServicesModule'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive('radialMenu', require("./directive")().createRadialMenu)
	;

	angular.module((moduleName + 'Module'), [(moduleName + 'ServicesModule')]);
})();