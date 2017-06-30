(function() {
	'use strict';

	NavServicesFunction.$inject = [];

	function NavServicesFunction() {

		var methods = {
			NavFunction: NavFunction
		};

		function NavFunction() {
			return true;
		}

		return methods;
	}

	exports.function = NavServicesFunction;
})();