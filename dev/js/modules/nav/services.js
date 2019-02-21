(function() {
	'use strict';

	NavServicesFunction.$inject = ["$rootScope"];

	function NavServicesFunction($rootScope) {

		var methods = {
			callEvent: callEvent
		};

		function callEvent(event) {	$rootScope.$emit(("navbar:" + event)); }

		return methods;
	}

	exports.function = NavServicesFunction;
})();