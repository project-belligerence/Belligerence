(function() {
	'use strict';

	ObjectControllerFunction.$inject = [
		"$scope", "$state", "$timeout",
		"objectInfo", "selfInfo",
		"apiServices", "generalServices"
	];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, apiServices, generalServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		vm.updateWindowTitle();

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;

			vm.objectSettings = {
				name: "",
				name_property: "nameField",
				image_folder: "",
				hash_property: "hashField",
				image_property: "hashField",
				image_extension: "jpg",

				simpleProperties: [
					{
						label: "",
						tooltip: "",
						model_property: "MapId",
						array_source: "mapData",
						array_source_property: "text",
						query_property: "qHome",
						append: ["", ""],
						null_value: "None",
						type: "find_indexed"
					},
					{
						label: "",
						tooltip: "",
						model_property: "sideField",
						array_source: "sidesData",
						query_property: "qSide",
						array_source_property: "text",
						append: ["", ""],
						type: "indexed"
					},
				]
			};

			vm.showObject = true;
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.updateWindowTitle = updateWindowTitle;

			function updateWindowTitle() {
				uiServices.updateWindowTitle([vm.objectInfo[vm.objectSettings.name_property], vm.objectSettings.name]);
			}

			function displayProperty(property) {
				var fProperty = (vm.objectInfo[property.model_property]);
				switch (property.type) {
					case "indexed": {
						if (property.array_source_property) {
							fProperty = vm[property.array_source][vm.objectInfo[property.model_property]][property.array_source_property];
						} else { fProperty = vm[property.array_source][vm.objectInfo[property.model_property]]; }
					} break;
					case "find_indexed": {
						fProperty = vm[property.array_source][apiServices.findIndexInObject(vm[property.array_source], 'data', vm.objectInfo[property.model_property])];
						if (!(fProperty)) { fProperty = "None"; } else { fProperty = fProperty[property.array_source_property]; }
					} break;
				}
				fProperty = (fProperty ? fProperty : property.null_value);
				return (property.append[0] + fProperty + property.append[1]);
			}

			function generateLink(property, value) {
				if (vm.objectInfo[value]) {
					return (vm.objectSettings.image_folder + "?" + property + "=" + vm.objectInfo[value]);
				} else { return vm.objectSettings.image_folder; }
			}
		}

	}

	exports.function = ObjectControllerFunction;
})();