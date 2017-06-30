(function() {
	'use strict';

	var moduleName = 'Routes';

	angular.module((moduleName + 'ServicesModule'), []).factory((moduleName.toLowerCase() + 'Services'), require("./services").function);

	angular.module((moduleName + 'Module'), [(moduleName + 'ServicesModule')]);
})();