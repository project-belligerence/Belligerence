(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices", "locationsServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices, locationsServices) {
		var vm = this;
		vm.displayObjects = false;

		initializeDirective(function() {
			vm.displayObjects = true;
		});

		function initializeDirective(cb) {
			initalizeFunctions();
			initializeVariables();

			vm.getLocations(function() {
				return cb(true);
			});
		}

		function initializeVariables() {
			vm.objectList = ($scope.objectList || []);
			vm.columnSize = (($scope.columnSize || [3, 4, 12]));
		}

		function initalizeFunctions() {
			vm.getLocations = getLocations;
			vm.displayDirective = displayDirective;
			vm.displayGridRef = displayGridRef;
			vm.getNormalColumnSize = getNormalColumnSize;
			vm.initObject = initObject;

			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.getLocationTypeIcon = locationsServices.getLocationTypeIcon;

			function initObject(obj) {
				var rObj = obj;
				rObj.Map = (obj.Map ? obj.Map : $scope.mapInfo);
				return rObj;
			}

			function getNormalColumnSize() {
				var objV = {}, sizes = ["md", "sm", "xs"];
				for (var i = vm.columnSize.length - 1; i >= 0; i--) { objV[("col-" + sizes[i] + "-" + vm.columnSize[i])] = true; }
				return objV;
			}

			function displayDirective() { return (vm.displayObjects && (vm.objectList.length > 0)); }

			function displayGridRef(g) { return (g[0] + g[1] + g[1] + " - " + g[3] + g[4] + g[5]); }

			function getLocations(cb) {
				generalServices.getLocationTypes().then(function(locationTypes) {
					vm.locationTypes = locationTypes;
					return cb(true);
				});
			}
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {
				columnSize: "=",
				objectList: "=",
				mapInfo: "=?"
			},
			restrict : "E",
			templateUrl: "directive/" + "locations" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Locations"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();