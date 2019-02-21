(function() {
	'use strict';

	TemplateServicesFunction.$inject = ["$timeout", "apiServices"];

	function TemplateServicesFunction($timeout, apiServices) {

		var methods = {
			TemplateFunction: TemplateFunction
		};

		function TemplateFunction() {
			return true;
		}

		return methods;
	}

	exports.function = TemplateServicesFunction;
})();