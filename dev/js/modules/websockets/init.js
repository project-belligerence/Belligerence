(function() {
	'use strict';

	var moduleName = 'Websockets',
		moduleLower = moduleName.toLowerCase();

	angular.module((moduleName + 'Module'), [])
		.factory((moduleLower + 'Services'), require("./services").function)
	;
})();