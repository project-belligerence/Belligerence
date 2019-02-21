(function() {
	'use strict';

	ObjectControllerFunction.$inject = [
		"$scope", "$state", "$timeout",
		"objectInfo", "selfInfo", "sidesData", "locationData", "policiesData", "tacticsData", "mapData",
		"apiServices", "generalServices", "objectivesServices", "uiServices"
	];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, sidesData, locationData, policiesData, tacticsData, mapData, apiServices, generalServices, objectivesServices, uiServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		vm.updateWindowTitle();

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;

			vm.sidesData = sidesData;
			vm.locationData = locationData;
			vm.policiesData = policiesData;
			vm.tacticsData = tacticsData;
			vm.mapData = mapData;

			vm.objectSettings = {
				name: "Objective",
				name_property: "nameField",
				image_folder: "objectives",
				hash_property: "hashField",
				image_property: "iconName",
				image_extension: "png",

				simpleProperties: [
					{
						label: "Time Limit",
						tooltip: "How many hours will the mission be available.",
						model_property: "hourLimitField",
						append: ["", " hour(s)"],
						type: "normal"
					},
					{
						label: "Reward",
						tooltip: "The reward for the objective, before modifiers.",
						model_property: "baseRewardField",
						append: ["D$ ", ""],
						type: "normal"
					},
					{
						label: "Unit Limit",
						tooltip: "The amount of Units that can participate in the mission, per side.",
						model_property: "unitLimit",
						append: ["", " unit(s)"],
						type: "normal"
					}
				],

				matchedIndexProperties: [
					{
						label: "Doctrines",
						tooltip: "The faction doctrines that will utilize this objective.",
						query_property: "qDoctrineTypes",
						model_property: "doctrineTypes",
						model: function() { return vm.matchModel("tacticsData", "doctrineTypes"); },
						property: "text"
					},
					{
						label: "Locations",
						tooltip: "The locations where this objective will be available.",
						query_property: "qLocationTypes",
						model_property: "locationTypes",
						model: function() { return vm.matchModel("locationData", "locationTypes"); },
						property: "text"
					},
					{
						label: "Blacklisted Maps",
						tooltip: "This objective will never be available in these maps.",
						query_property: "qDisabledMaps",
						model_property: "disabledMaps",
						model: function() { return vm.matchModel("mapData", "disabledMaps"); },
						property: "text"
					}
				]
			};

			vm.showObject = true;
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.updateWindowTitle = updateWindowTitle;
			vm.getRatingIcon = getRatingIcon;
			vm.matchModel = matchModel;

			vm.askReportObject = objectivesServices.askReportObject;

			function matchModel(model, v) {
				return apiServices.findObjectsInArray(vm[model], "data", vm.objectInfo[v]);
			}

			function updateWindowTitle() {
				uiServices.updateWindowTitle([vm.objectInfo[vm.objectSettings.name_property], vm.objectSettings.name]);
			}

			function getRatingIcon(r) {
				return (r <= vm.objectInfo.difficultyField ? 'ion-android-checkbox-blank' : 'ion-android-checkbox-outline-blank');
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