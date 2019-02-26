(function() {
	'use strict';

	LoginDirectiveFunctions.$inject = ["$rootScope", "$state", "$scope", "$timeout", "$cookies", "apiServices", "loginServices", "playerServices"];

	function LoginDirectiveFunctions($rootScope, $state, $scope, $timeout, $cookies, apiServices, loginServices, playerServices) {
		var vm = this;

		$scope.loading = false;
		vm.displayLoginForm = true;
		vm.displayPlayerInfo = false;

		$scope.displayLogin = false;
		$scope.displayLogin2 = false;

		$scope.animations = [650, 950];

		$scope.loginForm = {};

		$scope.displayWarning = false;
		$scope.loginAlertMessage = "";

		$scope.alertType = "warning";

		$scope.submitLoginForm = submitLoginForm;

		vm.displayContract = apiServices.displayContract;
		vm.numberToArray = apiServices.numberToArray;
		vm.applyControlledClass = apiServices.applyControlledClass;

		$scope.$on("loginEvent", displayLoginMessageEvent);
		$scope.$on("logoutEvent", displayOnToken);

		displayOnToken();

		function displayOnToken() {
			vm.displayLoginForm = (apiServices.getToken() === null);

			if (!vm.displayLoginForm) {
				playerServices.getSelf().then(function(d) {
					vm.selfInfo = d;
					vm.displayPlayerInfo = true;

					vm.selfSide = (vm.selfInfo.PMC ? vm.selfInfo.PMC.sideField : vm.selfInfo.sideField);

					vm.quickRoutes = [
						{ icon: "ion-home", name: "Dashboard", route: "app.private.dashboard" },
						{ icon: "ion-android-cart", name: "Stores", route: "app.public.market" },
						{ icon: "ion-document-text", name: "Contracts", route: "app.private.operations" },
						{ icon: "ion-archive", name: "Inbox", route: "app.private.messages" }
					];
				});
			}
		}

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
			if (apiServices.responseOK(data)) {
				if (data) {
					$timeout(1000).then(function() {
						$cookies.put('loggedInToken', data.data.token);
						$state.go("app.private.dashboard");
						$rootScope.$broadcast("navbar:refreshDirective");
					});
				}
			} else { $scope.loading = false; }
		}

		function displayLoginMessageEvent(event, res) {
			$scope.alertType = ((res.success === true) ? "success" : "warning");
			$scope.loginAlertMessage = res.message;

			renderAlertClasses();
			$timeout(function() { $scope.displayWarning = true;	}, clearWarning());
		}

		renderAlertClasses();

		(function () {
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
			controller: LoginDirectiveFunctions,
			controllerAs: "LoginFormCtrl"
		};
	}

	exports.function = LoginDirectiveFunction;
})();