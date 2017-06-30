(function() {
	'use strict';

	var moduleName = 'Comments';

	angular.module((moduleName + 'Module'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive((moduleName.toLowerCase() + 'Directive'), require("./directive").function)
	;
})();