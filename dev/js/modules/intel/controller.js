(function() {
	'use strict';

	IntelControllerFunction.$inject = ["fundsServices", "$rootScope", "$state", "$stateParams", "$timeout", "$anchorScroll", "playerInfo", "apiServices", "generalServices", "intelServices", "alertsServices"];

	function IntelControllerFunction(fundsServices, $rootScope, $state, $stateParams, $timeout, $anchorScroll, playerInfo, apiServices, generalServices, intelServices, alertsServices) {
		var vm = this;
		vm.loadingIntel = true;
		vm.intelData = [];
		vm.playerInfo = (playerInfo || apiServices.returnUnloggedUser());

		vm.reportIntel = reportIntel;
		vm.singleMode = !(angular.isUndefined($stateParams.intelHash));
		vm.getPermissions = intelServices.getPermissions;
		vm.askDeleteIntel = askDeleteIntel;

		vm.mockMoneySpent = mockMoneySpent;

		vm.genBackgroundPicture = intelServices.genBackgroundPicture;
		vm.genIconColors = intelServices.genIconColors;

		$timeout(function() {
			if (vm.singleMode) {
				intelServices.getSingleIntel({hash: $stateParams.intelHash}).then(function(data) {
					if (!data) { $state.go('app.public.intel'); }

					vm.intelData = data;

					$timeout(function(){
						vm.loadingIntel = false;

						$rootScope.$broadcast("updatePageTitle", vm.intelData.titleField.substring(0,15) + "[...]" + " | Intel");

						if (!angular.isUndefined($stateParams.comments)) $timeout(function(){$anchorScroll('comments');}, 100);
					 }, 300);
				});
			}
		}, 250);

		function reportIntel() {
			return intelServices.askReportIntel({title: vm.intelData.titleField, hash: vm.intelData.hashField, icon: vm.intelData.intelDetails.icon});
		}

		function askDeleteIntel() {
			var hash = vm.intelData.hashField;
			intelServices.askDeleteIntel(hash).then(function(data) {
				if (apiServices.statusError(data)) return false;

				if (data) {
					alertsServices.addNewAlert("success", "The Intel was successfully removed.");
					$timeout(function(){ $state.go("app.public.intel"); }, 500);
				}
			});
		}

		function mockMoneySpent(funds) {
			var nF = _.random(-50000, 50000);
			//var nF = 1000;

			fundsServices.showChangedFunds(nF, "subtract");
		}
	}

	exports.function = IntelControllerFunction;
})();