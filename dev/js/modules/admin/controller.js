(function() {
	'use strict';

	AdminControllerFunction.$inject = ["$scope", "$stateParams", "$location", "$state", "$q", "$http", "$timeout", "apiServices", "generalServices", "adminServices", "alertsServices", "marketServices", "upgradesServices", "uiServices", "selfInfo", "intelServices"];

	function AdminControllerFunction($scope, $stateParams, $location, $state, $q, $http, $timeout, apiServices, generalServices, adminServices, alertsServices, marketServices, upgradesServices, uiServices, selfInfo, intelServices) {
		var vm = this;

		vm.selfInfo = selfInfo;

		vm.pageState = "main";
		vm.currentSelectedClass = -1;
		vm.currentViewHTML = undefined;

		vm.refreshContent = refreshContent;
		vm.changeState = changeState;

		vm.displayContract = apiServices.displayContract;
		vm.numberToArray = apiServices.numberToArray;
		vm.checkCharactersRemaining = apiServices.checkCharactersRemaining;

		vm.menuItem = adminServices.menuItem;
		vm.updateURL = updateURL;
		vm.clearEdit = clearEdit;

		vm.menuOptions = {
			"content": new vm.menuItem(
				{
					title: "Content", icon: "ios-box",
					description: "Create or edit content. Admin permission required.",
					state: "content",
					enable: apiServices.validatePrivilege(vm.selfInfo, 1),
					view: "content",
					controller: invokeSubController('content')
				}
			),
			"reports": new vm.menuItem(
				{
					title: "Reports & Bans", icon: "alert-circled",
					description: "View unresolved reports and active bans. Moderator permission required.",
					state: "reports",
					enable: apiServices.validatePrivilege(vm.selfInfo, 2),
					view: "reports",
					controller: invokeSubController('reports')
				}
			),
			"access_keys": new vm.menuItem(
				{
					title: "Access keys", icon: "key",
					description: "Generate keys that allows for accounts to be registered without a valid Steam account. Owner permission required.",
					state: "access_keys",
					enable: apiServices.validatePrivilege(vm.selfInfo, 0),
					view: "access_keys",
					controller: invokeSubController('access_keys')
				}
			)
			// "cost-tables": new vm.menuItem(
			// 	{
			// 		title: "Cost Tables", icon: "cash",
			// 		description: "Create or edit cost tables. Admin permission required.",
			// 		state: "cost-tables",
			// 		enable: apiServices.validatePrivilege(vm.selfInfo, 1)
			// 	}
			// )
		};

		console.log("$STATE:", $state);

		changeState(($state.params.menu || "main"));

		// ============================================================

		function clearEdit() { updateURL("editHash", null); }

		function invokeSubController(module) {
			// 	For the record: I should've used the $injector service here, but I found out about it too late.
			// 		A tear shed for the elegance that was lost.

			var injectedServices = {
				$scope: $scope,
				$stateParams: $stateParams,
				$location: $location,
				$state: $state,
				$q: $q,
				$http: $http,
				$timeout: $timeout,
				apiServices: apiServices,
				generalServices: generalServices,
				adminServices: adminServices,
				upgradesServices: upgradesServices,
				marketServices: marketServices,
				alertsServices: alertsServices,
				uiServices: uiServices,
				selfInfo: selfInfo,
				intelServices: intelServices
			};

			return require("./subcontrollers/" + module)(vm, injectedServices);
		}

		function refreshContent(state, init, callback) {
			var
				currentMenu = $location.$$search.menu,
				subCtrlState = (function(menu, state) {
					console.log("MENU", menu, "STATE", state);
					switch(menu) {
						case "content": { return vm.contentSubController.contentList[(state || vm.contentSubController.pageState)]; } break;
						default: {
							console.log("========================");
							console.log(vm);
							console.log(vm.contentSubController);
							console.log(vm.contentSubController.subViews);
							console.log(state);
							console.log(vm.contentSubController.subViews[state]);
							console.log("========================");
							return vm.contentSubController.subViews[state];
						} break;
					}
				})(currentMenu, state),

				getContentFn = (subCtrlState.crud ? subCtrlState.crud.getAll : subCtrlState.getAll),
				perPageLimit = (subCtrlState.queryInfo ? subCtrlState.queryInfo.perPage : 10),
				initialQuery = { page: 1, order: "DESC", sort: "createdAt", limit: perPageLimit }
			;

			vm.contentSubController.contentData = [];

			if (init) vm.contentSubController.queryValues = initialQuery;

			getContentFn((vm.contentSubController.queryValues || initialQuery)).then(function(data) {
				if (data.data.success) {
					vm.contentSubController.initialData = data;
					vm.contentSubController.contentData = data.data.data;
					vm.contentSubController.pageState = (state || vm.contentSubController.pageState);

					$timeout(350).then(function(){
						vm.contentSubController.queryParams.totalItems = data.data.count;
						vm.contentSubController.showPagination = true;
					});

					if (callback) { return callback(true); }
				}
			});
		}

		function updateURL(property, value) {
			var newState = {};
			newState[property] = value;
			if (property === "menu") newState.section = null;

			$stateParams = newState;
			$state.params = newState;
			$state.go($state.$current.self.name, newState, { notify: false });

			$('html, body').animate({ scrollTop: ($('#admin-page').offset().top - 200) }, 'fast');
		}

		function changeState(state) {
			vm.pageState = "null";
			vm.currentViewHTML = undefined;

			console.log("Changing to state:", state);
			console.log("vm.menuOptions", vm.menuOptions);

			$timeout(250).then(function() {
				var menuOption = ((state === "main") ? {} : vm.menuOptions[state]);

				console.log("menuOption", menuOption);

				apiServices.resolveFunction(menuOption.required).then(function() {
					console.log("Resolved REQUIRED.");
					var initFunction = (menuOption.controller || apiServices.nullCbFunction);
					apiServices.resolveFunction(initFunction).then(function() {
						console.log("Resolved INIT.");
						if (menuOption.view) {
							console.log("Has view, loading...");
							adminServices.loadNewView(menuOption.view).then(function(html) {
								console.log("New View", html);
								if (html) vm.currentViewHTML = html;
								vm.pageState = state;
								vm.updateURL('menu', state);
							});
						} else {
							vm.pageState = state; vm.updateURL('menu', state);
							console.log("Changed state to:", vm.pageState);
						}
					});
				}, function() {
					alertsServices.addNewAlert("warning", "An error has occured.");
					vm.pageState = "main";
					vm.updateURL('menu', "main");
				});
			});
		}
	}

	exports.function = AdminControllerFunction;
})();