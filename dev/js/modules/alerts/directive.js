(function() {
	'use strict';

	AlertsDirectiveFunctions.$inject = ["$scope", "$timeout", "alertsServices"];

	function AlertsDirectiveFunctions($scope, $timeout, alertsServices) {
		var vm = this;

		$scope.alerts = [];
		$scope.showClose = false;

		$scope.$on("addNewAlertEvent", addAlert);

		function addAlert(e, alert) {
			$scope.alerts.push(alert);

			if ($scope.alerts.length >= 2) {
				$("#page-alerts-messages").addClass("move-down");
				$timeout(function() { $scope.showClose = true; }, 300);
			}
		}

		function closeAlert(index) {
			$scope.alerts.splice(index, 1);
			if ($scope.alerts.length === 0) {
				$("#page-alerts-messages").removeClass("move-down");
				$scope.showClose = false;
			}
		}

		function resetAlerts() {
			$scope.alerts = []; $scope.showClose = false;
			$("#page-alerts-messages").removeClass("move-down");
		}

		$scope.closeAlert = closeAlert;
		$scope.addAlert = addAlert;
		$scope.resetAlerts = resetAlerts;
	}

	function AlertsDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/alerts.ejs',
			controller: AlertsDirectiveFunctions
		};
	}

	exports.function = AlertsDirectiveFunction;
})();