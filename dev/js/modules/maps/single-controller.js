(function() {
	'use strict';

	ObjectControllerFunction.$inject = ["$scope", "$state", "$timeout", "objectInfo", "selfInfo", "climateData", "apiServices", "generalServices", "uiServices", "mapsServices"];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, climateData, apiServices, generalServices, uiServices, mapsServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		vm.updateWindowTitle();

		vm.changeSection("location");

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;
			vm.climateData = climateData;

			vm.showObject = true;
			vm.sectionData = [];

			vm.objectSettings = {
				name: "Map",
				name_property: "nameField",
				hash_property: "classnameField",
				image_folder: "maps",
				image_property: "classnameField",
				image_extension: "jpg",

				activeSection: "",

				simpleProperties: [
					{
						label: "Size",
						tooltip: "Size in km².",
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
						tooltip: "Global latitute.",
						model_property: "latitudeField",
						append: ["", " 'N"],
						type: "normal"
					},
					{
						label: "Longitude",
						tooltip: "Global longitude.",
						model_property: "longitudeField",
						append: ["", " 'E"],
						type: "normal"
					}
				],

				relatedSections: {
					"location": {
						id: "location",
						name: "Important Locations",
						icon: "ion-location",
						description: "The most important Locations in this Map.",
						init: function(_cb) {
							generalServices.getImportantLocations(vm.objectInfo.id).then(function(locations) {
								return _cb(locations.data.data);
							});
						}
					},
					"conflict": {
						id: "conflict",
						name: "Ongoing Conflicts",
						icon: "ion-fireball",
						description: "Conflicts that are currently active in the Map.",
						init: function(_cb) {
							generalServices.getActiveConflicts({ "qLocation": vm.objectInfo.id }).then(function(conflicts) {
								return _cb(conflicts.data.data);
							});
						}
					},
					"home": {
						id: "home",
						name: "Home Factions",
						icon: "ion-home",
						description: "Factions that inabit this Map.",
						init: function(_cb) {
							generalServices.getFactions({ "qHome": vm.objectInfo.id }).then(function(factions) {
								return _cb(factions.data.data);
							});
						}
					},
					"interest": {
						id: "interest",
						name: "Interested Factions",
						icon: "ion-pinpoint",
						description: "What Factions have a tactical interest in this Map.",
						init: function(_cb) {
							generalServices.getFactions({ "qAreasInterest": vm.objectInfo.id }).then(function(factions) {
								return _cb(factions.data.data);
							});
						}
					}
				}
			};
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.updateWindowTitle = updateWindowTitle;
			vm.changeSection = changeSection;

			vm.askReportObject = mapsServices.askReportObject;

			function updateWindowTitle() {
				uiServices.updateWindowTitle([vm.objectInfo[vm.objectSettings.name_property], vm.objectSettings.name]);
			}

			function changeSection(section) {
				if (vm.objectSettings.activeSection !== section) {
					vm.displaySection = false;

					vm.objectSettings.relatedSections[section].init(function(data) {
						vm.sectionData = data;
						vm.objectSettings.activeSection = section;

						$timeout(350).then(function(){ vm.displaySection = true; });
					});
				}
			}

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