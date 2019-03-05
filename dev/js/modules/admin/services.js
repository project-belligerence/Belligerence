(function() {
	'use strict';

	AdminServicesFunction.$inject = ["$rootScope", "$timeout", "$templateRequest", "apiServices", "Upload", "alertsServices", "uiServices"];

	function AdminServicesFunction($rootScope, $timeout, $templateRequest, apiServices, Upload, alertsServices, uiServices) {

		var methods = {
			menuItem: menuItem,
			loadNewView: loadNewView,

			postItem: postItem,
			duplicateItem: duplicateItem,
			editItem: editItem,
			deleteItem: deleteItem,

			postStore: postStore,
			editStore: editStore,
			addStoreStock: addStoreStock,
			removeStoreStock: removeStoreStock,
			getStoreStock: getStoreStock,
			updateStoreStockRecursive: updateStoreStockRecursive,
			deleteStore: deleteStore,

			deleteUpgrade: deleteUpgrade,
			addUpgrade: addUpgrade,
			editUpgrade: editUpgrade,

			addMap: addMap,
			editMap: editMap,
			deleteMap: deleteMap,

			addLocation: addLocation,
			editLocation: editLocation,
			deleteLocation: deleteLocation,

			addFaction: addFaction,
			editFaction: editFaction,
			deleteFaction: deleteFaction,
			duplicateFaction: duplicateFaction,

			addBelligerent: addBelligerent,
			removeBelligerent: removeBelligerent,
			editBelligerent: editBelligerent,

			addConflict: addConflict,
			editConflict: editConflict,
			deleteConflict: deleteConflict,

			addAdvisory: addAdvisory,
			editAdvisory: editAdvisory,
			deleteAdvisory: deleteAdvisory,
			duplicateAdvisory: duplicateAdvisory,

			addObjective: addObjective,
			editObjective: editObjective,
			deleteObjective: deleteObjective,
			duplicateObjective: duplicateObjective,

			addMission: addMission,
			editMission: editMission,
			deleteMission: deleteMission,

			uploadModulePicture: uploadModulePicture,

			getReports: getReports,
			deleteReport: deleteReport,
			askDeleteReport: askDeleteReport,
			getReportData: getReportData,

			askBanPlayer: askBanPlayer,
			getBans: getBans,
			askDeleteBan: askDeleteBan,

			getImagesInFolder: getImagesInFolder,
			deleteImageinFolder: deleteImageinFolder,

			getAccessKeys: getAccessKeys,
			askCreateKey: askCreateKey,
			askDeleteAccessKey: askDeleteAccessKey,
			displayKey: displayKey

		}, apiAnchor = "/api/adminactions/";

		function menuItem(params) {
			return {
				title: params.title,
				icon: "ion-"+params.icon,
				description: params.description,
				state: params.state,
				view: params.view,
				enable: params.enable,
				route: params.route,
				fn: params.fn,
				required: params.required,
				controller: params.controller
			};
		}

		function loadNewView(view) { return $templateRequest('admin-tools/' + view + '.ejs', function(e) { return false; }); }

		function postItem(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addItem", data: data }); }
		function duplicateItem(hash) { return apiServices.requestPOST({ url: apiAnchor + "duplicateItem/" + hash }); }
		function editItem(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editItem/" + hash, data: data }); }
		function deleteItem(hash) {	return apiServices.requestDELETE({ url: apiAnchor + "deleteEntry/" + hash }); }

		function postStore(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addStore", data: data }); }
		function addStoreStock(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addStoreStock/" + (hash || ""), data: data }); }
		function getStoreStock(hash) { return apiServices.getInfo(apiAnchor + "getStoreStockAdmin/" + (hash || "")); }
		function editStore(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editStore/" + hash, data: data }); }
		function deleteStore(hash, data) { return apiServices.requestDELETE({ url: apiAnchor + "deleteStore/" + hash }); }
		function updateStoreStockRecursive(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "updateStoreStockRecursive/" + hash, data: data }); }
		function removeStoreStock(hash, data) {	return apiServices.requestPOST({ url: apiAnchor + "removeStoreStock/" + (hash || ""), data: data }); }

		function uploadModulePicture(type, hash, cropped, currentUploaded) {
			var cData = (currentUploaded ? Upload.dataUrltoBlob(cropped, currentUploaded) : cropped);
			return Upload.upload({
				url: (apiAnchor + "uploadModulePicture/" + type + "s/" + hash),
				headers: { 'x-access-session-token': apiServices.getToken()	},
				data: {	module_picture: cData },
			});
		}

		function getImagesInFolder(qParams) { return apiServices.requestGET({url: apiAnchor + "getImagesInFolder", params: (qParams || {})}); }
		function deleteImageinFolder(data) { return apiServices.requestPOST({ url: apiAnchor + "deleteImageinFolder", data: data }); }

		function getReports(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getReports/", params: (rParams) });
		}

		function getReportData(type) {
			var rV = (function(type) {
				var typeInspect = { text: "Inspect", btn: "muted", icon: "ion-ios-search-strong" },
					typeBan = { text: "Issue Ban", btn: "warning", icon: "ion-alert" },
					typeDelete = { text: "Delete", btn: "warning", icon: "ion-trash-a" };
				switch(type) {
					case "item": { return typeInspect; } break;
					case "player": { return typeBan; } break;
					case "pmc": { return typeInspect; } break;
					case "intel": { return typeDelete; } break;
					case "store": { return typeInspect; } break;
					case "upgrade": { return typeInspect; } break;
					case "comment": { return typeDelete; } break;
					default: { return typeInspect; } break;
				}
			})(type);

			return rV;
		}

		function getBans(qParams) {
			var rParams = (qParams || {});
			return apiServices.requestGET({ url: apiAnchor + "getBans/", params: (rParams) });
		}

		function askBanPlayer(hash, settings) {
			var
				modalOptions = {
					player: hash,
					settings: settings,
					header: { text: 'Ignore report?', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you want to ignore this report?' },
					choices: {
						yes: { text: 'Ignore', icon: 'ion-trash-a' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('BanPlayer', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice.choice) { return banPlayer(choice); }
				else { return false; }
			});
		}
		function banPlayer(params) { return apiServices.requestPOST({ url: apiAnchor + "banPlayer", data: params }); }

		function askDeleteBan(args) {
			var
				modalOptions = {
					header: { text: 'Terminate ban?', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you wish to terminate this player\'s ban?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-wand', class: "warning" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return deleteBan(args.hashField);}
				else { return false; }
			});
		}
		function deleteBan(hash) { return apiServices.requestDELETE({ url: apiAnchor + "liftBan/" + hash }); }

		function askDeleteReport(args) {
			var
				modalOptions = {
					header: { text: 'Ignore report?', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you want to ignore this report?' },
					choices: {
						yes: { text: 'Ignore', icon: 'ion-trash-a' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return deleteReport(args.hashField);}
				else { return false; }
			});
		}

		function askCreateKey(data) {
			var
				modalOptions = {
					header: { text: 'Create new Access Key?', icon: 'ion-key' },
					body: {	text: 'Are you sure you want to create a new Access Key?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-plus' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return generateAccessKey(data); }
				else { return false; }
			});
		}

		function askDeleteAccessKey(seed) {
			var
				modalOptions = {
					header: { text: 'Delete Access Key', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you want to delete this Access Key?' },
					choices: {
						yes: { text: 'Delete', icon: 'ion-trash-a', class: "warning" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result.then(function(choice) {
				if (choice) { return deleteAccessKey(seed);}
				else { return false; }
			});
		}

		function displayKey(key) {
			var
				modalOptions = {
					header: { text: ("ACCESS KEY: " + key.nameField) , icon: 'ion-key' },
					body: {	text: key.hashField },
					choices: { no: { text: 'Return', icon: 'ion-arrow-left-c' } }
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;
			return newModal.result;
		}

		function addUpgrade(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addUpgrade", data: data }); }
		function editUpgrade(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editUpgrade/" + hash, data: data }); }
		function deleteReport(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteReport/" + hash }); }
		function deleteUpgrade(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteUpgrade/" + hash }); }

		function addMap(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addMap", data: data }); }
		function editMap(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editMap/" + hash, data: data }); }
		function deleteMap(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteMap/" + hash }); }

		function addLocation(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addLocation", data: data }); }
		function editLocation(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editLocation/" + hash, data: data }); }
		function deleteLocation(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteLocation/" + hash }); }

		function addFaction(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addFaction", data: data }); }
		function editFaction(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editFaction/" + hash, data: data }); }
		function deleteFaction(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteFaction/" + hash }); }
		function duplicateFaction(hash) { return apiServices.requestPOST({ url: apiAnchor + "duplicateFaction/" + hash }); }

		function addConflict(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addConflict", data: data }); }
		function editConflict(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editConflict/" + hash, data: data }); }
		function deleteConflict(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteConflict/" + hash }); }

		function addBelligerent(hash, faction) { return apiServices.requestPOST({url: apiAnchor + "addBelligerent/" + (hash || 123), data: { factionField: faction } });}
		function removeBelligerent(hash, faction) { return apiServices.requestPOST({url: apiAnchor + "removeBelligerent/" + (hash || 123), data: { factionField: faction } });}
		function editBelligerent(hash, faction) { return apiServices.requestPUT({url: apiAnchor + "editBelligerent/" + (hash || 123), data: { factionField: faction } });}

		function addAdvisory(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addAdvisory", data: data }); }
		function editAdvisory(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editAdvisory/" + hash, data: data }); }
		function deleteAdvisory(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteAdvisory/" + hash }); }
		function duplicateAdvisory(hash) { return apiServices.requestPOST({ url: apiAnchor + "duplicateAdvisory/" + hash }); }

		function addObjective(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addObjective", data: data }); }
		function editObjective(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editObjective/" + hash, data: data }); }
		function deleteObjective(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteObjective/" + hash }); }
		function duplicateObjective(hash) { return apiServices.requestPOST({ url: apiAnchor + "duplicateObjective/" + hash }); }

		function addMission(hash, data) { return apiServices.requestPOST({ url: apiAnchor + "addMission", data: data }); }
		function editMission(hash, data) { return apiServices.requestPUT({ url: apiAnchor + "editMission/" + hash, data: data }); }
		function deleteMission(hash) { return apiServices.requestDELETE({ url: apiAnchor + "deleteMission/" + hash }); }

		function getAccessKeys() { return apiServices.getInfo(apiAnchor + "getAccessKeys/"); }
		function generateAccessKey(data) { return apiServices.requestPOST({ url: (apiAnchor + "generateAccessKey"), data: data }); }
		function deleteAccessKey(seed) { return apiServices.requestDELETE({ url: (apiAnchor + "deleteAccessKey/" + seed) }); }

		return methods;
	}

	exports.function = AdminServicesFunction;
})();