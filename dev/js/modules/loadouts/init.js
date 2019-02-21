(function() {
	'use strict';

	var moduleName = 'Loadouts',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), []).factory((moduleLower + 'Services'), require("./services").function);
})();