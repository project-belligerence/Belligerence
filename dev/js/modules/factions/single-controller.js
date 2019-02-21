(function() {
	'use strict';

	ObjectControllerFunction.$inject = [
		"$scope", "$state", "$timeout",
		"objectInfo", "selfInfo", "selfUpgrades",
		"sidesData", "policiesData", "tacticsData", "mapData",
		"apiServices", "generalServices", "uiServices", "upgradesServices", "factionsServices"
	];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, selfUpgrades, sidesData, policiesData, tacticsData, mapData, apiServices, generalServices, uiServices, upgradesServices, factionsServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		vm.updateWindowTitle();

		vm.changeSection("conflict");

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;

			vm.sidesData = sidesData;
			vm.policiesData = policiesData;
			vm.tacticsData = tacticsData;
			vm.mapData = mapData;

			vm.showObject = true;
			vm.sectionData = [];

			vm.areasOfInterest = vm.getInterestMaps(vm.objectInfo.areasOfInterest);
			vm.selfUpgrades = upgradesServices.resetOwnedUpgradesProperties(selfUpgrades);

			vm.objectSettings = {
				name: "Faction",
				name_property: "nameField",
				image_folder: "factions",
				hash_property: "hashField",
				image_property: "hashField",
				image_extension: "png",

				activeSection: "",

				simpleProperties: [
					{
						label: "Home",
						tooltip: "The Faction's home territory.",
						model_property: "MapId",
						array_source: "mapData",
						array_source_property: "text",
						query_property: "qHome",
						append: ["", ""],
						null_value: "None",
						type: "find_indexed"
					},
					{
						label: "Side",
						tooltip: "The Faction's global alignment.",
						model_property: "sideField",
						array_source: "sidesData",
						query_property: "qSide",
						array_source_property: "text",
						append: ["", ""],
						type: "indexed"
					},
					{
						label: "Foreign Policy",
						tooltip: "How does this Faction interact with others.",
						model_property: "policyField",
						array_source: "policiesData",
						query_property: "qPolicy",
						array_source_property: "text",
						append: ["", ""],
						type: "indexed"
					},
					{
						label: "Tactics",
						tooltip: "The general strategy employed by the Faction.",
						model_property: "tacticsField",
						array_source: "tacticsData",
						query_property: "qTactics",
						array_source_property: "text",
						append: ["", ""],
						type: "indexed"
					}
				],

				modifierProperties: [
					{
						label: "Training",
						icon: "ion-university",
						tooltip: "How well prepared the units are.",
						model_property: "trainingField",
						filter: vm.getTierAdjective
					},
					{
						label: "Tech Rating",
						icon: "ion-monitor",
						tooltip: "Quality of equipment and gear employed.",
						model_property: "techField",
						filter: vm.getTierAdjective
					},
					{
						label: "Munificence",
						icon: "ion-social-usd",
						tooltip: "A Faction's financial generosity.",
						model_property: "munificenceField",
						filter: vm.getTierAdjective
					},
					{
						label: "Organization",
						icon: "ion-android-sync",
						tooltip: "Ability to plan and recover.",
						model_property: "organizationField",
						filter: vm.getTierAdjective
					},
					{
						label: "ISR",
						icon: "ion-camera",
						tooltip: "Intelligence gathering capacity.",
						model_property: "isrField",
						filter: vm.getTierAdjective
					}
				],

				relatedSections: {
					"conflict": {
						id: "conflict",
						name: "Conflicts",
						icon: "ion-fireball",
						description: "Conflicts this Faction is currently engaged.",
						init: function(_cb) {
							generalServices.getActiveFactionConflicts({ "qFaction": vm.objectInfo.id }).then(function(conflicts) {
								return _cb(conflicts.data.data);
							});
						}
					}
				}
			};

			vm.showObject = true;
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.getAssetBarColor = getAssetBarColor;
			vm.getTierAdjective = getTierAdjective;
			vm.getInterestMaps = getInterestMaps;
			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.checkSingleUpgrade = checkSingleUpgrade;
			vm.displayUpgrades = displayUpgrades;
			vm.displayAreasInterest = displayAreasInterest;
			vm.updateWindowTitle = updateWindowTitle;
			vm.changeSection = changeSection;

			vm.askReportObject = factionsServices.askReportObject;

			function displayAreasInterest() { return (vm.objectInfo.areasOfInterest.length > 0); }

			function displayUpgrades() {
				return ((vm.objectInfo.requiredUpgrades.length > 0) || (vm.objectInfo.blacklistedUpgrades.length > 0));
			}

			function getInterestMaps(v) {
				return apiServices.findObjectsInArray(vm.mapData, "data", v);
			}

			function checkSingleUpgrade(upgrade, mode) {
				var ownedUpgrades = vm.selfUpgrades, j, mUpgrade,
					checkFunction = ((mode === 1) ? _.lt : _.gte),
					neutralClass = "success",
					failedClass = ((mode === 1) ? "pulse-background-color-warning-fast" : "pulse-background-color-black-fast");

				for (j in ownedUpgrades)
					if (ownedUpgrades[j].hashField === upgrade.hashField) { mUpgrade = ownedUpgrades[j]; break; }

				if (mUpgrade) {
					var passedCheck = checkFunction(mUpgrade.owned_upgrades.rankField, upgrade.Rank);
					return {
						currentRank: mUpgrade.owned_upgrades.rankField,
						class: (passedCheck ? failedClass : neutralClass)
					};
				} else { return { currentRank: "-", class: ((mode === 1) ? failedClass : neutralClass) }; }
			}

			function getTierAdjective(v) {
				var rV = "Average";
				switch(true) {
					case (v <= 2): { rV = "Awful"; } break;
					case (v > 2 && v <= 4): { rV = "Poor"; } break;
					case (v > 4 && v <= 6): { rV = "Average"; } break;
					case (v > 6 && v <= 8): { rV = "Great"; } break;
					case (v >= 9): { rV = "Extraordinary"; } break;
				}
				return rV;
			}

			function getAssetBarColor() {
				var percentage = ((vm.objectInfo.currentAssetsField / vm.objectInfo.assetsField) * 100),
					rV = "success";
				switch (true) {
					case (rV <= 50): { rV = "warning"; } break;
					case (rV <= 20): { rV = "danger"; } break;
				}
				return rV;
			}

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