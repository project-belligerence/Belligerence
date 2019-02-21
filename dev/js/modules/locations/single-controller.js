(function() {
	'use strict';

	ObjectControllerFunction.$inject = ["$scope", "$state", "$timeout", "objectInfo", "selfInfo", "climateData", "apiServices", "generalServices"];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, climateData, apiServices, generalServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;
			vm.climateData = climateData;

			vm.objectSettings = {
				name: "Map",
				hash_property: "classnameField",
				image_folder: "maps",
				image_property: "classnameField",
				image_extension: "jpg",

				simpleProperties: [
					{
						label: "Size",
						tooltip: "Size in km²",
						model_property: "squarekmField",
						append: ["", " km²"],
						type: "normal"
					},
					{
						label: "Climate",
						tooltip: "The type of climate for the region.",
						model_property: "climateField",
						array_source: "climateData",
						array_source_property: "text",
						append: ["", ""],
						type: "indexed"
					},
					{
						label: "Latitute",
						tooltip: "Global latitute",
						model_property: "latitudeField",
						append: ["", " 'N"],
						type: "normal"
					},
					{
						label: "Longitude",
						tooltip: "Global longitude",
						model_property: "longitudeField",
						append: ["", " 'E"],
						type: "normal"
					}
				]
			};

			generalServices.getImportantLocations(vm.objectInfo.id).then(function(locations) {
				vm.mapLocations = locations.data.data;
				vm.showObject = true;
			});
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;

			function displayProperty(property) {
				var fProperty = vm.objectInfo[property.model_property];
				switch (property.type) {
					case "indexed": {
						if (property.array_source_property) {
							fProperty = vm[property.array_source][vm.objectInfo[property.model_property]][property.array_source_property];
						} else { fProperty = vm[property.array_source][vm.objectInfo[property.model_property]]; }
					} break;
				}
				return (property.append[0] + fProperty + property.append[1]);
			}

			function generateLink(property, value) { return vm.objectSettings.image_folder + "?" + property + "=" + vm.objectInfo[value]; }
		}

	}

	exports.function = ObjectControllerFunction;
})();