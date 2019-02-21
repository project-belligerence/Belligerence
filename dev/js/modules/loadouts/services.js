(function() {
	'use strict';

	LoadoutsServicesFunction.$inject = ["$timeout", "apiServices"];

	function LoadoutsServicesFunction($timeout, apiServices) {

		var methods = {
			getSelfLoadouts: getSelfLoadouts,
			addLoadout: addLoadout,
			editLoadout: editLoadout,
			deleteLoadout: deleteLoadout,
			deployLoadout: deployLoadout,
			resetDeployedItems: resetDeployedItems,
			toggleLoadoutBookmark: toggleLoadoutBookmark
		}, apiAnchor = "/api/generalactions/";

		function getSelfLoadouts() { return apiServices.getInfo(apiAnchor + "getSelfLoadouts"); }

		function addLoadout(name, description, content) {
			var request = { url: (apiAnchor + "addLoadout"), data: { nameField: name, descriptionField: description, contentField: content }};
			return apiServices.requestPOST(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		function editLoadout(hash, name, description, content) {
			var request = { url: (apiAnchor + "addLoadout/" + (hash || "")), data: { nameField: name, descriptionField: description, contentField: content }};
			return apiServices.requestPUT(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		function deleteLoadout(hash) {
			var request = { url: (apiAnchor + "deleteLoadout/" + (hash || "")) };
			return apiServices.requestDELETE(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		function deployLoadout(hash) {
			var request = { url: (apiAnchor + "deployLoadout/" + (hash || ""))};
			return apiServices.requestPOST(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		function resetDeployedItems(hash) {
			var request = { url: (apiAnchor + "resetDeployedItems")};
			return apiServices.requestPOST(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		function toggleLoadoutBookmark(hash) {
			var request = { url: (apiAnchor + "toggleLoadoutBookmark/" + (hash || ""))};
			return apiServices.requestPOST(request).then(function(data) { return apiServices.handleRequestData(data); });
		}

		return methods;
	}

	exports.function = LoadoutsServicesFunction;
})();