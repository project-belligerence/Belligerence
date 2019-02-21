(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices", "conflictsServices", "uiServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices, conflictsServices, uiServices) {
		var vm = this;
		vm.displayObjects = false;

		initializeDirective(function() {
			vm.displayObjects = true;
		});

		function initializeDirective(cb) {
			initalizeFunctions();
			initializeVariables();

			vm.doMasonry();

			return cb(true);
		}

		function initializeVariables() {
			vm.objectList = ($scope.objectList || []);
			vm.columnSize = ($scope.columnSize);
		}

		function initalizeFunctions() {
			vm.displayDirective = displayDirective;
			vm.doMasonry = doMasonry;
			vm.initObject = initObject;
			vm.getNormalColumnSize = getNormalColumnSize;

			vm.setBarProperties = setBarProperties;
			vm.mapBackground = conflictsServices.mapBackground;
			vm.flagClass = conflictsServices.flagClass;
			vm.setConflictStatus = conflictsServices.setConflictStatus;
			vm.getFlagClass = conflictsServices.getFlagClass;

			vm.applyControlledClass = apiServices.applyControlledClass;

			function setBarProperties(conflict, faction) {
				var speed = ((conflict.statusField === 0) ? 0 : 1000000);
				return conflictsServices.setBarProperties(faction, speed);
			}

			function initObject(object) {
				object.conflict_flow = conflictsServices.getConflictFlow(object.Factions[0], object.Factions[1]);
				object.renderInfo = {};
				object.renderInfo.status = vm.setConflictStatus(object);
			}

			function getNormalColumnSize() {
				var objV = {};
				objV[("col-md-" + vm.columnSize)] = true;
				return objV;
			}

			function displayDirective() { return (vm.displayObjects); }

			function doMasonry() {
				$timeout(function() {
					uiServices.uiMasonry(".conflicts-directive", {
						itemSelector: ".conflict-col", columnWidth: ".conflict-col", percentPosition: false
					});
				}, 500);
			}
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {
				columnSize: "=",
				objectList: "=",
			},
			restrict : "E",
			templateUrl: "directive/" + "conflicts" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Conflicts"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();