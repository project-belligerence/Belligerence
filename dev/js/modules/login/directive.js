(function() {
	'use strict';

	LoginDirectiveFunctions.$inject = ["$scope", "$timeout", "$cookies", "loginServices"];

	function LoginDirectiveFunctions($scope, $timeout, $cookies, loginServices) {
		var vm = this;

		$scope.loading = false;

		$scope.displayLogin = false;
		$scope.displayLogin2 = false;

		$scope.animations = [650, 950];

		$scope.loginForm = {};

		$scope.displayWarning = false;
		$scope.loginAlertMessage = "";

		$scope.alertType = "warning";

		function renderAlertClasses() {
			$scope.alertClass = {
				"alert-warning": ($scope.alertType == "warning"),
				"alert-success": ($scope.alertType == "success")
			};

			$scope.iconClass = {
				"ion-alert-circled": ($scope.alertType == "warning"),
				"ion-checkmark": ($scope.alertType == "success")
			};
		}

		$scope.submitLoginForm = submitLoginForm;

		$scope.$on("loginEvent", displayLoginMessageEvent);

		function clearWarning() {
			var d = $scope.displayWarning,
				dTime = d ? 150 : 0;

			if (d) $scope.displayWarning = false; $scope.errorMessage = "";
			return dTime;
		}

		function submitLoginForm(form) {
			$scope.loading = true;
			return loginServices.submitLoginForm(form).then(doLogin);
		}

		function doLogin(data) {
			$scope.loading = false;

			if (data) {
				console.log("Logged in: ", data);
				console.log("TOKEN: ", data.data.token);

				$cookies.put('loggedInToken', data.data.token);
			}
		}

		function displayLoginMessageEvent(event, res) {
			console.log("RECEIVED EVENT: ", event);

			$scope.alertType = ((res.success === true) ? "success" : "warning");
			$scope.loginAlertMessage = res.message;

			renderAlertClasses();
			$timeout(function() { $scope.displayWarning = true;	}, clearWarning());
		}

		renderAlertClasses();

		(function displayLoginForm() {
			$timeout(function() { $scope.displayLogin = true; }, $scope.animations[0]);
			$timeout(function() {
				$scope.displayLogin2 = true;

				if (($(window).innerWidth()) > 800) { $("#loginInputUsername").focus();	}

			}, $scope.animations[1]);
		})();
	}

	function LoginDirectiveFunction() {
		return {
			scope: { },
			restrict : "E",
			templateUrl: 'directive/login.ejs',
			controller: LoginDirectiveFunctions
		};
	}

	exports.function = LoginDirectiveFunction;
})();