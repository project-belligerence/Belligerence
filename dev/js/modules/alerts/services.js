(function() {
	'use strict';

	AlertsServicesFunction.$inject = ["$rootScope"];

	function AlertsServicesFunction($rootScope) {

		var methods = {
			addNewAlert: addNewAlert
		};

		function addNewAlert(type, message) {
			$rootScope.$broadcast("addNewAlertEvent", {type: (type || 'success'), msg: (message || 'No message specified.')});
		}

		return methods;
	}

	exports.function = AlertsServicesFunction;
})();