(function() {
	'use strict';

	ObjectsControllerFunction.$inject = ["$rootScope", "$scope", "$state", "$location", "$stateParams", "$q", "$timeout", "apiServices", "generalServices", "pmcServices", "selfInfo", "missionsServices", "operationsServices", "navServices", "fundsServices"];

	function ObjectsControllerFunction($rootScope, $scope, $state, $location, $stateParams, $q, $timeout, apiServices, generalServices, pmcServices, selfInfo, missionsServices, operationsServices, navServices, fundsServices) {
		var vm = this;

		initializeFunctions();

		initializeVariables(function() {
			initializePage(function(success) {
				if (success) vm.displayPage = true;
			});
		});

		$scope.$on("operationsPage:refresh", function() {
			return initializePage(function(success) {
				if (success) vm.displayPage = true;
			});
		});

		// ==============================================

		function initializePage(_cb) {
			vm.displayPage = false;
			generalServices.countActiveOperations().then(function(data) {
				vm.setOperationAmounts(data, "all");

				vm.changeView(vm.initialView());
				return _cb(true);
			});
		}

		function initializeVariables(_cb) {
			vm.selfInfo = selfInfo;
			vm.entityInfo = apiServices.getMainEntity(vm.selfInfo);

			vm.viewData = {	display: false, count: 0, data: [] };
			vm.object_amounts = {};

			vm.consts = {
				DEFAULT_VIEW: "contracts"
			};

			vm.menuItems = {
				contracts: {
					id: "contracts",
					cond: true,
					resolveFunc: function(_cb) {
						missionsServices.getContractsSelf().then(function(data) { return _cb(data);	});
					},
					ui: { button: { text: "Contracts", icon: "ion-document-text" } }
				},
				negotiations: {
					id: "negotiations",
					cond: true,
					resolveFunc: function(_cb) {
						missionsServices.getNegotiationsSelf().then(function(data) { return _cb(data); });
					},
					ui: { button: { text: "Negotiations", icon: "ion-arrow-swap" } },
					methods: {
						cancelNegotiation: function(object) { operationsServices.cancelNegotiation(object.hashField).then(vm.refreshOnResponse); },
						confirmNegotiation: function(object) { operationsServices.confirmNegotiation(object.hashField).then(vm.refreshOnResponse); },
						handleMissionNegotiation: function(object) {
							var modalObject = vm.getModalObject(object, "negotiation");
							operationsServices.handleMissionNegotiation(modalObject).then(vm.refreshOnResponse);
						},
					}
				},
				interests: {
					id: "interests",
					cond: (!vm.entityInfo.hasPMC),
					resolveFunc: function(_cb) {
						if (vm.entityInfo.hasPMC) return _cb(false);
						missionsServices.getInterestsSelf().then(function(data) { return _cb(data); });
					},
					ui: { button: { text: "Interests", icon: "ion-star" } },
					methods: {
						removeInterest: function(object) { operationsServices.removeInterest(object.Mission.hashField).then(vm.refreshOnResponse); },
						modifyInterest: function(object) {
							var modalObject = vm.getModalObject(object);
							operationsServices.modifyInterest(modalObject).then(vm.refreshOnResponse);
						}
					}
				}
			};

			if (vm.selfInfo.PMC) {
				pmcServices.getSelfPMC().then(function(pmc_data) {
					vm.pmcInfo = (pmc_data[0] || {});
					return _cb(true);
				});
			} else { return _cb(true); }
		}

		function initializeFunctions() {
			vm.changeView = changeView;
			vm.initialView = initialView;
			vm.initObject = initObject;
			vm.getBarType = getBarType;
			vm.calcReward = calcReward;
			vm.getStatus = getStatus;
			vm.setShadowClass = setShadowClass;
			vm.changeFaction = changeFaction;
			vm.refreshOnResponse = refreshOnResponse;
			vm.getModalObject = getModalObject;
			vm.setOperationAmounts = setOperationAmounts;

			vm.getRatingIcon = missionsServices.getRatingIcon;
			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.setBGPicture = apiServices.setBGPicture;

			function changeView(view, _cb) {
				if ((!view)) return false;

				vm.viewData.data = [];

				var callbackFunc = (vm.menuItems[view].resolveFunc);

				apiServices.resolveFunction(callbackFunc).then(function(result) {
					if (result) {
						vm.cachedView = view;
						vm.currentView = view;

						$stateParams.view = (vm.cachedView);
						$state.params.view = (vm.cachedView);
						$location.search('view', (vm.cachedView));

						setViewData(result);
						setOperationAmounts(result, view);

					} else { handleRouteFailure(); }
				}, handleRouteFailure);
			}

			function setViewData(data) {
				$timeout(300).then(function() {
					vm.viewData.data = data.data;
					updateTimeLeft(vm.viewData.data);
				});
			}

			function setOperationAmounts(value, model) {
				var rV = {};

				switch(model) {
					case "all": {
						rV = {
							contracts: apiServices.sumArray([value.contracts.active, value.contracts.completed, value.contracts.failed]),
							interests: apiServices.sumArray([value.interests.active]),
							negotiations: apiServices.sumArray([value.negotiations.active, value.negotiations.waiting])
						};
					} break;
					default: { rV[model] = value.data.length; } break;
				}
				vm.object_amounts = _.merge(vm.object_amounts, rV);
			}

			function initObject(type, obj) {
				obj.timeLeft = missionsServices.getMissionTimeElapsed(obj.Mission, 1.5);
				obj.factionData = getActiveFaction(obj.Mission);

				obj.factionData.active = "client";
				obj.factionData.display = true;

				obj.myVar = _.random(100, 120);

				switch(type) {
					case "contract": {
						obj.selfContract = matchContract(obj);
						obj.contractStatus = getStatus(obj);
					} break;
					case "negotiation": {
						obj.canNegotiate = getTurn(obj);
					} break;
					case "interest": { } break;
				}
			}

			function updateTimeLeft(data) {
				for (var i = data.length - 1; i >= 0; i--) {
					var cV = data[i];
					cV.timeLeft = missionsServices.getMissionTimeElapsed(cV.Mission, 1.5);
				}
				$timeout(((1 * 60) * 1000)).then(function() { updateTimeLeft(data); });
			}

			function getTurn(object) {
				switch(object.turnField) {
					case(0): { return ((vm.entityInfo.hasPMC) && (vm.entityInfo.hash === object.Outfit.hashField)); } break;
					case(1): { return (!(vm.entityInfo.hasPMC) && (vm.entityInfo.hash === object.Freelancer.hashField)); } break;
					default: { return false; } break;
				}
			}

			function changeFaction(object, faction) {
				if (object.factionData.active === faction) return false;

				object.factionData.display = false;
				$timeout(100).then(function() {
					object.factionData.active = faction;
					object.factionData.display = true;
				});
			}

			function getStatus(contract) {
				var hasContractors = (contract.Contractors.length > 0);
				switch(contract.statusField) {
					case 0: {
						return {
							meta: { text: "ONGOING", icon: "ion-information-circled", class: "" },
							button: {
								hint: (function() {
									return (hasContractors ? "You cannot cancel a Contract with hired Freelancers." : "Cancel this Contract.");
								}()),
								disable: (function() { return hasContractors; }()),
								icon: "ion-trash-a", text: "Cancel", class: "warning",
								fnc: function(object) {
									operationsServices.openMissionContractCancel(getModalObject(object)).then(refreshOnResponse);
								}
							}
						};
					} break;
					case 1: {
						return {
							meta: { text: "COMPLETED", icon: "ion-checkmark-circled", class: "green" },
							button: {
								hint: "Complete the Mission and cash in the reward.",
								disable: false,
								icon: "ion-cash", text: "Claim", class: "success",
								fnc: function(object) {
									operationsServices.completeMission(getModalObject(object)).then(function(data) {
										if (data) fundsServices.showChangedFunds(data.reward);
										return refreshOnResponse(data);
									});
								}
							}
						};
					} break;
					case 2: {
						return {
							meta: { text: "FAILED", icon: "ion-close-circled", class: "red"	},
							button: {
								hint: "Mission failed - remove the contract.",
								disable: false,
								icon: "ion-close", text: "Remove", class: "danger",
								fnc: function(object) {
									operationsServices.failMission(getModalObject(object)).then(refreshOnResponse);
								}
							}
						};
					} break;
				}
			}

			function getModalObject(object, mode) {
				var rV = {
					contract: (object.selfContract || object), mission: object.Mission,
					selfInfo: vm.selfInfo, pmcInfo: vm.pmcInfo
				};
				switch(mode) {
					case "negotiation": {} break;
					default: {
						rV.faction = object.factionData.faction_client.faction;
					} break;
				}
				return rV;
			}
			function refreshOnResponse(response) {
				if (response) {
					navServices.callEvent("refreshOperationCount");
					refreshView();
				}
			}
			function handleRouteFailure() {
				vm.cachedView = vm.consts.DEFAULT_VIEW; changeView((vm.cachedView || vm.consts.DEFAULT_VIEW));
			}
			function refreshView() { vm.changeView(vm.currentView); }
			function setShadowClass(contract) {
				return {
					"success": (contract.statusField === 1),
					"failed": (contract.statusField === 2)
				};
			}
			function calcReward(contract) {
				return Math.floor((contract.factionData.faction_client.reward * (contract.selfContract ? contract.selfContract.percentField : contract.percentField)) / 100);
			}

			function matchContract(contract) {
				var totalReward = 100, contractors = contract.Contractors;

				for (var i = contractors.length - 1; i >= 0; i--) {
					var cI = contractors[i];
					if (vm.entityInfo.hash === cI.hashField) return cI;

					totalReward -= cI.percentField;
				}
				var rObj = contract;
				contract.percentField = totalReward;

				return contract;
			}
			function getActiveFaction(mission) {
				var side = vm.entityInfo.side, s = ["A", "B"], i, rVa = "B", rVb = "A";
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
			function getBarType(i) {
				var v = ["success", "warning", "danger", "info"];
				return v[(i % v.length)];
			}
			function initialView() { return ($stateParams.view || vm.consts.DEFAULT_VIEW); }
		}
	}

	exports.function = ObjectsControllerFunction;
})();