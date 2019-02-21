(function() {
	'use strict';

	ObjectsServicesFunction.$inject = ["$timeout", "apiServices", "generalServices"];

	function ObjectsServicesFunction($timeout, apiServices, generalServices) {

		var methods = {
			getLocationTypeIcon: getLocationTypeIcon
		};

		function getLocationTypeIcon(type) {
			switch (type) {
				case 0: { return "capital"; } break;
				case 1: { return "city"; } break;
				case 2: { return "village"; } break;
				case 3: { return "airport"; } break;
				case 4: { return "port"; } break;
				case 5: { return "hill"; } break;
				case 6: { return "vegetation"; } break;
				case 7: { return "strategic"; } break;
				case 8: { return "view"; } break;
				default: { return "city"; } break;
			}
		}

		return methods;
	}

	exports.function = ObjectsServicesFunction;
})();