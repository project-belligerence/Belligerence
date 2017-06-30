(function() {
	'use strict';

	TemplateControllerFunction.$inject = ["$scope", "$timeout"];

	function TemplateControllerFunction($scope, $timeout) {
		var vm = this;

		vm.currentStep = 0;

		vm.changeStep = changeStep;

		function changeStep(step) {
			var maxSteps = 5, newV = vm.currentStep;
			vm.currentStep = -1;

			$timeout(function() {
				newV = newV + step;
				newV = Math.max(0, Math.min(newV, maxSteps));
				vm.currentStep = newV;
				console.log(vm.currentStep);
			}, 200);

		}
	}

	exports.function = TemplateControllerFunction;
})();