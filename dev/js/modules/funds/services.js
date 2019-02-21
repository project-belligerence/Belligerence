(function() {
	'use strict';

	FundsServicesFunction.$inject = ["$rootScope", "$timeout", "$q", "apiServices"];

	function FundsServicesFunction($rootScope, $timeout, $q, apiServices) {

		var methods = {
			getActionCost: getActionCost,
			getCurrentFunds: getCurrentFunds,
			showChangedFunds: showChangedFunds,
			setFundsClass: setFundsClass,
		};

		function setFundsClass(space) {
			var fnc = (space ? "addClass" : "removeClass");
			$("#funds-main-container")[fnc]("spaced");
		}

		function getActionCost(property) {
			var request = { url: "api/generalactions/getCostTableProperty/" + property };
			return apiServices.requestGET(request).then(function(data) {
				if (!data) { return false; } else { return data.data.data; }
			});
		}

		function getCurrentFunds() {
			if (apiServices.getToken()) {
				var request = { url: "api/generalactions/getCurrentFundsSelf" };
				return apiServices.requestGET(request).then(function(data) {
					if (!data) { return false; } else { return data.data.data; }
				});
			} else { return $q(function(a){a(0);}); }
		}

		function showChangedFunds(funds, operation) {
			if (operation === "subtract") funds = (funds *-1);
			$rootScope.$broadcast("funds:displayMoneySpending", {newFunds: funds});
		}

		return methods;
	}

	exports.function = FundsServicesFunction;
})();