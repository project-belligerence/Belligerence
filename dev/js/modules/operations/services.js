(function() {
	'use strict';

	ObjectsServicesFunction.$inject = ["$timeout", "apiServices", "generalServices", "missionsServices", "uiServices", "alertsServices", "fundsServices"];

	function ObjectsServicesFunction($timeout, apiServices, generalServices, missionsServices, uiServices, alertsServices, fundsServices) {

		var methods = {
			startMissionContract: startMissionContract,
			openMissionContractCancel: openMissionContractCancel,
			failMission: failMission,
			removeInterest: removeInterest,
			modifyInterest: modifyInterest,
			cancelNegotiation: cancelNegotiation,
			confirmNegotiation: confirmNegotiation,
			completeMission: completeMission,
			handleMissionNegotiation: handleMissionNegotiation,
			getActiveFaction: getActiveFaction
		};

		function getActiveFaction(pSide, mission) {
			var side = pSide, s = ["A", "B"], i, rVa = "B", rVb = "A";
			for (i = s.length - 1; i >= 0; i--) {
				if (side === mission["Faction" + s[i]].sideField) {
					rVa = s[i];
					rVb = s[((i + 1) % s.length)];
				}
			}
			return {
				faction_client: {
					faction: mission["Faction" + rVa], reward: mission["reward" + rVa + "Field"]
				},
				faction_target: {
					faction: mission["Faction" + rVb], reward: mission["reward" + rVb + "Field"]
				}
			};
		}

		function startMissionContract(params) {
			var modalOptions = {
				mode: "sign",
				missionDetails: params.contract,
				contractSide: params.faction.sideField,
				selfInfo: params.selfInfo,
				selfPMC: (params.selfInfo.PMC ? params.pmcInfo : []),
			}, newModal = uiServices.createModal('SignContract', modalOptions);

			return newModal.result.then(function(result) {
				if (result.choice) {
					var modalOptions = {
						header: { text: 'Confirm Contract?', icon: 'ion-edit' },
						body: {	text: 'Are you sure you want to sign this Contract?' },
						choices: {
							yes: { text: 'Confirm', icon: 'ion-checkmark', class: "success" },
							no: { text: 'Return', icon: 'ion-arrow-left-c' }
						},
						cost: result.fee
					},
					paymentModal = uiServices.createModal('GenericYesNo', modalOptions);

					return paymentModal.result.then(function(payment) {
						if (payment) {
							return missionsServices.signContract(params.contract.hashField, params.faction.sideField).then(function(data) {
								if (apiServices.responseOK(data)) {
									fundsServices.showChangedFunds(result.fee, "subtract");
									alertsServices.addNewAlert("success", "The Mission Contract was signed successfully.");
									return (data.data.data);
								} else { return false; }
							});
						} else { startMissionContract(params); }
					});

				} else { return false; }
			});
		}

		function openMissionContractCancel(params) {
			var modalOptions = {
				mode: "cancel",
				missionDetails: params.mission,
				contractSide: params.faction.sideField,
				selfInfo: params.selfInfo,
				selfPMC: (params.selfInfo.PMC ? params.pmcInfo : [])
			}, newModal = uiServices.createModal('SignContract', modalOptions);

			return newModal.result.then(function(result) {
				if (result.choice) {
					return missionsServices.removeContract(params.contract.hashField).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("warning", "You have cancelled the Contract.");
							return (data.data.data);
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function failMission(params) {
			var modalOptions = {
				header: { text: "Remove Contract?" , icon: 'ion-close' },
				body: {	text: "The Mission has failed. Remove the Contract?" },
				choices: {
					yes: { text: 'Confirm', class: "danger", icon: 'ion-close' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}
			},
			newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.redeemContract(params.contract.selfHash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("warning", "The Contract has been removed.");
							return (data.data.success);
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function completeMission(params) {
			var modalOptions = {
				header: { text: "Claim Contract reward?" , icon: 'ion-cash' },
				body: {	text: "Mission complete. Do you wish to claim your reward?" },
				choices: {
					yes: { text: 'Confirm', class: "success", icon: 'ion-checkmark' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}
			},
			newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.redeemContract(params.contract.selfHash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("success", "Contract reward claimed successfully. Good job.");
							return (data.data.data);
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function cancelInterestModal(hash, goBack, params) {
			var modalOptions = {
				header: { text: "Remove Interest?" , icon: 'ion-trash-a' },
				body: {	text: "You will no longer be marked as interested in this mission. Procceed?" },
				choices: {
					yes: { text: 'Remove', class: "danger", icon: 'ion-trash-a' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}
			},
			newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.removeInterest(hash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("warning", "Interest in the Mission was removed.");
							return { success: (data.data.success), choice: 1 };
						} else { return false; }
					});
				} else { return (goBack ? modifyInterest(params) : false); }
			});
		}

		function removeInterest(hash) { return cancelInterestModal(hash, false); }

		function modifyInterest(params) {
			var modalOptions = {
				mode: "interest",
				interestDetails: params.contract,
				missionDetails: params.mission,
				contractSide: params.faction.sideField,
				selfInfo: params.selfInfo,
				selfPMC: (params.selfInfo.PMC ? params.pmcInfo : [])
			}, newModal = uiServices.createModal('SignContract', modalOptions);

			return newModal.result.then(function(result) {
				if (result.choice) {
					switch (result.choice) {
						case 1: { return cancelInterestModal(params.mission.hashField, true, params); } break;
						case 2: {
							return missionsServices.markInterest(params.mission.hashField, params.faction.sideField, result.interest).then(function(data) {
								if (apiServices.responseOK(data)) {
									alertsServices.addNewAlert("success", "Interest in Mission modified successfully.");
									return { success: (data.data.success), choice: result.choice, interest: data.data.data };
								} else { return false; }
							});
						} break;
					}
				} else { return false; }
			});
		}

		function acceptNegotiation(hash, goBack, params) {
			var modalOptions = {
				header: { text: "Cancel Interest?" , icon: 'ion-trash-a' },
				body: {	text: "You will no longer be marked as interested in this mission. Procceed?" },
				choices: {
					yes: { text: 'Cancel', class: "danger", icon: 'ion-trash-a' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}
			},
			newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.redeemContract(hash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("warning", "Interest in the Mission was removed.");
							return (data.data.success);
						} else { return false; }
					});
				} else { return (goBack ? modifyInterest(params) : false); }
			});
		}

		function cancelNegotiation(hash) {
			var modalYesNoOptions = {
				header: { text: 'Cancel Negotiation', icon: 'ion-trash-a' },
				body: {	text: 'Do you wish to cancel this Negotiation?' },
				choices: {
					yes: { text: 'Cancel', icon: 'ion-trash-a', class: "warning" },
					no: { text: 'Return', icon: 'ion-arrow-left-c' }
				}
			}, newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.cancelNegotiation(hash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("warning", "The Negotiation has been cancelled.");
							return (data.data.success);
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function confirmNegotiation(hash) {
			var modalYesNoOptions = {
				header: { text: 'Confirm Contract?', icon: 'ion-edit' },
				body: {	text: 'Are you sure you want to sign this into a Contract? YOU WILL NOT BE ABLE TO CANCEL THE CONTRACT ONCE SIGNED.' },
				choices: {
					yes: { text: 'Confirm', icon: 'ion-checkmark', class: "success" },
					no: { text: 'Return', icon: 'ion-arrow-left-c' }
				}
			}, newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return missionsServices.acceptNegotiation(hash).then(function(data) {
						if (apiServices.responseOK(data)) {
							alertsServices.addNewAlert("success", "The Contract was signed successfully.");
							return (data.data.success);
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function handleMissionNegotiation(params) {
			var negotiationObj = params.contract;

			return missionsServices.getNegotiation({
				qOutfit: negotiationObj.Outfit.hashField,
				qFreelancer: negotiationObj.Freelancer.hashField,
				qMission: negotiationObj.Mission.hashField
			}).then(function(data) {
				var hasNegotiation = (data.data ? true : false),
					negotiation = (hasNegotiation ? data.data : negotiationObj),
					modalOptions = {
						mode: "negotiation",
						missionDetails: negotiation.Mission,
						negotiationDetails: (hasNegotiation ? negotiation : negotiationObj.data),
						negotiationTarget: negotiation.Freelancer,
						contractSide: negotiation.Freelancer.sideField,
						selfInfo: params.selfInfo,
						selfPMC: (params.selfInfo.PMC ? params.pmcInfo : [])
					}, newModal = uiServices.createModal('SignContract', modalOptions);

				return newModal.result.then(function(result) {
					var	modalYesNoOptions = {}, newModal = {};

					switch (result.choice) {
						case (2): {
							modalYesNoOptions = {
								header: { text: 'Confirm Contract?', icon: 'ion-edit' },
								body: {	text: 'Are you sure you want to sign this into a Contract? YOU WILL NOT BE ABLE TO CANCEL THE CONTRACT ONCE SIGNED.' },
								choices: {
									yes: { text: 'Confirm', icon: 'ion-checkmark', class: "success" },
									no: { text: 'Return', icon: 'ion-arrow-left-c' }
								}
							}; newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

							return newModal.result.then(function(choice) {
								if (choice) {
									var callFunc = (negotiation.roundField ? "acceptNegotiation" : "signContract");

									return missionsServices[callFunc](negotiation.hashField, negotiation.sideField, negotiation.Freelancer.hashField, (negotiation.roundField || -1)).then(function(data) {
										if (apiServices.responseOK(data)) {
											alertsServices.addNewAlert("success", "The Mission Contract was signed successfully.");
											return (data.data.success);
										} else { return false; }
									});
								} else { return handleMissionNegotiation(params); }
							});
						} break;
						case (3): {
							modalYesNoOptions = {
								header: { text: 'Initiate Negotiation?', icon: 'ion-checkmark' },
								body: {	text: 'Do you wish to start a negotiation over the Contract terms with this Freelancer?' },
								choices: {
									yes: { text: 'Confirm', icon: 'ion-checkmark', class: "success" },
									no: { text: 'Return', icon: 'ion-arrow-left-c' }
								}
							}; newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

							return newModal.result.then(function(choice) {
								if (choice) {
									return missionsServices.startNegotiation(negotiation.hashField, negotiation.Freelancer.hashField, result.interest).then(function(data) {
										if (apiServices.responseOK(data)) {
											alertsServices.addNewAlert("warning", "Contract negotiation has been initiated with the Freelancer.");
											return (data.data.success);
										} else { return false; }
									});
								} else { return handleMissionNegotiation(params); }
							});
						} break;
						case (3.5): {
							modalYesNoOptions = {
								header: { text: 'Modify Contract terms?', icon: 'ion-arrow-swap' },
								body: {	text: 'Do you wish to modify the current terms of this Contract to ' + result.interest + '% profit share?' },
								choices: {
									yes: { text: 'Confirm', icon: 'ion-checkmark', class: "success" },
									no: { text: 'Return', icon: 'ion-arrow-left-c' }
								}
							}; newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

							return newModal.result.then(function(choice) {
								if (choice) {
									return missionsServices.counterNegotiation(negotiation.hashField, result.interest).then(function(data) {
										if (apiServices.responseOK(data)) {
											alertsServices.addNewAlert("success", "You have sent over the new terms for the Contract.");
											return (data.data.success);
										} else { return false; }
									});
								} else { return handleMissionNegotiation(params); }
							});
						} break;
						case (4): {
							modalYesNoOptions = {
								header: { text: 'Cancel Negotiation', icon: 'ion-trash-a' },
								body: {	text: 'Do you wish to cancel this Negotiation?' },
								choices: {
									yes: { text: 'Cancel', icon: 'ion-trash-a', class: "warning" },
									no: { text: 'Return', icon: 'ion-arrow-left-c' }
								}
							}; newModal = uiServices.createModal('GenericYesNo', modalYesNoOptions);

							return newModal.result.then(function(choice) {
								if (choice) {
									return missionsServices.cancelNegotiation(negotiation.hashField).then(function(data) {
										if (apiServices.responseOK(data)) {
											alertsServices.addNewAlert("warning", "The Negotiation has been cancelled.");
											return (data.data.success);
										} else { return false; }
									});
								} else { return handleMissionNegotiation(params); }
							});
						} break;
					}
				});
			});
		}

		return methods;
	}

	exports.function = ObjectsServicesFunction;
})();