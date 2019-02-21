(function() {
	'use strict';

	var moduleName = 'UI';

	angular.module((moduleName + 'ServicesModule'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive('radialMenu', require("./directive")().createRadialMenu)
		.directive('dropdownCheckbox', require("./directive")().dropdownCheckbox)
	;

	angular.module((moduleName + 'Module'), [(moduleName + 'ServicesModule')]);
})();