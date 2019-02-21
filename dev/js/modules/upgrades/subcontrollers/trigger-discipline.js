(function() {
	'use strict';

	var subModule = { ctrl: subControllerFactory,
		services: ["$timeout", "apiServices", "uiServices", "alertsServices"]
	};

	function subControllerFactory($timeout, apiServices, uiServices, alertsServices) {

		function getPublicMethods() {
			return {
				askForWhatever: askForWhatever
			};

			function askForWhatever(person) {
				var	modalOptions = {
						header: { text: ('Boom, ' + person), icon: "ion-checkmark" },
						body: {	text: "Oh mane it be like who does't'who'mstv'se?!?" },
						choices: {
							yes: { text: 'Yes', icon: 'ion-checkmark' },
							no: { text: 'I dunno', icon: 'ion-arrow-left-c' }
						}
					}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

				return newModal.result.then(function(choice) {
					if (choice) { alertsServices.addNewAlert("warning", "Boom, you exploded literally everyone."); }
					else { return false; }
				});
			}
		}

		return getPublicMethods();
	}

	module.exports = subModule;
})();