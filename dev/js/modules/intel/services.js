(function() {
	'use strict';

	IntelServicesFunction.$inject = ["$rootScope", 'apiServices', "generalServices", "uiServices"];

	function IntelServicesFunction($rootScope, apiServices, generalServices, uiServices) {

		var methods = {
			getIntel: getIntel,
			getTypeDetails: getTypeDetails,
			getSingleIntel: getSingleIntel,
			askReportIntel: askReportIntel,
			getIntelTypes: getIntelTypes,
			getIntelVisibility: getIntelVisibility,
			getVisibilityDetails: getVisibilityDetails,
			getIntelPostedAs: getIntelPostedAs,
			getPostedAsDetails: getIntelPostedAsDetails,
			alignIntel: alignIntel,
			postIntel: postIntel,
			askPostIntel: askPostIntel,
			getPermissions: getPermissions,
			askDeleteIntel: askDeleteIntel,
			deleteIntel: deleteIntel,
			genBackgroundPicture: genBackgroundPicture,
			genIconColors: genIconColors,
			askEditIntel: askEditIntel,
			getIntelPrice: getIntelPrice,
			getIntelPricePartial: getIntelPricePartial
		};

		function getIntelVisibility() { return ["everyone", "friends", "allPMC", "ownPMC", "friends-PMC", "freelancers"]; }
		function getVisibilityDetails(type) {

			var visibilityDetails = {
				"everyone": { type: "Everyone", value: "everyone", icon: "ion-person-stalker" },
				"allPMC": {	type: "All Outfits", value: "allPMC", icon: "ion-ios-people" },
				"freelancers": { type: "Freelancers", value: "freelancers", icon: "ion-person" },
				"ownPMC": {	type: "Own Outfit", value: "ownPMC", icon: "ion-ios-people-outline"	},
				"friends": { type: "Friends", value: "friends", icon: "ion-android-person-add" },
				"friends-PMC": { type: "Allied Outfits", value: "friends-PMC", icon: "ion-android-people" }
			};
			return (visibilityDetails[type] || visibilityDetails.everyone);
		}

		function getIntelPostedAs() { return ["all", "player", "pmc", "anonymous"]; }
		function getIntelPostedAsDetails(type) {

			var postedAs = {
				"all": { type: "All", value: "all", icon: "ion-minus" },
				"player": { type: "Operator", value: "player", icon: "ion-person" },
				"pmc": { type: "Outfit", value: "pmc", icon: "ion-ios-people" },
				"anonymous": { type: "Anonymous", value: "anonymous", icon: "ion-help-circled" }
			};
			return (postedAs[type] || postedAs.anonymous);
		}

		function getIntelTypes() { return ["all", "statement", "intel", "certification", "unknown"]; }
		function getTypeDetails(type) {
			var typeDetails = {
				"all": { type: "All", value: "all", icon: "ion-ios-infinite" },
				"statement": { type: "Press Statement",	value: "statement",	icon: "ion-speakerphone" },
				"intel": { type: "Report", value: "intel", icon: "ion-clipboard" },
				"certification": { type: "Certification", value: "certification", icon: "ion-university" },
				"unknown": { type: "Unknown", value: "unknown", icon: "ion-help-circled" }
			};
			return (typeDetails[type] || typeDetails.unknown);
		}

		function updateIntelDetails(intelData) {
			var dummyIntel = intelData;
			dummyIntel.intelDetails = getTypeDetails(dummyIntel.typeField);

			dummyIntel.posterUrl = (function(displayAs) {
				switch(displayAs) {
					case "player": { return "operator"; } break;
					case "pmc": { return "outfit"; } break;
				}
			})(dummyIntel.displayAs);

			if (dummyIntel.displayAs === "anonymous") {
				dummyIntel.posterUrl = "#";
			} else { dummyIntel.posterUrl += "/" + dummyIntel.posterHash; }

			return dummyIntel;
		}

		function getSingleIntel(params) {
			return apiServices.requestGET({url: "/api/generalactions/getIntel/" + params.hash}).then(function(data) {
				if (apiServices.statusError(data)) return false;

				var intelData = data.data.data[0];

				intelData = updateIntelDetails(intelData);

				return intelData;
			});
		}

		function getIntel(details) {
			var	i,
			rDetails = (details || {}),
			request = {
				url: ("/api/generalactions/getIntel/" + (rDetails.hashField || "")),
				params: (rDetails), cache: false
			};

			return apiServices.requestGET(request).then(function(data) {
				if (apiServices.statusError(data)) return false;
				var intelData = data.data.data;
				for (i in intelData) { intelData[i] = updateIntelDetails(intelData[i]);	}
				return data.data;
			});
		}

		function askReportIntel(args) {
			var
			modalOptions = { alias: args.title,	hash: args.hash, icon: args.icon, content: "intel", types: ["intelIllegal", "intelRules"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function alignIntel() {
			var classesSelected = ".single-intel-width";
			uiServices.uiMasonry("#intel-col", {
				itemSelector: classesSelected, columnWidth: classesSelected, percentPosition: true
			});
		}

		function getPermissions(player, intel) {
			return ((player.playerPrivilege <= 3) || (player.hashField === (intel.posterHash || '123')));
		}

		function askPostIntel(args) {
			var
				modalOptions = {
					header: { text: 'Post Intel', icon: args.modalIcon },
					body: {	text: 'Are you sure you want to post this Intel with the following settings?' },
					choices: {
						yes: { text: 'Yes', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
					cost: args.finalCost
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) { return postIntel(args); }
				else { return false; }
			});
		}

		function askEditIntel(args) {
			var
				modalOptions = {
					header: { text: 'Edit Intel', icon: 'ion-edit' },
					body: {	text: 'Are you sure you want to submit the new changes to the Intel?' },
					choices: {
						yes: { text: 'Yes', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
					cost: args.finalCost
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) { return editIntel(args); }
				else { return false; }
			});
		}

		function askDeleteIntel(hash) {
			var
				modalOptions = {
					header: { text: 'Delete Intel', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you want to delete this Intel?' },
					choices: {
						yes: { text: 'Yes', icon: 'ion-trash-a' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) { return deleteIntel(hash); }
				else { return false; }
			});
		}

		function deleteIntel(hash) {
			return apiServices.requestDELETE({ url: "/api/generalactions/removeIntel/" + hash });
		}

		function postIntel(args) {
			return apiServices.requestPOST({
				url: "/api/generalactions/postIntel",
				data: {
					"title": args.titleField,
					"body": args.bodyField,
					"display_as": args.postedAs,
					"type": args.typeField,
					"visibility": args.visibilityField,
					"has_picture": (args.hasPicture || false),
					"background_field": args.backgroundField,
					"background_type": args.backgroundType
				}
			}).then(function(data){
				if (!data.data.success) return false;
				return data;
			});
		}

		function editIntel(args) {
			return apiServices.requestPUT({ url: "/api/generalactions/editIntel/" + args.hashField, data: args });
		}

		function getIntelPrice(args) {
			return apiServices.requestPOST({
				url: "api/generalactions/getIntelPrice",
				data: {
					"display_as": args.postedAs,
					"type": args.typeField,
					"visibility": args.visibilityField,
					"has_picture": (args.hasPicture || false),
					"background_field": args.backgroundField,
					"background_type": args.backgroundType
				}
			}).then(function(data) {
				if (apiServices.statusError(data)) { return 99999; } else { return data.data.data; }
			});
		}

		function getIntelPricePartial(args) {
			return apiServices.requestPOST({
				url: "api/generalactions/getIntelPricePartial",
				data: args
			}).then(function(data) {
				if (apiServices.statusError(data)) { return 99999; } else { return data.data.data; }
			});
		}

		function genBackgroundPicture(intel) {
			return (function(intel) {
				switch(intel.backgroundType) {
					case "uploaded-picture": { return "images/modules/intel/main_" + intel.hashField + ".jpg"; } break;
					case "operator-picture": { return "images/avatars/players/main_" + intel.backgroundField + ".jpg"; } break;
					case "outfit-picture": { return "images/avatars/pmc/main_" + intel.backgroundField + ".jpg"; } break;
					default: { return "#"; } break;
				}
			})(intel);
		}

		function genIconColors(intel) {
			if (intel.backgroundType !== "color") return {};
			var colors = intel.backgroundField.split("|");
			return {
				hexagon: { "background-color": colors[0] },
				icon: { "color": colors[1] },
			};
		}

		return methods;
	}

	exports.function = IntelServicesFunction;
})();
