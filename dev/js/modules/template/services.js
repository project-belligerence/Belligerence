(function() {
	'use strict';

	TemplateServicesFunction.$inject = [];

	function TemplateServicesFunction() {

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