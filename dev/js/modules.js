(function() {
	'use strict';

	var mainApp = angular.module('appModules', [

		'APIModule',
		'FrontpageModule',
		'IntelModule',
		'CheersModule'
	]);

	function getModule(module) { return ("./modules/" + module + "/init"); }

	require(getModule("api"));
	require(getModule("frontpage"));
	require(getModule("intel"));
	require(getModule("cheers"));
})();