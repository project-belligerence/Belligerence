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
		'ngFileUpload',
		'ngImgCrop',
		'ngTagsInput',
		'angularCircularNavigation',
		'yaru22.angular-timeago',

		'appModules',

		'appUIRoutes'

	])
		.controller('AppMainCtrl', AppMainControllerFunction)
		.run(events.stateChangeStartEvent)
		.run(events.stateChangeSuccessEvent)
	;

	AppMainControllerFunction.$inject = ["$scope"];

	function AppMainControllerFunction($scope) {
		var vm = this,
			defaultName = "Belligerence";

		vm.appName = defaultName;

		$scope.$on("updatePageTitle", function(event, params) {
			console.log("Update event:", params);
			vm.appName = (params ? (params + " | " + defaultName) : defaultName);
		});
	}

	require("./modules");
	require("./ui-routes");

	require("./lib/ng-scrollbar.min");
	require("./lib/angular-editable-text");
	require("./lib/ng-img-crop");
	require("./lib/angular-circular-navigation");
})();