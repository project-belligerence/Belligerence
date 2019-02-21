(function(){
	'use strict';

	module.exports = function(vm, services) {

		function reportsSubController(_cb) {

			vm.contentSubController = {
				ui: { privilegeValues: [4,3,2,1] },
				refreshContent: refreshContent,
				generateNewKey: generateNewKey,
				askDeleteAccessKey: askDeleteAccessKey,
				displayKey: services.adminServices.displayKey,
				displayPrivilege: services.apiServices.displayPrivilege
			};

			function assignFormValues() {
				vm.contentSubController.ui.formValues = {
					nameField: "", seedField: "", descriptionField: "",
					fundsField: 0, skipSteamField: false, privilegeField: 4
				};
			}

			assignFormValues();
			refreshContent();

			function refreshContent() {
				services.adminServices.getAccessKeys().then(function(data) {
					vm.contentSubController.contentData = data;
				});
			}

			function generateNewKey() {
				var formValues = vm.contentSubController.ui.formValues;
				assignFormValues();

				services.adminServices.askCreateKey(formValues).then(function(data) {
					if (services.apiServices.responseOK(data)) {
						services.alertsServices.addNewAlert("success", "Access Key successfully generated.");
						refreshContent();
					}
				});
			}

			function askDeleteAccessKey(seed) {
				services.adminServices.askDeleteAccessKey(seed).then(function(data) {
					if (services.apiServices.responseOK(data)) {
						services.alertsServices.addNewAlert("warning", "The Access Key was removed.");
						refreshContent();
					}
				});
			}

			return _cb(true);
		}

		return reportsSubController;
	};
})();