(function() {
	'use strict';

	GeneralServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "$state", "apiServices", "alertsServices"];

	function GeneralServicesFunction($http, $q, $timeout, $cookies, $state, apiServices, alertsServices) {

		var methods = {
			getPlayer: getPlayer,
			getPMC: getPMC,
			getPMCPlayers: getPMCPlayers,
			sendMessage: sendMessage,
			sendPlayerFriendRequest: sendPlayerFriendRequest,
			countMessagesInvitesReceived: countMessagesInvitesReceived,
			sendPMCFriendRequest: sendPMCFriendRequest,
			sendReport: sendReport,
			requestJoinPMC: requestJoinPMC
		}, apiAnchor = "/api/generalactions/";

		function getPMC(hash) { return apiServices.getInfo(apiAnchor + "getPMC/" + hash); }
		function getPMCPlayers(hash) { return apiServices.getInfo(apiAnchor + "getPMCPlayers/" + hash); }

		function getPlayer(hash) { return apiServices.getInfo(apiAnchor + "getPlayer/" + hash); }

		function sendMessage(args) {
			var request = { url: (apiAnchor + "sendMessage"), data: args };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function countMessagesInvitesReceived() { return apiServices.getInfo(apiAnchor + "countMessagesInvitesReceived"); }

		function sendReport(args) {
			var request = { url: (apiAnchor + "postReport"), data: args };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function sendPlayerFriendRequest(playerHash) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Friends_Player", point_b: playerHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) { if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function sendPMCFriendRequest(pmcHash) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Friends_PMC", point_b: pmcHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function requestJoinPMC(pmcHash) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Request_PlayerPMC", point_b: pmcHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		return methods;
	}

	exports.function = GeneralServicesFunction;
})();