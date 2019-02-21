(function() {
	'use strict';

	LoginServicesFunction.$inject = ["$state", "$cookies", 'apiServices', '$rootScope', 'uiServices', 'marketServices'];

	function LoginServicesFunction($state, $cookies, apiServices, $rootScope, uiServices, marketServices) {

		var methods = {
			LoginFunction: LoginFunction,
			submitLoginForm: submitLoginForm,
			askLogout: askLogout,
			callLoginSimple: callLoginSimple,
			confirmSelfPassword: confirmSelfPassword
		};

		function LoginFunction() { return true; }

		function callLogin(data) {
			$rootScope.routeError = null;
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

		function callLoginSimple(data, callback) {
			$rootScope.routeError = null;
			var	i, request = { url: "/api/playeractions/auth", data: data, cache: false };

			return apiServices.requestPOST(request).then(function(data) {
				if (apiServices.statusError(data)) return false;
				$cookies.put('loggedInToken', data.data.data.token);
				return callback(data.data);
			});
		}

		function confirmSelfPassword(data, callback) {
			var	i, request = { url: "/api/playeractions/confirmPassword", data: data };

			return apiServices.requestPOST(request).then(function(data) {
				if (apiServices.statusError(data)) return false;
				return callback(data.data);
			});
		}

		function askLogout() {
			var
				modalOptions = {
					header: { text: 'Sign out?', icon: 'ion-log-out' },
					body: {	text: 'Do you want to sign out of your account and end the current session?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
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
			$cookies.remove('loggedInToken');
			marketServices.clearCart();
			$state.go("app.public.frontpage");
			$rootScope.$broadcast("navbar:refreshDirective");
			$rootScope.$broadcast("logoutEvent");
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