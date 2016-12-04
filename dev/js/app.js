(function() {
	'use strict';

	var mainApp = angular.module('mainApp', [
		'ui.router',
		'ngAnimate',
		'angular-loading-bar',
		'ui.bootstrap',
		'ngScrollbar',

		'appModules',

		'appUIRoutes'

	]).controller('AppMainCtrl', AppMainControllerFunction);

	AppMainControllerFunction.$inject = ['$http', "$sce", "$location", "$rootScope", "$state"];

	function AppMainControllerFunction($http, $sce, $location, $rootScope, $state) {
		var vm = this;

	}

	require("./modules");
	require("./ui-routes");
	require("./lib/ng-scrollbar.min");
})();