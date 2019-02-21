(function() {
	'use strict';

	ObjectsControllerFunction.$inject = ["$scope", "$state", "$timeout", "apiServices", "generalServices"];

	function ObjectsControllerFunction($scope, $state, $timeout, apiServices, generalServices) {
		var vm = this;

		initializeFunctions();
		initializePage();

		// ==============================================

		function initializePage() {
			vm.displayFilter = false;
			vm.reloadingPage = false;
			vm.viewData = {};
			vm.urlData = {};
			vm.displayPage = false;

			initializeVariables();

			vm.getExternalVariables(function() {
				vm.displayPage = true;
				vm.callQuery();
			});
		}

		function initializeVariables() {

			vm.queryFunction = "getActiveConflicts";

			vm.objectList = [];
			vm.queryValuesDetails = {};
			vm.objectListCount = 0;
			vm.displayObjects = false;

			vm.pageValues = {
				title: "Conflicts",
				description: "The currently active theaters of war."
			};
		}

		function initializeFunctions() {
			vm.callQuery = callQuery;
			vm.reloadQueryState = reloadQueryState;
			vm.getExternalVariables = getExternalVariables;

			function getExternalVariables(callback) { return callback(); }

			function reloadQueryState() { callQuery(); }

			function callQuery() {
				vm.objectData = [];
				generalServices[vm.queryFunction]().then(function(data) {
					var result = apiServices.handleRequestData(data);
					if (result.success) vm.objectData = result.data; vm.objectListCount = result.count;
					$timeout(350).then(function(){ vm.displayObjects = true; });
				});
			}
		}
	}

	exports.function = ObjectsControllerFunction;
})();