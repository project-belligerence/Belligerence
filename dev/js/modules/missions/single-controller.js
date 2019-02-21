(function() {
	'use strict';

	ObjectControllerFunction.$inject = [
		"$scope", "$state", "$timeout", "$q", "$location",
		"objectInfo", "selfInfo", "selfFriends", "selfUpgrades",
		"apiServices", "generalServices", "pmcServices", "uiServices",
		"operationsServices", "missionsServices", "upgradesServices", "navServices", "websocketsServices"
	];

	function ObjectControllerFunction($scope, $state, $timeout, $q, $location, objectInfo, selfInfo, selfFriends, selfUpgrades, apiServices, generalServices, pmcServices, uiServices, operationsServices, missionsServices, upgradesServices, navServices, websocketsServices) {
		var vm = this;
		if (!objectInfo) return $state.go("app.public.missions");
		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.selfFriends = (selfFriends || []);

		initializeFunctions();

		initializeVariables(function() {
			vm.updateWindowTitle();
			vm.refreshContractStatus();

			vm.showObject = true;

			vm.changeTab(vm.initialTab);
		});

		// ====================================================

		function initializeVariables(callback) {
			vm.initialTab = ($state.params.tab || "info");

			vm.objectInfo = objectInfo;
			vm.selfUpgrades = upgradesServices.resetOwnedUpgradesProperties(selfUpgrades);

			vm.missionSigned = false;
			vm.missionInterest = false;

			vm.displayUpgrades = { a: false, b: false };

			vm.objectInfo.totalUnits = vm.getTotalUnits();

			vm.objectSettings = {
				name: "Mission",
				name_property: "nameField",
				image_folder: "",
				hash_property: "hashField",
				image_property: "hashField",
				image_extension: "jpg",
				simpleProperties: []
			};

			vm.selfProperties = {
				main: (vm.selfInfo.PMC ? "pmcInfo" : "selfInfo"),
				name: (vm.selfInfo.PMC ? "display_name" : "aliasField"),
				image: (vm.selfInfo.PMC ? "pmc" : "players"),
				side: (vm.selfInfo.PMC ? "side" : "sideField"),
			};

			vm.initializeMinuteLoop();
			vm.initializeWebsockets();

			vm.findExistingContract(function() {
				vm.findExistingInterest(function() {
					generalServices.getSides().then(function(sides) {
						vm.sidesData = sides;

						if (vm.selfInfo.PMC) {
							pmcServices.getSelfPMC().then(function(pmc_data) {
								vm.pmcInfo = (pmc_data[0] || {});
								return callback(true);
							});
						} else { return callback(true); }
					});
				});
			});
		}

		function initializeFunctions() {
			vm.generateLink = generateLink;
			vm.displayProperty = displayProperty;
			vm.updateWindowTitle = updateWindowTitle;
			vm.getRatingIcon = getRatingIcon;
			vm.initializeMinuteLoop = initializeMinuteLoop;
			vm.changeTab = changeTab;
			vm.checkSingleUpgrade = checkSingleUpgrade;
			vm.openMissionContract = openMissionContract;
			vm.findExistingContract = findExistingContract;
			vm.findExistingInterest = findExistingInterest;
			vm.canSignMission = canSignMission;
			vm.openMissionContractCancel = openMissionContractCancel;
			vm.refreshContractStatus = refreshContractStatus;
			vm.validateFactionUpgrades = validateFactionUpgrades;
			vm.initializeWebsockets = initializeWebsockets;
			vm.slotsClass = slotsClass;
			vm.getTotalUnits = totalUnits;

			vm.getSideName = apiServices.getSideName;
			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.getMissionTimeElapsed = missionsServices.getMissionTimeElapsed;

			function changeTab(tab) {
				var prevTab = vm.currentTab;
				vm.currentTab = "loading";

				$timeout(100).then(function() {
					updateParticipantSlots().then(function() {
						tabTransition(tab).then(
							function() { vm.currentTab = tab; },
							function() { vm.currentTab = "info"; }
						);
					});
				});
			}

			function initializeWebsockets() {
				websocketsServices.initCtrlWS($scope, {
					NewParticipant: {
						onMessage: function() {
							return missionsServices.refreshSinglePageContracts(vm.currentTab, { refresh: handleNewParticipant });
						},
						filter: function() { return websocketsServices.joinFilter(["NewParticipant", vm.objectInfo.hashField]); },
					}
				});
			}

			function handleNewParticipant(tab) {
				switch(tab) {
					case "participant": { return tabTransition(tab); } break;
					case "info": { return updateParticipantSlots(); } break;
				}
			}

			function tabTransition(tab) {
				return $q({
					info: function(r, f) { return r(1); },
					participants: function(r, f) {
						vm.participantsData = { interaction: {}, models: {} };
						vm.participantsData.interaction.interest = {
							isOpen: false, toggleOnClick: true, enableDefaults: true, items: []
						};

						missionsServices.getMissionContracts(vm.objectInfo.hashField).then(function(mission_contracts) {
							missionsServices.getMissionInterestedPlayers(vm.objectInfo.hashField).then(function(interest_players) {
								missionsServices.getNegotiationsSelf({ qMission: vm.objectInfo.id }).then(function(negotiations) {

									vm.participantsData.models.negotiations = negotiations.data;
									vm.participantsData.models.contracts = separateBySide(mission_contracts);
									vm.participantsData.models.interest = separateBySide(interest_players);

									vm.participantsData.models.interest.a = mergeContractPlayer(vm.participantsData.models.interest.a);
									vm.participantsData.models.interest.b = mergeContractPlayer(vm.participantsData.models.interest.b);

									vm.participantsData.models.interest.display = displaySection(vm.participantsData.models.interest);
									vm.participantsData.models.contracts.display = displaySection(vm.participantsData.models.contracts);

									if (!(angular.isUndefinedOrNull(vm.selfInfo.PMC)) && vm.missionSigned) {
										vm.participantsData.interaction.interest.items.push(interactionObjects("hire"));
									}

									return r();
								});
							});
						});
					}
				}[tab]);
			}

			function slotsClass(slots) {
				var remainingSlots = (vm.objectInfo.Objective.unitLimit - slots),
					percentage = ((remainingSlots / vm.objectInfo.Objective.unitLimit) * 100);
				switch(true) {
					case (remainingSlots <= 0): { return "bad"; } break;
					case (percentage <= 50): { return "caution"; } break;
					default: { return "good"; } break;
				}
			}

			function interactionObjects(obj) {
				return {
					hire: {
						content: 'Hire', icon: 'ion-android-person-add',
						tooltip: 'Opens the Negoation menu with this Freelancer.',
						function: startMissionNegotiation,
						condition: checkCanHire
					}
				}[obj];
			}

			function checkCanHire(unit) {
				var isSame = (unit.hash === vm.selfInfo.hashField),
					hasPMC = !(angular.isUndefinedOrNull(vm.selfInfo.PMC)),
					sameSide = ((vm.selfInfo.sideField === unit.sideField) || (vm.selfInfo.sideField === 0)),
					isNegotiating = checkNegotiationFreelancer(vm.participantsData.models.negotiations, unit);
				return (!(isSame) && (hasPMC) && (sameSide) && !(isNegotiating));
			}

			function displaySection(section) { return ((section.a.length > 0) || (section.b.length > 0)); }

			function totalUnits() { return (vm.objectInfo.signedUnits.a + vm.objectInfo.signedUnits.b); }

			function mergeContractPlayer(list) {
				for (var i = list.length - 1; i >= 0; i--) {
					var interestSide = list[i].sideField;
					list[i] = _.merge(list[i], list[i].Poster);
					list[i].sideField = interestSide;
				}
				return list;
			}

			function separateBySide(list) {
				var rObj = { a: [], b: [] };
				for (var i = list.length - 1; i >= 0; i--) {
					var cList = ((list[i].sideField === vm.objectInfo.FactionA.sideField) ? "a" : "b");
					rObj[cList].push(list[i]);
				}
				return rObj;
			}

			function checkNegotiationFreelancer(negotiations, unit) {
				for (var i = negotiations.length - 1; i >= 0; i--) {
					if (unit.hashField === negotiations[i].Freelancer.hashField) return true;
				}
				return false;
			}

			function findExistingContract(callback) {
				if (angular.isUndefinedOrNull(vm.selfInfo.playerPrestige)) {
					vm.missionSigned = false;
					return callback(true);
				} else {
					missionsServices.getContractsSelf({ qSimpleMode: true }).then(function(contracts) {
						var dContracts = (contracts.data || []);
						for (var i = dContracts.length - 1; i >= 0; i--) {
							if (dContracts[i].MissionId === vm.objectInfo.id) vm.missionSigned = dContracts[i];
						}
						return callback(true);
					});
				}
			}

			function updateParticipantSlots() {
				return $q(function(resolve, reject) {
					missionsServices.getMissionParticipants(vm.objectInfo.hashField).then(function(participants) {
						vm.objectInfo.signedUnits = participants;
						vm.objectInfo.totalUnits = totalUnits();
						refreshContractStatus();

						resolve(true);
					});
				});
			}

			function findExistingInterest(callback) {
				if (!(vm.selfInfo.playerPrestige) || vm.selfInfo.PMC) {
					vm.missionInterest = false;
					return callback(true);
				} else {
					missionsServices.getInterestsSelf().then(function(interests) {
						var dInterests = interests.data;
						for (var i = dInterests.length - 1; i >= 0; i--) {
							if (dInterests[i].MissionId === vm.objectInfo.id) vm.missionInterest = dInterests[i];
						}
						return callback(true);
					});
				}
			}

			function getDefaultMissionButton(faction) {
				return {
					errorMsg: { text: "", icon: "", hide: true },
					buttonProp: { text: "Sign Contract", icon: "ion-compose", func: vm.openMissionContract }
				};
			}

			function canSignMission(faction) {
				var defaultReason = getDefaultMissionButton(faction),
					upgradeStatus = vm.validateFactionUpgrades(faction).status,
					takenSlots = (vm.selfInfo.PMC ? vm.pmcInfo.totalPlayers : 1),
					factionLetter = ((faction.sideField === vm.objectInfo.FactionA.sideField) ? "a" : "b"),
					noSlotsLeft = (((vm.objectInfo.Objective.unitLimit - vm.objectInfo.signedUnits[factionLetter]) - takenSlots) < 0);

				switch (true) {
					case (!(apiServices.getToken())): {
						return {
							errorMsg: {
								text: "You must be logged in to sign for Missions.",
								icon: "ion-android-alert"
							},
							buttonProp: { hide: true, text: "", icon: "", func: function(){}, btnClass: "" }
						};
					} break;
					case (!(apiServices.isValidAlignment(vm[vm.selfProperties.main][vm.selfProperties.side], faction.sideField))) : {
						return {
							errorMsg: {
								text: "Incompatible Side Alignment.",
								icon: "ion-android-alert"
							},
							buttonProp: { hide: true, text: "", icon: "", func: function(){}, btnClass: "" }
						};
					} break;

					case (!(vm.selfInfo.PMC) && (vm.selfInfo.contractType === 2)): {
						return {
							errorMsg: { text: "", icon: "", hide: true },
							buttonProp: {
								text: (vm.missionInterest ? ("Edit/Cancel Interest (" + vm.missionInterest.percentField + "%)") : "Mark Interest"),
								icon: (vm.missionInterest ? "ion-edit" : "ion-star"),
								func: openMissionInterest,
								btnClass: (vm.missionInterest ? "warning" : "")
							}
						};
					} break;

					case (!(vm.selfInfo.PMC) && (vm.selfInfo.contractType === 1)): {
						return {
							errorMsg: {
								text: "Unemployed Soldiers cannot join Missions.",
								icon: "ion-android-alert"
							},
							buttonProp: { hide: true, text: "", icon: "", func: function(){}, btnClass: "" }
						};
					} break;

					case ((!_.isObject(vm.missionSigned)) && noSlotsLeft): {
						return {
							errorMsg: {	text: "No slots left for this Faction.", icon: "ion-android-alert" },
							buttonProp: { hide: true, text: "", icon: "", func: function(){}, btnClass: "" }
						};
					} break;

					case ((!_.isObject(vm.missionSigned)) && upgradeStatus > 0): {
						return {
							errorMsg: {
								text: ["There are required Upgrades missing.", "There are conflicting Upgrades."][(upgradeStatus - 1)],
								icon: "ion-close-circled"
							},
							buttonProp: {
								text: "Show Upgrades",
								icon: "ion-flash-off",
								func: function(faction, side) { vm.displayUpgrades[side] = !(vm.displayUpgrades[side]); },
								btnClass: "warning"
							}
						};
					} break;

					case (_.isObject(vm.missionSigned) && (vm.missionSigned.sideField === faction.sideField)): {
						return {
							errorMsg: { text: "", icon: "", hide: true },
							buttonProp: {
								text: "Cancel Contract",
								icon: "ion-close-circled",
								func: openMissionContractCancel,
								btnClass: "warning"
							}
						};
					} break;

					case (_.isObject(vm.missionSigned)): {
						return {
							errorMsg: {
								text: "You already have a Contract in this Mission.",
								icon: "ion-alert-circled"
							},
							buttonProp: { hide: true, text: "", icon: "", func: function(){}, btnClass: "" }
						};
					} break;
				}
				return defaultReason;
			}

			function refreshContractStatus() {
				if (!vm.contractStatus) vm.contractStatus = {};
				vm.contractStatus.a = canSignMission(vm.objectInfo.FactionA);
				vm.contractStatus.b = canSignMission(vm.objectInfo.FactionB);
				navServices.callEvent("refreshOperationCount");
			}

			function openMissionContract(faction) {
				operationsServices.startMissionContract(getModalObject(vm.objectInfo, { faction: faction })).then(function(data) {
					if (data) {
						vm[vm.selfProperties.main][vm.selfProperties.side] = faction.sideField;
						vm.missionSigned = data;
						vm.refreshContractStatus();
					}
				});
			}

			function startMissionNegotiation(player) {
				var newNegotiation = { Outfit: vm.pmcInfo, Freelancer: player, Mission: vm.objectInfo };

				operationsServices.handleMissionNegotiation(getModalObject(newNegotiation, {}, "negotiation")).then(function(data) {
					if (data) {
						vm.missionSigned = data;
						vm.refreshContractStatus();
						changeTab(vm.currentTab);
					}
				});
			}

			function openMissionContractCancel(faction) {
				var modalObject = getModalObject(vm.missionSigned, { faction: faction });

				operationsServices.openMissionContractCancel(modalObject).then(function(data) {
					if (data) {
						vm.missionSigned = false;
						vm.refreshContractStatus();
						if (data.mission_deleted) return $state.go("app.public.missions");
					}
				});
			}

			function openMissionInterest(faction) {
				operationsServices.modifyInterest(getModalObject(vm.objectInfo, { faction: faction }, "interest")).then(function(data) {
					if (data.success) {
						switch(data.choice) {
							case 1: {
								vm.missionInterest = false;
							} break;
							case 2: {
								var interestData = data.interest;
								vm.missionInterest = {
									MissionId: interestData.MissionId,
									percentField: interestData.percentField,
									sideField: interestData.sideField
								};
							} break;
						}
						vm.refreshContractStatus();
					}
				});
			}

			function getModalObject(object, data, mode) {
				var rV = {
					contract: (object.selfContract || object),
					mission: object.Mission,
					selfInfo: vm.selfInfo,
					pmcInfo: vm.pmcInfo
				};
				switch(mode) {
					case "negotiation": {
						rV.contract.hashField = object.Mission.hashField;
						rV.contract.sideField = object.Freelancer.sideField;
						rV.contract.data = "";
					} break;
					case "interest": {
						rV.contract = vm.missionInterest;
						rV.mission = object;
						rV.faction = data.faction;
					} break;
					default: {
						rV.faction = data.faction;
					} break;
				}
				return rV;
			}

			function initializeMinuteLoop() {
				vm.objectInfo.timeLeft = vm.getMissionTimeElapsed(vm.objectInfo);
				$timeout((1000 * 60)).then(vm.initializeMinuteLoop);
			}

			function updateWindowTitle() {
				uiServices.updateWindowTitle([vm.objectInfo[vm.objectSettings.name_property], vm.objectSettings.name]);
			}

			function getRatingIcon(r) {
				return (r <= vm.objectInfo.Objective.difficultyField ? 'ion-ios-star' : 'ion-ios-star-outline');
			}

			function validateFactionUpgrades(faction) {
				var ownedUpgrades = selfUpgrades, i, j, mUpgrade, cUpgrade;

				if ((faction.blacklistedUpgrades.length === 0) && (faction.requiredUpgrades.length === 0)) return { status: 0 };
				if (ownedUpgrades === 0) return { status: 1 };

				if (faction.blacklistedUpgrades.length > 0) if ((checkOwnedUpgrade(faction.blacklistedUpgrades, 2))) return { status: 2 };
				if (faction.requiredUpgrades.length > 0) if ((checkOwnedUpgrade(faction.requiredUpgrades, 1))) return { status: 1 };

				return { status: -1 };
			}

			function checkSingleUpgrade(upgrade, mode) {
				var ownedUpgrades = vm.selfUpgrades, j, mUpgrade,
					checkFunction = ((mode === 1) ? _.lt : _.gte),
					neutralClass = "success",
					failedClass = ((mode === 1) ? "pulse-background-color-warning-fast" : "pulse-background-color-black-fast");

				for (j in ownedUpgrades)
					if (ownedUpgrades[j].hashField === upgrade.hashField) { mUpgrade = ownedUpgrades[j]; break; }

				if (mUpgrade) {
					var passedCheck = checkFunction(mUpgrade.owned_upgrades.rankField, upgrade.Rank);
					return {
						currentRank: mUpgrade.owned_upgrades.rankField,
						class: (passedCheck ? failedClass : neutralClass)
					};
				} else { return { currentRank: "-", class: ((mode === 1) ? failedClass : neutralClass) }; }
			}

			function checkOwnedUpgrade(upgrade, mode) {
				var ownedUpgrades = vm.selfUpgrades, i, j, mUpgrade, cUpgrade,
					checkFunction = ((mode === 1) ? _.lt : _.gte);

				if (upgrade.length > 0) {
					for (i in upgrade) {
						cUpgrade = upgrade[i];
						mUpgrade = null;

						for (j in ownedUpgrades) {
							if (ownedUpgrades[j].hashField === cUpgrade.hashField) { mUpgrade = ownedUpgrades[j]; break; }
						}

						if ((!mUpgrade) && (mode === 1)) return true;
						if (mUpgrade) {
							if (checkFunction(mUpgrade.owned_upgrades.rankField, cUpgrade.Rank)) return true;
						}
					}
					return false;
				}
			}

			function displayProperty(property) {
				var fProperty = (vm.objectInfo[property.model_property]);
				switch (property.type) {
					case "indexed": {
						if (property.array_source_property) {
							fProperty = vm[property.array_source][vm.objectInfo[property.model_property]][property.array_source_property];
						} else { fProperty = vm[property.array_source][vm.objectInfo[property.model_property]]; }
					} break;
					case "find_indexed": {
						fProperty = vm[property.array_source][apiServices.findIndexInObject(vm[property.array_source], 'data', vm.objectInfo[property.model_property])];
						if (!(fProperty)) { fProperty = "None"; } else { fProperty = fProperty[property.array_source_property]; }
					} break;
				}
				fProperty = (fProperty ? fProperty : property.null_value);
				return (property.append[0] + fProperty + property.append[1]);
			}

			function generateLink(property, value) {
				if (vm.objectInfo[value]) {
					return (vm.objectSettings.image_folder + "?" + property + "=" + vm.objectInfo[value]);
				} else { return vm.objectSettings.image_folder; }
			}
		}

	}

	exports.function = ObjectControllerFunction;
})();