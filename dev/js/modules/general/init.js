(function() {
	'use strict';

	var moduleName = 'General';

	angular.module((moduleName + 'Module'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
	;
})();