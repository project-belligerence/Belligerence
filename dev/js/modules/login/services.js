(function() {
	'use strict';

	LoginServicesFunction.$inject = ['apiServices', '$rootScope', 'uiServices'];

	function LoginServicesFunction(apiServices, $rootScope, uiServices) {

		var methods = {
			LoginFunction: LoginFunction,
			submitLoginForm: submitLoginForm,
			askLogout: askLogout
		};

		function LoginFunction() { return true; }

		function callLogin(data) {
			var	i, request = {
					url: "/api/playeractions/auth",
					data: data,
					softErrorFunction: handleLogin,
					successFunction: handleLogin,
					cache: false
				}
			;

			return apiServices.requestPOST(request).then(function(data) {

				if (apiServices.statusError(data)) return false;

				return data.data;
			});
		}

		function askLogout() {
			var
				modalOptions = {
					header: { text: 'Sign out?', icon: 'ion-log-out' },
					body: {	text: 'Do you want to sign out of your account and end the current session?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return doLogOut(); }
				else { return false; }
			});
		}

		function doLogOut() {

		}

		function handleLogin(response) {
			$rootScope.$broadcast("loginEvent", response.data);
			return response;
		}

		function submitLoginForm(form) {
			return callLogin({
				username: form.username,
				password: form.password,
				remember: (form.remember || false)
			});
		}

		return methods;
	}

	exports.function = LoginServicesFunction;
})();