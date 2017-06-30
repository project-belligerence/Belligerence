(function() {
	'use strict';

	PlayerServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "$state", "apiServices", "alertsServices"];

	function PlayerServicesFunction($http, $q, $timeout, $cookies, $state, apiServices, alertsServices) {

		var methods = {
			getSelf: getSelf,
			getFriendsSelf: getFriendsSelf,
			removeFriend: removeFriend
		}, apiAnchor = "/api/playeractions/";
		function getSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getSelf", true) : $q(function(a){a(null);})); }
		function getFriendsSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchor + "getFriendsSelf") : $q(function(a){a(null);})); }

		function removeFriend(hash) {
			var request = { url: (apiAnchor + "removeFriend"), data: { friend_hash: hash } };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) { if (data.data.success) { alertsServices.addNewAlert("warning", data.data.message); return true; }}
			});
		}

		return methods;
	}

	exports.function = PlayerServicesFunction;
})();