(function() {
	'use strict';

	PlayerServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "$state", "apiServices", "alertsServices"];

	function PlayerServicesFunction($http, $q, $timeout, $cookies, $state, apiServices, alertsServices) {

		var methods = {
			getSelf: getSelf,
			getFriendsSelf: getFriendsSelf,
			removeFriend: removeFriend,
			updateSelf: updateSelf,
			getSettingsSelf: getSettingsSelf,
			getMachineName: getMachineName,
			postClaimNetworth: postClaimNetworth
		}, apiAnchor = "/api/playeractions/";

		function getSelf(cache) { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSelf", ((cache === undefined) ? false : true)) : $q(function(a){a(null);})); }
		function updateSelf(data) {
			var request = { url: (apiAnchor + "updateSelf"), data: data };
			return apiServices.requestPUT(request);
		}
		function getSettingsSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSettingsSelf", false) : $q(function(a){a(null);})); }
		function getMachineName() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getMachineName", false) : $q(function(a){a(null);})); }
		function getFriendsSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getFriendsSelf") : $q(function(a){a(null);})); }

		function removeFriend(hash) {
			var request = { url: (apiAnchor + "removeFriend"), data: { friend_hash: hash } };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) { if (data.data.success) { alertsServices.addNewAlert("warning", data.data.message); return true; }}
			});
		}

		function postClaimNetworth() {
			var request = { url: (apiAnchor + "claimNetworth"), data: {} };
			return apiServices.requestPOST(request);
		}

		return methods;
	}

	exports.function = PlayerServicesFunction;
})();