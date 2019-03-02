(function() {
	'use strict';

	GeneralServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "$state", "apiServices", "uiServices", "alertsServices", "fundsServices"];

	function GeneralServicesFunction($http, $q, $timeout, $cookies, $state, apiServices, uiServices, alertsServices, fundsServices) {

		var methods = {
			getAllPlayers: getAllPlayers,
			getPlayer: getPlayer,
			getPMC: getPMC,
			getPMCPlayers: getPMCPlayers,
			sendMessage: sendMessage,
			sendPlayerFriendRequest: sendPlayerFriendRequest,
			countMessagesInvitesReceived: countMessagesInvitesReceived,
			countActiveOperations: countActiveOperations,
			sendPMCFriendRequest: sendPMCFriendRequest,
			sendReport: sendReport,
			getAllUnemployed: getAllUnemployed,
			requestJoinPMC: requestJoinPMC,
			inviteJoinPMC: inviteJoinPMC,
			getAllPMC: getAllPMC,
			getPMCTiers: getPMCTiers,
			getItems: getItems,
			getItemsTypeahead: getItemsTypeahead,
			getItem: getItem,
			getItemsTypeClass: getItemsTypeClass,
			getItemContent: getItemContent,
			getStores: getStores,
			getStore: getStore,
			getStoreSpecializations: getStoreSpecializations,
			getStoreFromItem: getStoreFromItem,
			getStoreStatuses: getStoreStatuses,
			getStoreStock: getStoreStock,
			getStoresAndItems: getStoresAndItems,
			buyItems: buyItems,
			getSelfInventory: getSelfInventory,
			getMap: getMap,
			getMaps: getMaps,
			getClimates: getClimates,
			getLocation: getLocation,
			getLocations: getLocations,
			getImportantLocations: getImportantLocations,
			getFactions: getFactions,
			getFaction: getFaction,
			getConflicts: getConflicts,
			getActiveConflicts: getActiveConflicts,
			getActiveFactionConflicts: getActiveFactionConflicts,
			getConflict: getConflict,
			getAdvisories: getAdvisories,
			getAdvisoriesSimple: getAdvisoriesSimple,
			getAdvisory: getAdvisory,
			openObjectiveImages: openObjectiveImages,
			openAdvisoryImages: openAdvisoryImages,
			getObjectives: getObjectives,
			getObjectivesSimple: getObjectivesSimple,
			getObjective: getObjective,
			getMissions: getMissions,
			getMission: getMission,
			getMissionContracts: getMissionContracts,
			getObjectivesList: getObjectivesList,
			getLocationTypes: getLocationTypes,
			getBelligerents: getBelligerents,
			getSides: getSides,
			getRegions: getRegions,
			getMapList: getMapList,
			getPolicies: getPolicies,
			getDoctrines: getDoctrines,
			getConflictStatus: getConflictStatus,
			resetSideAlignment: resetSideAlignment,
			getSideAlignment: getSideAlignment,
			upgradePrestigeRank: upgradePrestigeRank,
			getPrestigeRankCost: getPrestigeRankCost,
			validateAccessKey: validateAccessKey,
			redeemAccessKey: redeemAccessKey,
			getNpmPackages: getNpmPackages,

			deployItem: deployItem,
			requestAirdrop: requestAirdrop
		}, apiAnchor = "/api/generalactions/";

		function getAllPlayers(params) { return apiServices.requestGET({url: apiAnchor + "getPlayers" + params, data: {}}); }
		function getAllUnemployed(params) { return apiServices.requestGET({url: apiAnchor + "getAllUnemployed" + params, data: {}}); }

		function getPlayer(hash, q) { return apiServices.getQuerySimple((apiAnchor + "getPlayer/" + hash), q); }

		function getAllPMC(params) { return apiServices.requestGET({url: apiAnchor + "getAllPMC" + params, data: {}}); }

		function getPMC(hash, q) { return apiServices.getQuerySimple((apiAnchor + "getPMC/" + hash), q); }
		function getPMCPlayers(hash) { return apiServices.getInfo(apiAnchor + "getPMCPlayers/" + hash); }
		function getPMCTiers(hash) { return apiServices.getInfo(apiAnchor + "getPMCTiers/" + hash); }

		function sendMessage(args) {
			var request = { url: (apiAnchor + "sendMessage"), data: args };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function countMessagesInvitesReceived() { return apiServices.getInfo(apiAnchor + "countMessagesInvitesReceived"); }
		function countActiveOperations() {
			if (apiServices.getToken()) { return apiServices.getInfo(apiAnchor + "countActiveOperations"); }
			else { $q(function(a){a({ contracts:[], negotiations: [], interests: [] });}); }
		}

		function sendReport(args) {
			var request = { url: (apiAnchor + "postReport"), data: args };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function sendPlayerFriendRequest(playerHash, inviteNote) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Friends_Player", note: (inviteNote || ""), point_b: playerHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) { if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function sendPMCFriendRequest(pmcHash, inviteNote, price) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Friends_PMC", note: (inviteNote || ""), point_b: pmcHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) {
					alertsServices.addNewAlert("success", data.data.message);
					fundsServices.showChangedFunds(price, "subtract");
				}}
			});
		}

		function inviteJoinPMC(playerHash, inviteNote, price) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Invite_PlayerPMC", note: (inviteNote || ""), point_b: playerHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) {
					alertsServices.addNewAlert("success", data.data.message);
					fundsServices.showChangedFunds(price, "subtract");
				}}
			});
		}

		function requestJoinPMC(pmcHash, inviteNote) {
			var request = { url: (apiAnchor + "sendInvite"), data: { type: "Request_PlayerPMC", note: (inviteNote || ""),  point_b: pmcHash } };
			apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { alertsServices.addNewAlert("success", data.data.message);}}
			});
		}

		function resetSideAlignment() { return apiServices.requestPOST({url: apiAnchor + "resetSideAlignment/" });}
		function getSideAlignment() { return apiServices.getInfo(apiAnchor + "getSideAlignment/"); }

		function upgradePrestigeRank() { return apiServices.requestPOST({url: apiAnchor + "upgradePrestigeRank/" });}
		function getPrestigeRankCost(hash) { return apiServices.getInfo(apiAnchor + "getPrestigeRankCost/"); }

		function getItems(qParams) {
			return apiServices.requestGET({ url: apiAnchor + "getItems/", params: (qParams || {}) });
		}

		function getItemsTypeahead(qParams) {
			return apiServices.requestGET({ url: apiAnchor + "getItemsTypeahead/", params: (qParams || {}) });
		}

		function getItem(hash) { return apiServices.getInfo(apiAnchor + "getItem/" + (hash || "")); }
		function getItemsTypeClass() { return apiServices.getInfo(apiAnchor + "getItemsTypeClass", true); }
		function getItemContent() { return apiServices.getInfo(apiAnchor + "getItemContent", true); }

		function getStores(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getStores/", params: (rParams) });
		}
		function getStore(hash) { return apiServices.requestGET({url: apiAnchor + "getStore/" + (hash || "")}); }
		function getStoreSpecializations() { return apiServices.getInfo(apiAnchor + "getStoreSpecializations", true); }
		function getStoreStatuses() { return apiServices.getInfo(apiAnchor + "getStoreStatuses", true); }
		function getStoreStock(hash) { return apiServices.getInfo(apiAnchor + "getStoreStock/" + (hash || "")); }
		function getStoreFromItem(hash) { return apiServices.getInfo(apiAnchor + "getStoreFromItem/" + (hash || "")); }

		function getStoresAndItems(stores, items) {
			var request = { url: (apiAnchor + "getStoresAndItems/"), data: { stores: stores, items: items }};
			return apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { return data.data.data; }}
			});
		}

		function buyItems(data) {
			return apiServices.requestPOST({ url: (apiAnchor + "buyItem"), data: data}).then(function(data) {
				if (data) {	if (data.data.success) { return data.data.data; } else { return { valid: false }; }}
			});
		}
		function getSelfInventory(hash) { return apiServices.requestGET({url: apiAnchor + "getInventorySelf"});}

		function deployItem(hash, amount) { return apiServices.requestPOST({url: apiAnchor + "deployItem/" + (hash || 123), data: { amount: amount } });}

		function getMaps(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getMaps/", params: (rParams) });
		}
		function getMap(hash) { return apiServices.getInfo(apiAnchor + "getMap/" + (hash || "")); }
		function getClimates(hash) { return apiServices.getInfo(apiAnchor + "getClimates"); }

		function getLocations(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getLocations/", params: (rParams) });
		}
		function getImportantLocations(id) {
			var rParams = { order: "desc", sort: "importance", qMap: id, qImportance: { min: 5 }, qActive: true };
			return apiServices.requestGET({ url: apiAnchor + "getLocations/", params: (rParams) });
		}
		function getLocation(hash) { return apiServices.getInfo(apiAnchor + "getLocation/" + (hash || "")); }

		function getFactions(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getFactions/", params: (rParams) });
		}
		function getFaction(hash) { return apiServices.getInfo(apiAnchor + "getFaction/" + (hash || "")); }

		function getActiveFactionConflicts(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getActiveFactionConflicts/", params: (rParams) });
		}

		function getConflicts(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getConflicts/", params: (rParams) });
		}
		function getActiveConflicts(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getActiveConflicts/", params: (rParams) });
		}
		function getConflict(hash) { return apiServices.getInfo(apiAnchor + "getConflict/" + (hash || "")); }
		function getBelligerents(hash) { return apiServices.getInfo(apiAnchor + "getBelligerents/" + (hash || "")); }

		function getAdvisories(qParams) { return apiServices.requestGET({ url: apiAnchor + "getAdvisories/", params: (qParams || {}) }); }
		function getAdvisoriesSimple(data) { return apiServices.requestPOST({url: apiAnchor + "getAdvisoriesSimple/", data: data });}
		function getAdvisory(hash) { return apiServices.getInfo(apiAnchor + "getAdvisory/" + (hash || "")); }

		function openObjectiveImages(object) {
			var
				modalOptions = {
					name: "Objectives",
					type: "objective",
					description: "Pictures to be used by Objectives.",
					folder: "modules/objectives",
					extension: "png",
					dimensions: { wMin: 300, wMax: 350, hMin: 300, hMax: 350 },
					filenameLimit: {min: 3, max: 14},
					filenameFilter: _.kebabCase,
					allowDeletion: true,
					allowRenaming: true,
					currentImage: object.iconNameInput
				}, newModal = uiServices.createModal('ManageImages', modalOptions)
			;
			return newModal.result.then(function(image) { return image; });
		}

		function openAdvisoryImages(object) {
			var
				modalOptions = {
					name: "Advisories",
					type: "advisorie",
					description: "Pictures to be used by Advisories.",
					folder: "modules/advisories",
					extension: "png",
					dimensions: { wMin: 300, wMax: 350, hMin: 300, hMax: 350 },
					filenameLimit: {min: 3, max: 14},
					filenameFilter: _.kebabCase,
					allowDeletion: true,
					allowRenaming: true,
					currentImage: object.iconNameInput
				}, newModal = uiServices.createModal('ManageImages', modalOptions)
			;
			return newModal.result.then(function(image) { return image; });
		}

		function getObjectives(qParams) { return apiServices.requestGET({ url: apiAnchor + "getObjectives/", params: (qParams || {}) }); }
		function getObjectivesSimple(data) { return apiServices.requestPOST({url: apiAnchor + "getObjectivesSimple/", data: data });}
		function getObjective(hash) { return apiServices.getInfo(apiAnchor + "getObjective/" + (hash || "")); }

		function getMissions(qParams) {
			if (qParams) qParams.qExpired = false;
			return apiServices.requestGET({ url: apiAnchor + "getMissions/", params: (qParams || {}) });
		}
		function getMission(hash) { return apiServices.getInfo(apiAnchor + "getMission/" + (hash || "")); }

		function getMissionContracts(hash) { return apiServices.getInfo(apiAnchor + "getMissionContracts/" + (hash || "")); }

		function getSides() { return apiServices.getInfo(apiAnchor + "getSides", true); }
		function getRegions() { return apiServices.getInfo(apiAnchor + "getRegions", true); }
		function getPolicies() { return apiServices.getInfo(apiAnchor + "getPolicies", true); }
		function getDoctrines() { return apiServices.getInfo(apiAnchor + "getDoctrines", true); }
		function getLocationTypes() { return apiServices.getInfo(apiAnchor + "getLocationTypes", true); }

		function getMapList() { return apiServices.getInfo(apiAnchor + "getMapList"); }
		function getObjectivesList() { return apiServices.getInfo(apiAnchor + "getObjectivesList"); }
		function getConflictStatus() { return apiServices.getInfo(apiAnchor + "getConflictStatus"); }

		function validateAccessKey(hash) {
			return apiServices.requestPOST({url: (apiAnchor + "checkKeyValidity/"), data: { hashField: hash } }).then(function(data) {
				if (data) {	if (data.data.success) { return data.data.data; }}
			});
		}

		function redeemAccessKey(hash) {
			return apiServices.requestPOST({url: (apiAnchor + "redeemAccessKey/"), data: { keyHash: hash } });
		}

		function getNpmPackages() { return apiServices.getInfo(apiAnchor + "getNpmPackages"); }

		// =======================================================
		// ============== PRESENTATION STUFF =====================

		function requestAirdrop(dropObject, gridref, dropColor) {
			var request = { url: (apiAnchor + "sendObjectAirdrop"),
			data: { dropObject: dropObject, gridref: gridref, color: dropColor }};

			return apiServices.requestPOST(request).then(function(data) {
				if (data) {	if (data.data.success) { return data.data.data; }}
			});
		}

		return methods;
	}

	exports.function = GeneralServicesFunction;
})();