(function() {
	'use strict';

	ObjectControllerFunction.$inject = ["$scope", "$timeout", "apiServices"];

	function ObjectControllerFunction($scope, $timeout, apiServices) {
		var vm = this;

		vm.getChevron = getChevron;

		getProjectLicense();

		function getProjectLicense() {
			apiServices.simpleGET(("https://api.github.com/repos/Neefay/Belligerence/license")).then(function(data) {
				getProjectLicenseDetails(data.license.url);
			});
		}

		function getChevron(status) { return ('ion-chevron-' + (status ? 'down' : 'right')); }

		function getProjectLicenseDetails(url) {
			apiServices.simpleGET(url).then(function(data) {
				vm.licenseData = data;

				var bodyReplaced = vm.licenseData.body;

				bodyReplaced = _.replace(bodyReplaced, "[year]", new Date().getFullYear());
				bodyReplaced = _.replace(bodyReplaced, "[fullname]", "Ian Ribeiro");

				vm.licenseData.body = bodyReplaced;
			});
		}
	}

	exports.function = ObjectControllerFunction;
})();