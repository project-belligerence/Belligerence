(function() {
	'use strict';

	var moduleName = 'API';

	angular.module((moduleName + 'ServicesModule'), [])
		.factory((moduleName.toLowerCase() + 'Services'), require("./services").function)
		.directive('ngHtml', require("./directive")().ngHTMLFunction)
		.directive('ngPlaceholder', require("./directive")().placeholderImgFunction)
		.directive('acBackgroundImage', require("./directive")().acBackgroundImageFunction)
		.directive('aDisabled', require("./directive")().aDisabled)
		.directive('lastRepeat', require("./directive")().LastRepeatFunction)
		.filter("kebabCase", require("./filters")().kebabCase)
		.config(require("./configs")().httpInterceptor)
	;

	angular.module((moduleName + 'Module'), [(moduleName + 'ServicesModule')]);
})();