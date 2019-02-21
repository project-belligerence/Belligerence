(function() {
	'use strict';

	FooterServicesFunction.$inject = ["$rootScope"];

	function FooterServicesFunction($rootScope) {

		var methods = {
			callEvent: callEvent
		};

		function callEvent(event) {	$rootScope.$emit(("footer:" + event)); }

		return methods;
	}

	exports.function = FooterServicesFunction;
})();