(function() {
	'use strict';

	DashboardControllerFunction.$inject = [
		"$rootScope", "$scope", "$stateParams", "$state", "$location", "$timeout",
		'apiServices', 'generalServices',
		'playerServices', 'pmcServices',
		'dashboardServices', 'alertsServices', 'uiServices',
		"playerInfo", 'unitsServices', 'upgradesServices'
	];

	function DashboardControllerFunction($rootScope, $scope, $stateParams, $state, $location, $timeout, apiServices, generalServices, playerServices, pmcServices, dashboardServices, alertsServices, uiServices, playerInfo, unitsServices, upgradesServices) {
		var vm = this, i,
			menuItem = dashboardServices.menuItem,
			statsItem = dashboardServices.statsItem
		;

		vm.playerInfo = playerInfo;
		vm.pmcInfo = {};
		vm.unitsInfo = {};
		vm.friendsList = {};

		vm.activeView = '';
		vm.activeTab = '';
		vm.currentUnitsView = 0;

		vm.changeUnitsTab = changeUnitsTab;
		vm.changeActiveView = changeActiveView;
		vm.currentViewHTML = "";
		vm.displayView = false;
		vm.displayTab = false;
		vm.uploadAvatarView = 'view';
		vm.longAvatarView = false;

		vm.file = [];
		vm.filePMC = [];
		vm.croppedDataUrl = "";

		vm.editField = dashboardServices.editFieldPlayer;
		vm.editFieldPMC = dashboardServices.editFieldPMC;

		vm.editPlayerRegion = editPlayerRegion;
		vm.editOutfitRegion = editOutfitRegion;

		vm.uploadAvatar = uploadAvatar;
		vm.uploadAvatarPMC = uploadAvatarPMC;

		vm.viewAvatarUpload = viewAvatarUpload;
		vm.changeActiveTab = changeActiveTab;
		vm.changeValue = changeValue;
		vm.changeValuePMC = changeValuePMC;

		vm.displayContract = apiServices.displayContract;
		vm.suggestedTags = apiServices.suggestedOutfitTags;

		vm.reloadSelfInventoryCb = reloadSelfInventoryCb;
		vm.reloadSelfInventory = reloadSelfInventory;

		vm.nullCbFunction = apiServices.nullCbFunction;

		vm.inArray = apiServices.inArray;
		vm.numberToArray = apiServices.numberToArray;

		vm.addTag = addTag;

		vm.togglePrivacySetting = togglePrivacySetting;
		vm.toggleOutfitPrivacySetting = toggleOutfitPrivacySetting;

		vm.savePrivacySettings = savePrivacySettings;
		vm.checkForChanges = checkForChanges;

		vm.saveOutfitPrivacySettings = saveOutfitPrivacySettings;
		vm.checkForOutfitChanges = checkForOutfitChanges;

		vm.resetAllPrivacy = resetAllPrivacy;
		vm.undoPrivacyChanges = undoPrivacyChanges;

		// =============================================

		var
		sidebarFunctions = {
			player: function(_cb) {
				vm.visibilitySettings = getVisibilityOptions("player");

				vm.currentPrivacy = { selectedVisibilityIndex: 0, currentPrivacySettings: [] };

				vm.currentPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.playerInfo.privateVisibility);
				vm.currentPrivacy.currentPrivacySettings = _.union([], vm.playerInfo.privateFields);

				return _cb(true);
			},
			pmc: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					pmcServices.getSelfPMC().then(function(v) {
						vm.pmcInfo = v[0];
						vm.optionValues.open_applications = (vm.pmcInfo.open_applications === 1);

						vm.currentOutfitPrivacy = { selectedVisibilityIndex: 0, currentPrivacySettings: [] };

						vm.visibilitySettings = getVisibilityOptions("outfit");

						vm.currentOutfitPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.pmcInfo.private_visibility, true);
						vm.currentOutfitPrivacy.currentPrivacySettings = _.union([], vm.pmcInfo.private_fields);

						return _cb(true);
					});
				} else { return _cb(false); }
			},
			units: function(_cb) { return _cb(true); },
			inventory: function(_cb) {
				return vm.reloadSelfInventoryCb(function(result) { return _cb(result); });
			},
			settings: function(_cb) { // remove all of this
				playerServices.getSettingsSelf().then(function(settings) {
					if (settings) {
						playerServices.getMachineName().then(function(machine) {
							vm.currentMachine = machine;
							vm.currentSettings = settings;
							return _cb(true);
						});
					} else { return _cb(true); }
				});
			},
			upgrades: dashboardSubCtrlUpgrades,
			home: dashboardSubCtrlHome
		},
		unitsMenuFunctions = {
			friends: function(_cb) {
				playerServices.getFriendsSelf().then(function(f) {
					vm.friendsList = f;
					return _cb(true);
				});
			},
			units: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					sidebarFunctions.pmc(function() {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							vm.unitsInfo = v;
							return _cb(true);
						});
					});
				} else { return _cb(false); }
			},
			outfits: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					pmcServices.getFriendsSelf().then(function(p) {
						vm.friendsPMCList = p;
						return _cb(true);
					});
				} else { return _cb(false); }
			}
		};

		vm.optionValues = {
			value1: false,
			value2: true,
			open_applications: (vm.pmcInfo ? (vm.pmcInfo.open_applications) : false)
		};

		vm.sideBarItems = [
			new menuItem('home', 'home', sidebarFunctions.home),
			new menuItem('operator', 'person', sidebarFunctions.player),
			new menuItem('outfit', 'ios-people', sidebarFunctions.pmc),
			new menuItem('allies', 'star', sidebarFunctions.units),
			new menuItem('upgrades', 'flash', sidebarFunctions.upgrades),
			new menuItem('inventory', 'ios-filing', sidebarFunctions.inventory)
		];

		// new menuItem('settings', 'ios-settings-strong', sidebarFunctions.settings)

		vm.statsItems = [
			new statsItem('Current Funds', 'card', 'currentFunds'),
			new statsItem('Successful Missions', 'trophy', 'missionsWonNum'),
			new statsItem('Failed Missions', 'close', 'missionsFailedNum')
		];

		vm.unitsRadialOptions = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: true,
			items: [
				{content: 'Kick', icon: 'ion-close', tooltip: 'Removes the Operator from the Outfit.',
				 condition: checkRank, function: kickUnitPlayer },
				{content: 'Promote', icon: 'ion-star', tooltip: 'Promotes the Operator to the next Rank.',
				 condition: checkPromote, function: promoteUnitPlayer },
				{content: 'Demote', icon: 'ion-ios-star-half', tooltip: 'Demotes the Operator to the previous Rank.',
				 condition: checkDemote, function: demoteUnitPlayer }
			]
		};

		vm.unitsRadialOptionsFriends = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: true,
			items: [
				{ content: 'Unfriend', icon: 'ion-minus', tooltip: 'Removes the Operator from your friends list.',
				  function: removeFriend }
			]
		};

		vm.unitsRadialOptionsPMCFriends = { isOpen: false, toggleOnClick: true,	enableDefaults: true,
			items: [
				{ content: 'End alliance', icon: 'ion-minus', tooltip: 'Dissolves the current Alliance with this Outfit.',
				  function: removeAlly }
			]
		};

		vm.operatorPrivacySettings = [
			{ value: "createdAt", icon: "ion-calendar", name: "Join date", hint: "The date your account was created." },
			{ value: "contractType", icon: "ion-document-text", name: "Contract Type", hint: "Your current type of contract, eg. Soldier" },
			{ value: "bioField", icon: "ion-more", name: "About", hint: "Your current description/about." },
			{ value: "locationField", icon: "ion-earth", name: "Location", hint: "Your given location." },
			{ value: "tagsField", icon: "ion-pricetags", name: "Tags", hint: "Your current tags." },
			{ value: "blockUpgrades", icon: "ion-flash", name: "Upgrades", hint: "Your featured Upgrades." },
			{ value: "missionsWonNum", icon: "ion-trophy", name: "Missions Won", hint: "How many missions you've succeeded at." },
			{ value: "missionsfailedNum", icon: "ion-close", name: "Missions Failed", hint: "How many missions you've failed." },
			{ value: "playerTier", icon: "ion-university", name: "Tier", hint: "Your current tier relative to your contract." },
			{ value: "playerStatus", icon: "ion-information", name: "Status", hint: "Your current combat status/availability." },
			{ value: "playerPrestige", icon: "ion-star", name: "Prestige", hint: "Your current prestige level." },
			{ value: "playerPrivilege", icon: "ion-wand", name: "Permissions", hint: "Your current administrative permissions." },
			{ value: "steamIDField", icon: "ion-steam", name: "Steam ID", hint: "The Steam ID associated with your account." },
			{ value: "PMC", icon: "ion-ios-people", name: "Outfit", hint: "The outfit you're currently contracted with." },
			{ value: "hideComments", icon: "ion-chatbubbles", name: "Hide Comments", hint: "Your current comments posted by other users." },
			{ value: "blockComments", icon: "ion-chatbubble-working", name: "Block Comments", hint: "Do not allow comments to be posted." },
			{ value: "blockMessages", icon: "ion-email", name: "Block Messages", hint: "Do not allow private messages to be sent to you." },
			{ value: "blockInvites", icon: "ion-paper-airplane", name: "Block Invites", hint: "Do not allow invites to be sent to you." }
		];

		vm.outfitPrivacySettings = [
			{ value: "createdAt", icon: "ion-calendar", name: "Creation date", hint: "The date your Outfit was created." },
			{ value: "bio", icon: "ion-more", name: "About", hint: "The Outfit's current description/about." },
			{ value: "motto", icon: "ion-ios-chatbubble", name: "Motto", hint: "The Outfit's motto." },
			{ value: "tags", icon: "ion-pricetags", name: "Tags", hint: "Your Outfit's tags." },
			{ value: "missions_won", icon: "ion-trophy", name: "Missions Won", hint: "How many missions the Outfit has succeeded at." },
			{ value: "missions_failed", icon: "ion-close", name: "Missions Failed", hint: "How many missions the Outfit has failed." },
			{ value: "blockUpgrades", icon: "ion-flash", name: "Upgrades", hint: "Your featured Upgrades." },
			{ value: "location", icon: "ion-earth", name: "Location", hint: "Your Outfit's location." },
			{ value: "prestige", icon: "ion-star", name: "Prestige", hint: "The Outfit's Prestige Rank." },
			{ value: "funds", icon: "ion-card", name: "Funds", hint: "How much money the Outfit has got." },
			{ value: "hideUnits", icon: "ion-person-stalker", name: "Hide Units", hint: "Hides the units in this Oufit." },
			{ value: "size", icon: "ion-qr-scanner", name: "Capacity", hint: "The Outfit's unit capacity." },
			{ value: "totalPlayers", icon: "ion-ios-people", name: "Unit count", hint: "Total amount of units in the Outfit." },
			{ value: "hideComments", icon: "ion-chatbubbles", name: "Hide Comments", hint: "Your current comments posted by other users." },
			{ value: "blockComments", icon: "ion-chatbubble-working", name: "Block Comments", hint: "Do not allow comments to be posted." },
			{ value: "blockInvites", icon: "ion-paper-airplane", name: "Block Invites", hint: "Do not allow invites to be sent to the Oufit." }
		];

		getRegions();

		// =============================================

		function dashboardSubCtrlHome(cb) {
			initializeCtrl(cb);

			// =====================================================

			vm.getEntityProperties = getEntityProperties;

			vm.displayContract = apiServices.displayContract;
			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.getSideName = apiServices.getSideName;
			vm.displayContract = apiServices.displayContract;
			vm.getSuccessRatio = getSuccessRatio;
			vm.askClaimNetworth = askClaimNetworth;
			vm.resetSideAlignment = resetSideAlignment;
			vm.upgradePMCSize = upgradePMCSize;
			vm.upgradePrestigeRank = upgradePrestigeRank;
			vm.hasFunds = hasFunds;

			function initializeCtrl(cb) {
				initializeVariables(function() {
					return cb(true);
				});
			}

			function initializeVariables(cb) {
				vm.viewData = {};

				getEntitymodel(function(entity) {
					vm.entityInfo = entity;
					vm.conditionsInfo = setConditions();
					vm.viewData.suggestedActions = getSuggestedActions();
					vm.viewData.UI = getInterfaceValues();
					setUpgradeSizeCost();
					setPrestigeRankUpCost();

					return cb(true);
				});
			}

			function hasFunds(amount) { return ((getEntityProperties('funds') - amount) > 0); }

			function setUpgradeSizeCost() {
				if (vm.playerInfo.PMC) {
					pmcServices.getPMCSizeCost().then(function(cost) { vm.viewData.outfitUpgradeCost = Math.floor(cost); });
				}
			}

			function setPrestigeRankUpCost() {
				generalServices.getPrestigeRankCost().then(function(cost) { vm.viewData.prestigeRankUpCost = Math.floor(cost); });
			}

			function askClaimNetworth() {
				dashboardServices.askClaimNetworth(vm.playerInfo.networthField).then(function(data) {
					if (data) {
						vm.playerInfo.networthField = data.networth;
						var fundProp = ["currentFunds", "funds"][(vm.conditionsInfo.hasPMC ? 1 : 0)];
						vm.entityInfo[fundProp] = data.funds;
					}
				});
			}

			function resetSideAlignment() {
				dashboardServices.resetSideAlignment().then(function(data) {
					if (data) {
						var fundProp = ["sideField", "side"][(vm.conditionsInfo.hasPMC ? 1 : 0)];
						vm.entityInfo[fundProp] = 0;
					}
				});
			}

			function upgradePMCSize() {
				dashboardServices.upgradePMCSize(vm.viewData.outfitUpgradeCost).then(function(response) {
					if (response.valid) {
						var fundProp = ["currentFunds", "funds"][(vm.conditionsInfo.hasPMC ? 1 : 0)];
						vm.entityInfo[fundProp] = (response.currentFunds - response.neededFunds);
						vm.playerInfo.PMC.size++;
						setUpgradeSizeCost();
					}
				});
			}

			function upgradePrestigeRank() {
				dashboardServices.upgradePrestigeRank(vm.viewData.prestigeRankUpCost).then(function(response) {
					if (response.valid) {
						var enIndx = [(vm.conditionsInfo.hasPMC ? 1 : 0)],
							fundProp = ["currentFunds", "funds"][enIndx],
							rankProp = ["playerPrestige", "prestige"][enIndx];
						vm.entityInfo[fundProp] = (response.currentFunds - response.neededFunds);
						vm.entityInfo[rankProp]++;
						setPrestigeRankUpCost();
					}
				});
			}

			function openRedeemCodeModal() {
				dashboardServices.modalRedeemCode().then(function(d) {
					if (d.privilegeField < vm.playerInfo.playerPrivilege) {
						alertsServices.addNewAlert("success", "Permission privileges updated.");
					}
				});
			}

			function getSuccessRatio() {
				var winRate = getEntityProperties('missionsWon'),
					lossRate = getEntityProperties('missionsFailed');
				return Math.floor((winRate / (winRate + lossRate)) * 100);
			}

			function getEntitymodel(cb) {
				if (vm.playerInfo.PMC) {
					pmcServices.getSelfPMC().then(function(v) {
						vm.playerInfo.PMC = v[0];
						generalServices.getPMCTiers(vm.playerInfo.PMC.hashField).then(function(data) {
							vm.viewData.tierName = (data[0].tier_names[vm.playerInfo.playerTier]);
							return cb(v[0]);
						});
					});
				} else { return cb(vm.playerInfo); }
			}

			function getEntityProperties(prop) {
				var iV = (vm.conditionsInfo.hasPMC ? 1 : 0);
				return vm.entityInfo[{
					funds: ["currentFunds", "funds"],
					side: ["sideField", "side"],
					missionsWon: ["missionsWonNum", "missions_won"],
					missionsFailed: ["missionsFailedNum", "missions_failed"],
					prestige: ["playerPrestige", "prestige"]
				}[prop][iV]];
			}

			function getInterfaceValues() {
				var iV = (vm.conditionsInfo.hasPMC ? 1 : 0);
				return {
					infoEntity: ["Freelancer", "Outfit"][iV],
					infoIcon: ["ion-ios-person", "ion-ios-people"][iV],
					tooltip: {
						prestige: [
							"The Prestige Rank determines your status as a Freelancer.",
							"The Prestige Rank determines your Outfit's status within the system."
						][iV],
						funds: [
							"Your current financial balance.",
							"The current financial balance, shared between authorized Outfit members."
						][iV],
						side: [
							"Your alignment relating tto the global factions.",
							"Your Outfit's alignment relating to the global factions."
						][iV]
					}
				};
			}

			function setConditions() {
				var player = vm.playerInfo,
					hasPMC = (player.PMC),
					isUnemployedSoldier = ((!hasPMC) && (player.contractType === 1)),
					canHire = ((hasPMC) && (player.PMC.open_applications) && (player.PMC.totalPlayers < player.PMC.size));

				return {
					hasPMC: hasPMC,
					isUnemployedSoldier: isUnemployedSoldier,
					canHire: canHire
				};
			}

			function getSuggestedActions() {
				return [
					{
						title: "Edit Content", icon: "ion-ios-box",
						description: "Manage or create available content.",
						enable: true,
						route: "app.admin.menu({'menu':'content'})",
						display: apiServices.validatePrivilege(vm.playerInfo, 1)
					},
					{
						title: "Reports & Bans", icon: "ion-alert-circled",
						description: "View unresolved reports and active bans.",
						enable: true,
						route: "app.admin.menu({'menu':'reports'})",
						display: apiServices.validatePrivilege(vm.playerInfo, 2)
					},
					{
						title: "Operations",
						description: "View your mission related contracts and negotiations.",
						icon: "ion-clipboard",
						route: "app.private.operations",
						enable: true,
						display: true
					},
					{
						title: "Inbox",
						description: "Check your messages and invitations.",
						icon: "ion-email",
						route: "app.private.messages",
						enable: true,
						display: true
					},
					{
						title: "Find Outfits",
						description: "Search for an Outfit that is currently hiring.",
						icon: "ion-ios-people",
						route: "app.public.view-outfits({'open':'true'})",
						enable: true,
						display: vm.conditionsInfo.isUnemployedSoldier,
						class: "success"
					},
					{
						title: "Hire Soldiers",
						description: "Search for unemployed Soldiers who are looking to join an Outfit.",
						icon: "ion-person-add",
						route: "app.public.view-operators({'contract':1,'unemployedOnly':'true'})",
						enable: true,
						display: vm.conditionsInfo.canHire,
						class: "success"
					},
					{
						title: "Redeem Key",
						description: "Redeem issued access keys.",
						icon: "ion-key",
						fn: openRedeemCodeModal,
						enable: true,
						display: true
					}
				];
			}

		}

		function dashboardSubCtrlUpgrades(_cb) {
			vm.upgradesSettings = { queryKind: 0, showFreeSlots: true, queryText: "" };
			vm.ownedUpgrades = {};

			vm.prominenceClass = upgradesServices.setProminenceClass;
			vm.rankComplete = upgradesServices.getRankComplete;

			vm.resetAllVisibility = resetAllVisibility;
			vm.toggleProminentVisible = toggleProminentVisible;

			vm.refreshSelfUpgrades = refreshSelfUpgrades;

			vm.callUpgradeFunc = upgradesServices.invokeUpgradeModule;

			var getModalText = upgradesServices.getModalText,
				askForAction = upgradesServices.askToggleStatus;

			upgradesServices.getUpgradesData().then(function(upgrades_data) {
				vm.upgradesInfo = upgrades_data.upgradesData;

				refreshSelfUpgrades(vm.upgradesSettings.queryKind, function() {
					upgradesServices.getProminentUpgradesSelf({ qVisible: true }).then(function(owned_upgrades) {
						vm.ownedUpgrades.prominent = owned_upgrades;
						return reloadAllUpgrades({}, _cb);
					});
				});
			});

			// =====================================================

			function resetDisplayed() {
				vm.upgradesSettings.showFreeSlots = false;
				vm.upgradesSettings.showEmpty = false;
				vm.ownedUpgrades = { prominent: [], current: [] };
			}

			function toggleProminentVisible(upgrade, mode) {
				if ((mode === 1) && (upgrade.owned_upgrade.prominentField)) return false;

				askForAction(getModalText(upgrade, mode)).then(function(r) {
					if (!r) return false;
					return upgradesServices.toggleProminentVisible(
						{ upgrade: upgrade.hashField, mode: mode }, { rs: resetDisplayed, rl: reloadAllUpgrades }
					);
				});
			}

			function resetAllVisibility() {
				askForAction(getModalText([], 3)).then(function(r) {
					if (!r) return false;
					return upgradesServices.resetAllVisibility({ rs: resetDisplayed, rl: reloadAllUpgrades });
				});
			}

			function reloadAllUpgrades(data, cb) {
				refreshSelfUpgrades(vm.upgradesSettings.queryKind, function() {
					upgradesServices.getProminentUpgradesSelf({ qVisible: true }).then(function(owned_upgrades) {
						if (owned_upgrades) {
							$timeout(function() {
								vm.ownedUpgrades.prominent = owned_upgrades;
								$timeout(function() { vm.upgradesSettings.showFreeSlots = true; }, 150);
								return (cb ? cb(true) : true);
							}, 150);
						}
					});
				});
			}

			function refreshSelfUpgrades(index, _cb) {
				vm.ownedUpgrades.current = [];
				vm.upgradesSettings.showEmpty = false;
				vm.upgradesSettings.queryKind = index;
				vm.upgradesSettings.queryText = "";

				return upgradesServices.getUpgradesSelf({ qKind: vm.upgradesSettings.queryKind }).then(function(upgrades) {
					$timeout(250).then(function() {
						vm.ownedUpgrades.current = upgrades;
						vm.upgradesSettings.showEmpty = true;

						return (_cb ? _cb(true) : true);
					});
				});
			}
		}

		function getVisibilityOptions(mode) {
			var optionsObj = [
				{ value: "everyone", icon: "ion-ios-people", name: "Everyone", hint: "Everyone will be able to see all fields in your profile." },
				{ value: "ownPMC", icon: "ion-ios-people", name: "Outfit", hint: "Only Soldiers in your Outfit will be able to see hidden fields." },
				{ value: "friends-PMC", icon: "ion-ios-people", name: "Allied Outfits", hint: "Only Soldiers in Outfits allied to yours will be able to see hidden fields." },
				{ value: "allPMC", icon: "ion-ios-people", name: "All Outfits", hint: "All Soldiers in Outfits will be able to see hidden fields." },
				{ value: "freelancers", icon: "ion-ios-people", name: "Freelancers", hint: "Only Freelancers will be able to see hidden fields." }
			];

			if (mode === "player") {
				optionsObj.splice(1, 0, { value: "friends", icon: "ion-ios-people", name: "Friends", hint: "Only your Friends will be able to see hidden fields." });
				optionsObj.splice(optionsObj.length, 0, { value: "nobody", icon: "ion-ios-people", name: "Nobody", hint: "Nobody will be able to see hidden fields." });
			}

			return optionsObj;
		}

		function getRegions() {
			generalServices.getRegions().then(function(regions) { vm.regionOptions = regions; });
		}

		function editPlayerRegion(index) {
			vm.playerInfo.locationField = index;
			vm.editField('location', index);
		}

		function editOutfitRegion(index) {
			vm.pmcInfo.location = index;
			vm.editFieldPMC('location', index);
		}

		function reloadSelfInventoryCb(_cb) {
			vm.currentInventory = [];
			vm.displayInventory = false;
			generalServices.getSelfInventory().then(function(data) {
				if (data) {
					if (data.data.success) {
						vm.currentInventory = data.data.data;
						vm.displayInventory = true;
						return _cb(true);
					} else { return _cb(false); }
				} else { return _cb(false); }
			});
		}

		function reloadSelfInventory() {
			vm.displayInventory = false;
			$timeout(150).then(function(){
				generalServices.getSelfInventory().then(function(data) {
					if (data) { if (data.data.success) {
						vm.currentInventory = data.data.data;
						vm.displayInventory = true;
					}}
				});
			});
		}

		function resetAllPrivacy(mode) {
			switch(mode) {
				case "player": { vm.currentPrivacy.currentPrivacySettings = []; } break;
				case "outfit": { vm.currentOutfitPrivacy.currentPrivacySettings = []; } break;
			}
		}

		function undoPrivacyChanges(mode) {
			switch(mode) {
				case "player": {
					vm.currentPrivacy.currentPrivacySettings = vm.playerInfo.privateFields;
					vm.currentPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.playerInfo.privateVisibility);
				} break;
				case "outfit": {
					vm.currentOutfitPrivacy.currentPrivacySettings = vm.pmcInfo.private_fields;
					vm.currentOutfitPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.pmcInfo.private_visibility, true);
				} break;
			}
		}

		function savePrivacySettings() {
			var updatedPrivacy = _.without(vm.currentPrivacy.currentPrivacySettings, "emailField");

			if (checkForChanges()) {
				playerServices.updateSelf({
					properties: updatedPrivacy,	visibility: vm.visibilitySettings[vm.currentPrivacy.selectedVisibilityIndex].value
				}).then(function(data) {
					if (data.data.success) {

						if (data.data.data.privateFields) {
							vm.currentPrivacy.currentPrivacySettings = data.data.data.privateFields;
							vm.playerInfo.privateFields = data.data.data.privateFields;
						}

						if (data.data.data.privateVisibility) {
							vm.playerInfo.privateVisibility = data.data.data.privateVisibility;
							vm.currentPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.playerInfo.privateVisibility);
						}

						alertsServices.addNewAlert("success", "Privacy settings updated.");
					}
				});
			}
		}

		function getPrivacyIndex(index, outfit) {
			var pList = ["everyone", "friends", "ownPMC", "friends-PMC", "allPMC", "freelancers", "nobody"];
			if (outfit) pList.splice(1, 1);
			return _.indexOf(pList, index);
		}

		function checkForChanges() {
			var selectedVisibility = vm.visibilitySettings[vm.currentPrivacy.selectedVisibilityIndex].value,
				changedVisibility = (selectedVisibility !== vm.playerInfo.privateVisibility),
				changedFields = (_.xor(vm.currentPrivacy.currentPrivacySettings, vm.playerInfo.privateFields).length > 0);
			return (changedVisibility || changedFields);
		}

		function saveOutfitPrivacySettings() {
			if (checkForOutfitChanges()) {
				pmcServices.updateSelfPMC({
					properties: vm.currentOutfitPrivacy.currentPrivacySettings,	visibility: vm.visibilitySettings[vm.currentOutfitPrivacy.selectedVisibilityIndex].value
				}).then(function(data) {
					if (data.data.success) {

						if (data.data.data.privateFields) {
							vm.currentOutfitPrivacy.currentPrivacySettings = data.data.data.privateFields;
							vm.pmcInfo.private_fields = data.data.data.privateFields;
						}

						if (data.data.data.privateVisibility) {
							vm.pmcInfo.private_visibility = data.data.data.privateVisibility;
							vm.currentOutfitPrivacy.selectedVisibilityIndex = getPrivacyIndex(vm.pmcInfo.private_visibility, true);
						}

						alertsServices.addNewAlert("success", "Privacy settings updated.");
					}
				});
			}
		}

		function checkForOutfitChanges() {
			var selectedVisibility = vm.visibilitySettings[vm.currentOutfitPrivacy.selectedVisibilityIndex].value,
				changedVisibility = (selectedVisibility !== vm.pmcInfo.private_visibility),
				changedFields = (_.xor(vm.currentOutfitPrivacy.currentPrivacySettings, vm.pmcInfo.private_fields).length > 0),
				hasPermissions = (vm.playerInfo.playerTier <= 1);
			return ((changedVisibility || changedFields) && hasPermissions);
		}

		function togglePrivacySetting(setting) {
			var settingIndex = _.indexOf(vm.currentPrivacy.currentPrivacySettings, setting),
				toggleFunction = (settingIndex > -1) ? _.without : _.union,
				fSetting = (settingIndex > -1) ? setting : [setting];
			vm.currentPrivacy.currentPrivacySettings = toggleFunction(vm.currentPrivacy.currentPrivacySettings, fSetting);
		}

		function toggleOutfitPrivacySetting(setting) {
			var settingIndex = _.indexOf(vm.currentOutfitPrivacy.currentPrivacySettings, setting),
				toggleFunction = (settingIndex > -1) ? _.without : _.union,
				fSetting = (settingIndex > -1) ? setting : [setting];
			vm.currentOutfitPrivacy.currentPrivacySettings = toggleFunction(vm.currentOutfitPrivacy.currentPrivacySettings, fSetting);
		}

		function removeFriend(args) {
			unitsServices.askRemoveFriend(args).then(function(data) {
				if (data) playerServices.getFriendsSelf().then(function(f) { $rootScope.$emit("unitsDirectiveReloadUnits", f); });
			});
		}

		function removeAlly(args) {
			unitsServices.askRemoveAlly(args).then(function(data) {
				if (data) pmcServices.getFriendsSelf().then(function(f) { $rootScope.$emit("unitsDirectiveReloadUnits", f); });
			});
		}

		function kickUnitPlayer(args) {
			unitsServices.askKickPlayer(args).then(function(data) {
				if (data) {
					pmcServices.getSelfPMCPlayers().then(function(v) {
						$rootScope.$emit("unitsDirectiveReloadUnits", v);
						alertsServices.addNewAlert("warning", data.data.message);
					});
				}
			});
		}

		function promoteUnitPlayer(args) {
			unitsServices.askPromotePlayer(args).then(function(data) {
				if (data) {
					if (data.data.success) {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							$rootScope.$emit("unitsDirectiveReloadUnits", v);
							alertsServices.addNewAlert("success", data.data.message);
						});
					}
				}
			});
		}

		function demoteUnitPlayer(args) {
			unitsServices.askDemotePlayer(args).then(function(data) {
				if (data) {
					if (data.data.success) {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							$rootScope.$emit("unitsDirectiveReloadUnits", v);
							alertsServices.addNewAlert("warning", data.data.message);
						});
					}
				}
			});
		}

		vm.editPMCTierNames = function(i, v) {
			var surr = _.take(vm.pmcInfo.tier_names, vm.pmcInfo.tier_names.length);
			surr[i] = v;
			return dashboardServices.editPMCTierNames('tierNames', surr, i).then(function() {
				vm.pmcInfo.tier_names[i] = v;
			});
		};
		vm.addingTagPMC = function(q) {	return vm.addingTag(q, true); };
		vm.removingTagPMC = function(q) { return vm.removingTag(q, true); };
		vm.addTagPMC = function(q) { return vm.addTag(q, true); };
		vm.addingTag = function(q, pmc) {
			var func = pmc ? vm.editFieldPMC : vm.editField,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (tags.length >= 5) {
				alertsServices.addNewAlert("warning", "Max. number of " + 5 + " tags reached.");
				return false;
			} else {
				return func('add_tags', [q.text]);
			}
		};
		vm.removingTag = function(q, pmc) {
			var func = pmc ? vm.editFieldPMC : vm.editField,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (tags.length <= 1) {
				alertsServices.addNewAlert("warning", "Min. of " + 1 + " tag required.");
				return false;
			} else {
				return func('remove_tags', [q.text]);
			}
		};

		function addTag(v, pmc) {
			var func = pmc ? vm.addingTagPMC : vm.addingTag,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (!(_.find(tags, { text: v }))) {
				if (func({text: v })) tags.push({text: v});
			}
		}

		function changeValue(v) {
			var obj = vm.optionValues, tick = function() {obj[v] = !(obj[v]);};
			tick();
			vm.editField(v, !(obj[v])).then(tick);
		}

		function changeValuePMC(v) {
			var obj = vm.optionValues, tick = function() {obj[v] = !(obj[v]);};
			tick();
			vm.editFieldPMC(v, !(obj[v])).then(tick);
		}

		function viewAvatarUpload(a) {
			vm.longAvatarView = (a === "edit");
			vm.uploadAvatarView = "";
			$timeout(function() { vm.uploadAvatarView = a; }, 500);
		}

		function uploadAvatar(d, n) {
			var infoCache = vm.playerInfo.hashField;
			vm.playerInfo.hashField = "null";
			dashboardServices.uploadAvatar(d, n, function(r) {
				viewAvatarUpload('view');
				vm.playerInfo.hashField = infoCache;
			});
		}

		function uploadAvatarPMC(d, n) {
			var infoCache = vm.pmcInfo.hashField;
			vm.pmcInfo.hashField = "null";
			dashboardServices.uploadPMCAvatar(d, n, function(r) {
				viewAvatarUpload('view');
				vm.pmcInfo.hashField = infoCache;
			});
		}

		function checkRank(a) { return unitsServices.checkRank(a, vm.playerInfo); }
		function checkPromote(a) { return unitsServices.checkPromote(a, vm.playerInfo); }
		function checkDemote(a) { return unitsServices.checkDemote(a, vm.playerInfo); }

		function findMenuIndexByName(name) {
			var rIndex = 0;
			for (var i in vm.sideBarItems) {
				if (vm.sideBarItems[i].text === name) rIndex = i;
			}
			return rIndex;
		}

		function changeUnitsTab(index) {
			if (vm.currentUnitsView !== index) {
				vm.currentUnitsView = -1;
				$timeout(function() { vm.currentUnitsView = index; }, 250);
			}
		}

		function changeActiveView(index) {
			var	view = vm.sideBarItems[index];

			if ((vm.activeView !== view.text)) {
				vm.displayView = false;

				apiServices.resolveFunction(view.f).then(function(val) {

					$('html, body').animate({ scrollTop: ($('#db-content').offset().top - 200) }, 'fast');

					dashboardServices.loadNewView(view.text).then(function(html) {
						if (html) vm.currentViewHTML = html;

						vm.activeView = view.text;

						vm.uploadAvatarView = "view";
						vm.longAvatarView = false;

						$timeout(function() {
							vm.displayView = true;
							$rootScope.$broadcast("dashboardChange", vm.activeView);
						}, 500);
					});
				}, function(val) {
					vm.displayView = true;
					var message = ((function(view) {
						switch(view.text) {
							case "operator": { return "You are not registered...?"; } break;
							case "outfit": { return "You are not part of an Outfit."; } break;
							default: { return "Failed to load menu."; }
						}
					})(view));
					alertsServices.addNewAlert("warning", message);
					changeActiveView(0);
				});
			}
		}

		function changeActiveTab(tab) {
			if ((tab === "friends") || (tab === "units") || (tab === "outfits")) {
				if ((vm.activeTab !== tab)) {
					vm.displayTab = false;

					apiServices.resolveFunction(unitsMenuFunctions[tab]).then(function(val) {
						vm.activeTab = tab;

						$timeout(function() {
							vm.displayTab = true;
							$rootScope.$broadcast("dashboardTabChange", tab);
						}, 250);
					}, function(val) {
						vm.displayTab = true;
						var message = ((function(tab) {
							switch(tab) {
								case "friends": { return "An error has occured."; } break;
								case "units": { return "You are not part of an Outfit."; } break;
								case "outfits": { return "You are not part of an Outfit."; } break;
								default: { return "An error has occured."; }
							}
						})(tab));
						alertsServices.addNewAlert("warning", message);
						changeActiveTab("friends");
					});
				}
			} else { changeActiveTab("friends"); }
		}

		(function() {
			function writeNumber(n, i, o) {
				var jO = $(".number").toArray()[n];
				if (i > 0) {
					var rI = (Math.floor(Math.random() * 100));

					$timeout(function() {
						if (i % 2 === 0) { $(jO).addClass("animate"); } else { $(jO).removeClass("animate"); }
						vm.playerInfo[vm.statsItems[n].value] = (Math.floor(Math.random() * 100));
						var i2 = (i - 1);
						writeNumber(n, i2, o);
					}, ((300 / i) + rI));
				} else {
					$(jO).addClass("animate");
					$timeout(function() {
						vm.playerInfo[vm.statsItems[n].value] = o;
						$(jO).removeClass("animate");
					}, 150);
				}
			}

			$rootScope.$on("dashboardChange", function(a, b) {
				$stateParams.page = b;
				$state.params.page = b;
				$location.search('page', b);

				if (b === "stats") {
					for (i in vm.statsItems) {
						var val = vm.playerInfo[vm.statsItems[i].value],
							oriVal = vm.playerInfo[vm.statsItems[i].value];

						writeNumber(i, 5, oriVal);
					}
				}

				if (b === "allies") {
					changeActiveTab(($stateParams.tab || vm.activeTab || 'friends'));

					$stateParams.tab = ($stateParams.tab || vm.activeTab || 'friends');
					$state.params.tab = ($stateParams.tab || vm.activeTab || 'friends');
					$location.search('tab', ($stateParams.tab || vm.activeTab || 'friends'));
				} else {
					$stateParams.tab = undefined;
					$state.params.tab = undefined;
					$location.search('tab', undefined);
				}

				$rootScope.$broadcast("updatePageTitle", (b.charAt(0).toUpperCase() + b.slice(1)) + " | Dashboard");
			});

			$rootScope.$on("dashboardTabChange", function(a, b) {
				$stateParams.tab = b; $state.params.tab = b; $location.search('tab', b);
			});

		}());

		changeActiveView(findMenuIndexByName($stateParams.page ? $stateParams.page : 'home'));
		$timeout(function() { $scope.$broadcast('rebuild');	}, 0);
	}

	exports.function = DashboardControllerFunction;
})();