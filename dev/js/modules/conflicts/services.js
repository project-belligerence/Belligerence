(function() {
	'use strict';

	ObjectsServicesFunction.$inject = ["$timeout", "apiServices", "generalServices", "uiServices",];

	function ObjectsServicesFunction($timeout, apiServices, generalServices, uiServices) {

		var methods = {
			askReportObject: askReportObject,
			flagClass: flagClass,
			mapBackground: mapBackground,
			getConflictFlow: getConflictFlow,
			setBarProperties: setBarProperties,
			setConflictStatus: setConflictStatus,
			getFlagClass: getFlagClass
		};

		function flagClass(participant, size) {
			return "images/modules/factions/" + size + "_"+ participant.hashField + ".png";
		}

		function mapBackground(map) {
			return { "background-image": "url('images/modules/maps/main_" + map.classnameField + ".jpg')" };
		}

		function setBarProperties(faction, speed) {
			var widthObject = setBarWidth(faction.percentage),
				speedAnimationObject = setBarSpeed((speed || faction.speed));

			return _.merge(widthObject, speedAnimationObject);
		}

		function setBarSpeed(speed) {
			var prop = "animation",
				propValue = "slide " + speed + "s linear infinite";

			return apiServices.prefixCssProperty(prop, propValue);
		}

		function getFlagClass(conflict, faction) {
			var isWinner = ((conflict.statusField === 2) && (faction.sideField === conflict.victorField));
			return {
				"inactive": (
					!(faction.participant_table.activeField) ||
					(conflict.statusField === 1) ||
					((conflict.statusField === 2) && (faction.sideField !== conflict.victorField))
				),
				"winner": ((conflict.statusField === 2) && (faction.sideField === conflict.victorField))
			};
		}

		function setConflictStatus(object) {
			var statusText = ["started", "suspended", "ended"];
			return {
				text: statusText[object.statusField],
				prop: ((object.statusField > 0) ? "updatedAt" : "createdAt")
			};
		}

		function setBarWidth(width) { return { "width": width.toString() + "%" }; }

		function getConflictFlow(faction_A, faction_B) {
			var
				settings = {
					max_resolution_seconds: 10
				},
				factionA = faction_A.participant_table,
				factionB = faction_B.participant_table,

				factionA_Assets = factionA.deployedAssetsField,
				factionB_Assets = factionB.deployedAssetsField,

				factionA_Resolution = apiServices.minMax(0, 10, factionA.resolutionField),
				factionB_Resolution = apiServices.minMax(0, 10, factionB.resolutionField),

				factionASpeed = Math.floor(settings.max_resolution_seconds / factionA_Resolution),
				factionBSpeed = Math.floor(settings.max_resolution_seconds / factionB_Resolution),

				minAssets = Math.min(factionA_Assets, factionB_Assets),
				maxAssets = Math.max(factionA_Assets, factionB_Assets),

				losingPercentage = (Math.floor(((minAssets / maxAssets) * 100) / 2)),
				winningPercentage = (100 - losingPercentage)
			;

			return {
				faction_a: {
					percentage: ((factionA_Assets === minAssets) ? losingPercentage : winningPercentage),
					speed: factionASpeed
				},
				faction_b: {
					percentage: ((factionB_Assets === minAssets) ? losingPercentage : winningPercentage),
					speed: factionBSpeed
				},
				scores: {
					winning: winningPercentage,
					losing: losingPercentage
				}
			};
		}

		function askReportObject(args) {
			var
			modalOptions = { alias: args.nameField, hashProperty: "hashField", hash: args.hashField, content: "Conflict", types: ["objectData", "objectBugged"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		return methods;
	}

	exports.function = ObjectsServicesFunction;
})();