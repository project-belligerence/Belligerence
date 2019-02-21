(function() {
	'use strict';

	FundsDirectiveFunctions.$inject = ["$rootScope", "$scope", "$timeout", "apiServices", "fundsServices"];

	function FundsDirectiveFunctions($rootScope, $scope, $timeout, apiServices, fundsServices) {
		var vm = this;

		vm.displayFunds = false;
		vm.currentFunds = 0;
		vm.newFunds = 0;
		vm.targetFunds = 0;
		vm.scoringPoints = 0;
		vm.resultSign = "-";

		var displayTimers = {
			funds: {
				display: 250,
				fade: 1000
			},
			interval: 1500,
			result: {
				display: 500,
				fade: 500
			},
			increment: {
				seconds: 5,
				multiplier: 10000,
				min: 10,
				max: 5000
			}
		};

		vm.resolveFunds = resolveFunds;

		$rootScope.$on("funds:displayMoneySpending", displayMoneySpending);

		function displayMoneySpending(event, opt) {
			vm.newFunds = opt.newFunds;
			vm.skipToEnd = false;

			fundsServices.getCurrentFunds().then(function(currentFunds) {

				if (!vm.displayFunds) {

					vm.currentFunds = (currentFunds + (vm.newFunds *-1));
					vm.targetFunds = (vm.currentFunds + (vm.newFunds));

					vm.resultSign = (vm.newFunds < 0) ? "" : "+";
					vm.colorClass = ((vm.newFunds < 0) ? "color-red" : "color-green");
					vm.scoringPoints = vm.newFunds;

					showDisplayFunds(displayTimers.funds.display, function() {
						displayInterpolatedMoney(displayTimers.result.display, vm.colorClass, function() {
							$timeout(function() {
								incrementValueLoop(function() {

									vm.skipToEnd = false;
									vm.currentFunds = vm.targetFunds;
									vm.scoringPoints = 0;

									withdrawsInterpolatedMoney(displayTimers.result.fade, vm.colorClass, function() {
										widthdrawDisplayFunds(displayTimers.funds.fade, function(){});
									});
								});
							}, displayTimers.interval);
						});
					});
				} else {
					vm.scoringPoints += vm.newFunds;
					vm.targetFunds += vm.newFunds;
					displayTimers.interval += displayTimers.interval;
					vm.resultSign = (vm.scoringPoints > 0) ? "+" : "";
				}
			});
		}

		function incrementValueLoop(callback) {

			var numberSpeed = (Math.floor((vm.targetFunds / displayTimers.increment.multiplier))),
				incrementCadence = apiServices.minMax(displayTimers.increment.min, displayTimers.increment.max, numberSpeed),
				incrementNumber = ((vm.newFunds / displayTimers.increment.seconds) / 100),
				targetLimit = (incrementNumber * incrementCadence),
				conditionCheck = ((Math.sign(vm.scoringPoints) === -1) ? (vm.scoringPoints <= targetLimit) : (vm.scoringPoints >= targetLimit));

			if (conditionCheck && (!vm.skipToEnd)) {
				$timeout(function() {
					vm.scoringPoints -= incrementNumber;
					vm.currentFunds += incrementNumber;

					// console.log("Target: " + vm.targetFunds + " | " + Math.floor(vm.scoringPoints) + "(" + (Math.sign(vm.scoringPoints)) + ")" + " points left from " + Math.floor(vm.currentFunds) + "  at " + incrementNumber + " | Latest input: " + vm.newFunds, "| ", conditionCheck);

					incrementValueLoop(callback);
				}, 1);
			} else { return callback();	}
		}

		function showDisplayFunds(delay, _cb) {
			$timeout(function(){ vm.displayFunds = true; return _cb(); }, delay);
		}

		function widthdrawDisplayFunds(delay, _cb) {
			$timeout(function(){ vm.displayFunds = false; return _cb(); }, delay);
		}

		function displayInterpolatedMoney(delay, color, _cb) {
			$timeout(function() {
				$("#funds-interpolation").addClass(color);
				$("#funds-current").addClass(color);
				$("#funds-interpolation").addClass("displaying");
				return _cb();
			}, delay);
		}

		function withdrawsInterpolatedMoney(delay, color, _cb) {
			$timeout(function() {
				$("#funds-interpolation").removeClass(color);
				$("#funds-current").removeClass(color);
				$("#funds-interpolation").removeClass("displaying");
				return _cb();
			}, delay);
		}

		function resolveFunds() { vm.skipToEnd = true; }
	}

	function FundsDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/funds.ejs',
			controller: FundsDirectiveFunctions,
			controllerAs: "CtrlFundsDirective"
		};
	}

	exports.function = FundsDirectiveFunction;
})();
