(function() {
	'use strict';

	CheersServicesFunction.$inject = ['apiServices'];

	function CheersServicesFunction(apiServices) {

		var methods = {
			cheerContent: cheerContent
		};

		function cheerContent(target) {
			var	request = {
					url: "/api/generalactions/cheerContent",
					data: {
						type: "intel",
						target: target
					}
				}
			;

			return apiServices.requestPOST(request).then(function(data) {
				if (apiServices.statusError(data)) return false;
				return data.data;
			});
		}

		return methods;
	}

	exports.function = CheersServicesFunction;
})();