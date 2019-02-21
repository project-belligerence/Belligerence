(function() {
	'use strict';

	ObjectsServicesFunction.$inject = ["$timeout", "$q", "apiServices", "generalServices", "uiServices", "alertsServices"];

	function ObjectsServicesFunction($timeout, $q, apiServices, generalServices, uiServices, alertsServices) {

		var methods = {
			askReportObject: askReportObject,
			getMissionTimeElapsed: getMissionTimeElapsed,
			signContract: signContract,
			getContractsSelf: getContractsSelf,
			getLastSignedContractSelf: getLastSignedContractSelf,
			removeContract: removeContract,
			markInterest: markInterest,
			removeInterest: removeInterest,
			getInterestsSelf: getInterestsSelf,
			getMissionInterestedPlayers: getMissionInterestedPlayers,
			getContractedPercentage: getContractedPercentage,
			getNegotiationsSelf: getNegotiationsSelf,
			startNegotiation: startNegotiation,
			counterNegotiation: counterNegotiation,
			getNegotiation: getNegotiation,
			acceptNegotiation: acceptNegotiation,
			cancelNegotiation: cancelNegotiation,
			getMissionContracts: getMissionContracts,
			getRatingIcon: getRatingIcon,
			redeemContract: redeemContract,
			refreshSinglePageContracts: refreshSinglePageContracts,
			getAllOperationsSelf: getAllOperationsSelf,
			getSignatureFee: getSignatureFee,
			getUnitLimit: getUnitLimit,
			getMissionParticipants: getMissionParticipants
		},
		apiAnchor = "/api/generalactions/",
		apiAnchorPlayer = "/api/playeractions/",
		apiAnchorPMC = "/api/pmcactions/";

		function getRatingIcon(r, mission) {
			return (r <= mission.difficultyField ? 'ion-android-star' : 'ion-android-star-outline');
		}

		function getUnitLimit(mission) {
			var signedUnits = mission.signedUnits,
				isAdversarial = mission.Objective.adversarialField,
				unitLimit = mission.Objective.unitLimit;
			return (isAdversarial ? ((signedUnits.a === unitLimit) && (signedUnits.b === unitLimit)) : (signedUnits.a === unitLimit));
		}

		function getMissionTimeElapsed(mission, deviance) {
			var timeLimit = mission.Objective.hourLimitField,
				createdTime = moment.parseZone(mission.createdAt).utc().format(),
				timeDiff = moment().diff(createdTime, "minutes"),
				timeDiffMinutes = (timeLimit * 60),
				timeDiffMinutesOffset = ((timeDiffMinutes * (deviance || 5)) / 100),
				timeFinalOffset = (_.random(timeDiffMinutesOffset * -1, timeDiffMinutesOffset)),
				timeTotal = ((timeFinalOffset + timeDiffMinutes) - timeDiff);

			return {
				hours: ("0" + (Math.max((Math.floor(timeTotal / 60)), 0)).toString()),
				minutes: Math.max(Math.floor(timeTotal % 60), 0)
			};
		}

		function askReportObject(args) {
			var
			modalOptions = { alias: args.nameField, hashProperty: "hashField", hash: args.hashField, content: "", types: ["objectData", "objectBugged"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		function getSignatureFee() { return apiServices.getInfo(apiAnchor + "getSignatureFee"); }

		function getMissionParticipants(hash) {
			return apiServices.getInfo((apiAnchor + "getMissionParticipants/" + (hash || "")));
		}

		// Contracts

		function getMissionContracts(hash) { return apiServices.getInfo((apiAnchor + "getMissionContracts/" + (hash || "")));}
		function getContractsSelf(qParams) { return (apiServices.getToken() ? apiServices.getQuery((apiAnchorPlayer + "getSignedContractsSelf/"), (qParams || {})) : $q(function(a){a([]);})); }
		function getLastSignedContractSelf(qParams) { return (apiServices.getToken() ? apiServices.getQuery((apiAnchorPlayer + "getLastSignedContractSelf/"), (qParams || {})) : $q(function(a){a([]);})); }

		function signContract(hash, side, contracted, round) {
			var request = {
				url: (apiAnchorPMC + "signContract"),
				data: { MissionHash: hash, sideField: side, ContractedHash: contracted, roundField: round }
			};
			return apiServices.requestPOST(request);
		}
		function removeContract(hash) {	return apiServices.requestDELETE({ url: (apiAnchorPlayer + "removeContract/" + hash) }); }
		function getContractedPercentage(qParams) { return apiServices.getQuery((apiAnchorPlayer + "getContractedPercentage/"), (qParams || {})); }

		function redeemContract(hash) {
			var request = { url: (apiAnchorPlayer + "redeemContract/" + (hash || "")), data: {} };
			return apiServices.requestPOST(request);
		}

		// Interest

		function getInterestsSelf(qParams) { return (apiServices.getToken() ? apiServices.getQuery((apiAnchorPlayer + "getMarkedInterestsSelf/"), (qParams || {})) : $q(function(a){a([]);})); }

		function markInterest(hash, side, percent) {
			var request = { url: (apiAnchorPlayer + "addInterestToMission"), data: { missionHash: hash, sideField: side, percentField: percent } };
			return apiServices.requestPOST(request);
		}
		function removeInterest(hash) {
			return apiServices.requestDELETE({ url: ((apiAnchorPlayer + "removeInterest/" + (hash || ""))) });
		}
		function getMissionInterestedPlayers(hash) {
			return apiServices.getInfo((apiAnchor + "getInterestedPlayers/" + (hash || "")));
		}

		// Negotiation

		function getNegotiation(qParams) { return apiServices.getQuery((apiAnchorPlayer + "getNegotiation/"), (qParams || {})); }
		function getNegotiationsSelf(qParams) {
			return (apiServices.getToken() ? apiServices.getQuery((apiAnchorPlayer + "getNegotiationsSelf/"), (qParams || {})) : $q(function(a){a([]);}));
		}
		function startNegotiation(missionHash, freelancerHash, percentField) {
			var data = { missionHash: missionHash, freelancerHash: freelancerHash, percentField: percentField };
			return apiServices.requestPOST({ url: (apiAnchorPMC + "startNegotiation/"), data: data });
		}
		function cancelNegotiation(hash) {
			return apiServices.requestDELETE({ url: ((apiAnchorPlayer + "cancelNegotiation/" + (hash || ""))) });
		}
		function acceptNegotiation(hash) {
			var request = { url: (apiAnchorPlayer + "acceptContract/" + (hash || "")), data: {} };
			return apiServices.requestPOST(request);
		}
		function counterNegotiation(hash, percent) {
			var request = { url: (apiAnchor + "counterNegotiation/" + (hash || "")), data: { percentField: percent } };
			return apiServices.requestPOST(request);
		}

		function refreshSinglePageContracts(currentTab, methods) {
			$timeout(150).then(function() {
				alertsServices.addNewAlert("warning", "The list of participants in the Mission has been updated.");
				methods.refresh(currentTab);
			});
		}

		// Operations

		function getAllOperationsSelf() { return (apiServices.getToken() ? apiServices.getInfo(apiAnchorPlayer + "getAllOperationsSelf") : $q(function(a){a(null);})); }

		return methods;
	}

	exports.function = ObjectsServicesFunction;
})();