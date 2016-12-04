(function() {
	'use strict';

	IntelServicesFunction.$inject = ['apiServices'];

	function IntelServicesFunction(apiServices) {

		var methods = {
			getIntel: getIntel,
			getTypeDetails: getTypeDetails
		};

		function getTypeDetails(type) {

			var typeDetails = {
				"statement": {
					type: "Press Statement",
					icon: "ion-speakerphone"
				},
				"intel": {
					type: "Report",
					icon: "ion-clipboard"
				},
				"certification": {
					type: "Certification",
					icon: "ion-university"
				},
				"unknown": {
					type: "Unknown",
					icon: "ion-help-circled"
				}
			};

			return (typeDetails[type] || typeDetails.unknown);
		}

		function getIntel(details) {
			var	i,
				rDetails = (details || {}),
				request = {
					url: ("/api/generalactions/getIntel/" + (rDetails.hashField || "")),
					params: (rDetails),
					cache: false
				}
			;

			return apiServices.requestGET(request).then(function(data) {
				if (apiServices.statusError(data)) return false;

				var intelData = data.data.data;

				for (i in intelData) {
					var intelDetails = getTypeDetails(intelData[i].typeField);
					intelData[i].intelDetails = intelDetails;
				}

				return data.data;
			});
		}

		return methods;
	}

	exports.function = IntelServicesFunction;
})();