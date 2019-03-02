(function() {
	'use strict';

	ObjectControllerFunction.$inject = ["apiServices", "generalServices"];

	function ObjectControllerFunction(apiServices, generalServices) {
		var vm = this;

		vm.getProjectLicense = getProjectLicense;
		vm.getChevron = getChevron;
		vm.getNpmPackages = getNpmPackages;

		function getNpmPackages() {
			generalServices.getNpmPackages().then(function(packages) { vm.npmPackages = packages; });
		}

		function getProjectLicense() {
			var repoURL = "https://api.github.com/repos/Neefay/Belligerence/license";

			apiServices.simpleGET(repoURL).then(function(data) {
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