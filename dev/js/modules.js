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
		'MessagesModule',
		'FundsModule',
		'BureaucracyModule',
		'AdminModule',
		'MarketModule',
		'ItemsModule',
		'MapsModule',
		'LocationsModule',
		'LoadoutsModule',
		'FactionsModule',
		'ConflictsModule',
		'ObjectivesModule',
		'MissionsModule',
		'OperationsModule',
		'NavModule',
		'FooterModule',
		'UpgradesModule',
		'WebsocketsModule'
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
	require(getModule("bureaucracy"));
	require(getModule("admin"));
	require(getModule("market"));
	require(getModule("nav"));
	require(getModule("footer"));
	require(getModule("messages"));
	require(getModule("funds"));
	require(getModule("items"));
	require(getModule("maps"));
	require(getModule("locations"));
	require(getModule("factions"));
	require(getModule("conflicts"));
	require(getModule("objectives"));
	require(getModule("loadouts"));
	require(getModule("upgrades"));
	require(getModule("missions"));
	require(getModule("operations"));
	require(getModule("websockets"));
})();