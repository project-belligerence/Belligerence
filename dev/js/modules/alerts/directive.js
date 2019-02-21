(function() {
	'use strict';

	AlertsDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "alertsServices"];

	function AlertsDirectiveFunctions($scope, $timeout, apiServices, alertsServices) {
		var vm = this;

		vm.queueAlerts = [];
		vm.alerts = [];
		vm.showClose = false;

		vm.waitingInLine = false;
		vm.queueCheck = 250;

		$scope.$on("addNewAlertEvent", addAlertToQueue);

		function setHeight(index, thisthing, alert) {
			$("#page-alerts-messages .page-alerts").each(function(foundIndex, element) {

				var foundElement = ((index === foundIndex) && (thisthing.$id === (parseInt(alert.$$hashKey.split(":")[1]) + 1))),
					endPadding = 10;

				$timeout(function() {
					$(element).find(".alert-msg").each(function(i, b) {
						if ($(b).html() === alert.msg) $(element).height($(b).outerHeight() + endPadding);
					});
				}, 50);
			});
		}

		function addAlertToQueue(e, alert, queue) {
			if (vm.waitingInLine) {
				$timeout(function(){ addAlertToQueue(e, alert, queue); }, 500);
			} else {
				if (alert !== "") vm.waitingInLine = true;
				addAlert(alert);
				$timeout(function(){ vm.waitingInLine = false; }, vm.queueCheck);
			}
		}

		function addAlert(alert) {
			vm.alerts.push(alert);
			if (vm.alerts.length >= 2) {
				$("#page-alerts-messages").addClass("move-down");
				$timeout(function() { vm.showClose = true; }, 300);
			}
		}

		function closeAlert(index, thisthing, alert) {
			$("#page-alerts-messages .page-alerts").each(function(foundIndex, element) {

				var foundElement = ((index === foundIndex) && (thisthing.$id === (parseInt(alert.$$hashKey.split(":")[1]) + 1)));

				if (foundElement) {
					$(element).addClass("closing");
					$(element).height("0px");

					$timeout(function() {
						vm.alerts.splice(index, 1);
						if (vm.alerts.length === 0) {
							$("#page-alerts-messages").removeClass("move-down");
							vm.showClose = false;
						}
					}, 400);
				}
			});
		}

		function resetAlerts() {
			vm.alerts = []; vm.showClose = false;
			$("#page-alerts-messages").removeClass("move-down");
		}

		vm.closeAlert = closeAlert;
		vm.addAlert = addAlert;
		vm.resetAlerts = resetAlerts;
		vm.setHeight = setHeight;
	}

	function AlertsDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/alerts.ejs',
			controller: AlertsDirectiveFunctions,
			controllerAs: "CtrlAlerts"
		};
	}

	exports.function = AlertsDirectiveFunction;
})();