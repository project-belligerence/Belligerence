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
			getFriendsSelf: getFriendsSelf,
			updateSelfPMC: updateSelfPMC,
			removeAlliance: removeAlliance,
			upgradePMCSize: upgradePMCSize,
			getPMCSizeCost: getPMCSizeCost

		}, apiAnchor = "/api/pmcactions/";

		function getSelfPMC() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSelf") : $q(function(a){a(null);})); }
		function updateSelfPMC(data) {
			var request = { url: (apiAnchor + "editSelfPMC"), data: data };
			return apiServices.requestPUT(request);
		}

		function removeAlliance(hash) {
			var request = { url: (apiAnchor + "removeAlliance"), data: { friend_hash: hash } };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) { if (data.data.success) { alertsServices.addNewAlert("warning", data.data.message); return true; }}
			});
		}

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
		function upgradePMCSize() { return apiServices.requestPOST({url: (apiAnchor + "upgradePMCSize")}); }
		function getPMCSizeCost() { return apiServices.getInfo(apiAnchor + "getPMCSizeCost"); }

		return methods;
	}

	exports.function = PMCServicesFunction;
})();