(function() {
	'use strict';

	ObjectControllerFunction.$inject = [
		"$scope", "$state", "$timeout",
		"objectInfo", "selfInfo",
		"apiServices", "generalServices", "uiServices", "conflictsServices"
	];

	function ObjectControllerFunction($scope, $state, $timeout, objectInfo, selfInfo, apiServices, generalServices, uiServices, conflictsServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.frontpage");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		initializeFunctions();
		initializeVariables();

		vm.updateWindowTitle();

		vm.initializeConflictInfo(vm.objectInfo);

		// ====================================================

		function initializeVariables() {

			vm.objectInfo = objectInfo;

			vm.objectSettings = {
				name: "Conflict",
				name_property: "nameField",
				image_folder: "",
				hash_property: "hashField",
				image_property: "hashField",
				image_extension: "jpg"
			};

			vm.showObject = true;
			vm.showParticipants = false;

			vm.renderInfo = {};

			vm.modifierList = [
				{ name: "Tech", icon: "ion-monitor", value: "techModifier" },
				{ name: "Training", icon: "ion-university", value: "trainingModifier" },
				{ name: "Intel", icon: "ion-camera", value: "intelModifier" },
				{ name: "Munificence", icon: "ion-social-usd", value: "munificenceModifier" }
			];
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.updateWindowTitle = updateWindowTitle;
			vm.initializeConflictInfo = initializeConflictInfo;
			vm.getModifierValue = getModifierValue;
			vm.getFlagClass = getFlagClass;

			vm.mapBackground = conflictsServices.mapBackground;
			vm.flagClass = conflictsServices.flagClass;
			vm.setConflictStatus = conflictsServices.setConflictStatus;

			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.setBarProperties = setBarProperties;

			function initializeConflictInfo(object) {
				vm.renderInfo.faction_sides = determineSides(object);
				vm.renderInfo.factions = setFactionsToRender(object, vm.renderInfo.faction_sides);
				vm.renderInfo.conflict_flow = conflictsServices.getConflictFlow(vm.renderInfo.factions.faction_A_leader, vm.renderInfo.factions.faction_B_leader);
				vm.renderInfo.status = vm.setConflictStatus(object);

				vm.showParticipants = true;
			}

			function setBarProperties(faction) {
				var speed = ((vm.objectInfo.statusField === 0) ? 0 : 1000000);
				return conflictsServices.setBarProperties(faction, speed);
			}

			function getModifierValue(value) {
				var val = Math.floor(value / 2),
					symb = ((val > 0) ? "+" : "-");
				return _.repeat(symb, Math.max((val * Math.sign(val)), 1));
			}

			function determineSides(object) {
				var i, factions = object.factionsField, factionSides = {};

				for (i = factions.length - 1; i >= 0; i--) {
					var cFaction = factions[i],
						cParticipant = cFaction.participant_table;

					if (cParticipant.leaderField) {
						factionSides["faction_" + (factionSides.faction_A ? "B" : "A")] = cFaction.sideField;
					}
				}
				return factionSides;
			}

			function getFlagClass(faction) {
				return conflictsServices.getFlagClass(vm.objectInfo, faction);
			}

			function setFactionsToRender(object, current_sides) {
				var i, factions = object.factionsField,
					factionInfo = {
						factions_A: [],
						factions_B: []
					};

				for (i = factions.length - 1; i >= 0; i--) {
					var cFaction = factions[i],
						cParticipant = cFaction.participant_table;

					var factionProp = ((cFaction.sideField === current_sides.faction_A) ? "A" : "B");
					if (cParticipant.leaderField) {
						factionInfo["faction_" + factionProp + "_leader"] = cFaction;
					} else {
						factionInfo["factions_" + factionProp].push(cFaction);
					}
				}

				return factionInfo;
			}

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