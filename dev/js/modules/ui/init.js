(function() {
	'use strict';

	var moduleName = 'UI';

	angular.module((moduleName + 'ServicesModule'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive('radialMenu', require("./directive")().createRadialMenu)
		.directive('dropdownCheckbox', require("./directive")().dropdownCheckbox)
		.directive('destroyOnScroll', require("./directive")().destroyOnScroll)
		.directive('httpSensitive', require("./directive")().httpSensitive)
	;

	angular.module((moduleName + 'Module'), [(moduleName + 'ServicesModule')]);
})();