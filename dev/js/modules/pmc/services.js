(function() {
	'use strict';

	PMCServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "$state", "apiServices", "alertsServices"];

	function PMCServicesFunction($http, $q, $timeout, $cookies, $state, apiServices, alertsServices) {

		var methods = {
			getSelfPMC: getSelfPMC,
			getSelfPMCPlayers: getSelfPMCPlayers,
			kickPlayer: kickPlayer,
			promotePlayer: promotePlayer,
			demotePlayer: demotePlayer,
			getFriendsSelf: getFriendsSelf
		}, apiAnchor = "/api/pmcactions/";

		function getSelfPMC() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSelf") : $q(function(a){a(null);})); }
		function getSelfPMCPlayers() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSelfPMCPlayers") : $q(function(a){a(null);})); }
		function getFriendsSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getFriendsSelf") : $q(function(a){a(null);})); }

		function kickPlayer(unitHash) {
			var request = {url: (apiAnchor + "kickMember"),data:{member: unitHash}};
			return apiServices.requestPOST(request);
		}

		function promotePlayer(unitHash, rank) {
			return apiServices.requestPOST({url: (apiAnchor + "proDemoteMember"),data:{member: unitHash, tier:(rank-1)}});
		}
		function demotePlayer(unitHash, rank) {
			return apiServices.requestPOST({url: (apiAnchor + "proDemoteMember"),data:{member: unitHash, tier:(rank+1)}});
		}


		return methods;
	}

	exports.function = PMCServicesFunction;
})();