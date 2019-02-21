	(function() {
	'use strict';

	var events = require("./events"),
		mainApp = angular.module('mainApp', [
		'ui.router',
		'ui.router.default',

		'ngAnimate',
		'angular-loading-bar',
		'gg.editableText',
		'ui.bootstrap',
		'ngScrollbar',
		'ngCookies',
		'ngTouch',
		'ngWebSocket',
		'ngFileUpload',
		'ngImgCrop',
		'ngTagsInput',
		'angularCircularNavigation',
		'yaru22.angular-timeago',
		'colorpicker.module',
		'rzModule',

		'appModules',

		'appUIRoutes'
	])
		.controller('AppMainCtrl', AppMainControllerFunction)
		.run(events.stateChangeStartEvent)
		.run(events.stateChangeSuccessEvent)
	;

	AppMainControllerFunction.$inject = ["$rootScope", "$scope", "timeAgoSettings"];

	function AppMainControllerFunction($rootScope, $scope, timeAgoSettings) {
		var vm = this,
			defaultName = "BELLIGERENCE";

		timeAgoSettings.allowFuture = true;
		vm.appName = defaultName;

		vm.windowData = { view: "", number: 0, detail: "" };

		$scope.$on("updatePageTitle", updateTitle);
		$scope.$on("updatePageTitleNumber", updateTitleNumber);

		function updateTitle(event, params) {
			if (params) (vm.windowData.view = (params || ""));
			commitWindowName();
		}

		function updateTitleNumber(event, params) {
			if (params) {
				if (!angular.isUndefinedOrNull(params.number)) vm.windowData.number = params.number;
				if (!angular.isUndefinedOrNull(params.detail)) vm.windowData.detail = params.detail;
			}
			commitWindowName();
		}

		function commitWindowName() {
			var viewName = vm.windowData.view,
				m = ((vm.windowData.detail !== "") ? vm.windowData.detail : ""),
				n = ((vm.windowData.number > 0) ? ("(" + vm.windowData.number + ")" + m + " ") : "");
			vm.appName = (n + m + (viewName ? (viewName + " | " + defaultName) : defaultName));
		}
	}

	require("./modules");
	require("./ui-routes");

	require("./lib/ng-scrollbar.min");
	require("./lib/angular-editable-text");
	require("./lib/ng-img-crop");
	require("./lib/angular-circular-navigation");
})();