(function() {
	'use strict';

	var mainApp = angular.module('appModules', [

		'APIModule',
		'GeneralModule',
		'PlayerModule',
		'PMCModule',
		'RoutesModule',
		'FrontpageModule',
		'SignupModule',
		'DashboardModule',
		'LoginModule',
		'IntelModule',
		'CheersModule',
		'AlertsModule',
		'UnitsModule',
		'UIModule',
		'ModalsModule',
		'CommentsModule',
		'NavModule'
	]);

	function getModule(module) { return ("./modules/" + module + "/init"); }

	require(getModule("api"));
	require(getModule("routes"));
	require(getModule("frontpage"));
	require(getModule("signup"));
	require(getModule("dashboard"));
	require(getModule("login"));
	require(getModule("intel"));
	require(getModule("cheers"));
	require(getModule("alerts"));
	require(getModule("units"));
	require(getModule("ui"));
	require(getModule("modals"));
	require(getModule("general"));
	require(getModule("player"));
	require(getModule("pmc"));
	require(getModule("comments"));
	require(getModule("nav"));
})();