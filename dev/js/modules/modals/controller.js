(function() {
	'use strict';

	ModalGenericYesNo.$inject = ['$scope', '$uibModalInstance', 'apiServices', 'parameters'];
	ModalDisplayItem.$inject = ['$scope', "$timeout", '$uibModalInstance', 'parameters'];
	ModalSendMessage.$inject = ['$scope', '$timeout', '$uibModalInstance', 'parameters'];
	ModalSendReport.$inject = ['$scope', '$timeout', '$uibModalInstance', 'parameters'];
	ModalSendInvite.$inject = ['$scope', '$timeout', '$uibModalInstance', 'parameters'];
	ModalSignContract.$inject = ['$scope', '$timeout', 'apiServices', 'missionsServices', 'operationsServices', '$uibModalInstance', 'parameters'];
	ModalConfirmPassword.$inject = ['$scope', '$uibModalInstance', 'loginServices', 'parameters'];
	ModalBanPlayer.$inject = ['$scope', '$uibModalInstance', 'parameters', "apiServices", "generalServices"];
	ModalManageImages.$inject = ['$scope', '$uibModalInstance', 'parameters', "apiServices", "generalServices", "adminServices", "alertsServices"];
	ModalRedeemCode.$inject = ['$scope', '$uibModalInstance', 'parameters', 'generalServices'];

	function ModalManageImages($scope, $uibModalInstance, parameters, apiServices, generalServices, adminServices, alertsServices) {
		var vm = this;
		vm.options = parameters;

		vm.imageChange = imageChange;
		vm.uploadPicture = uploadPicture;
		vm.deleteImageinFolder = deleteImageinFolder;
		vm.selectImage = selectImage;
		vm.resetSelectedImage = resetSelectedImage;
		vm.checkSelected = checkSelected;
		vm.checkInputExists = checkInputExists;
		vm.allowForUpload = allowForUpload;
		vm.getCharLimitClass = getCharLimitClass;
		vm.applyFilenameFilter = applyFilenameFilter;

		initializeValues();
		refreshFolderList();

		vm.selectedImage = vm.options.currentImage;

		function initializeValues() {
			vm.currentUploadedImage = {};
			vm.cachedImage = [];
			vm.currentUploadName = "";
			vm.selectedImage = "";
			vm.selectedImageIndex = -1;
			vm.imageSearchFilter = "";
		}

		function selectImage(name) {
			if (name === vm.selectedImage) { vm.selectedImage = ""; } else { vm.selectedImage = name; }
		}

		function checkSelected(name) { return (name === vm.selectedImage); }

		function resetSelectedImage() {
			vm.cachedImage = [];
			vm.currentUploadedImage = {};
			vm.currentUploadName = "";
		}

		function deleteImageinFolder(name) {
			var rParams = {folder: "modules", type: (vm.options.type + "s"), id: name, extension: vm.options.extension};
			adminServices.deleteImageinFolder(rParams).then(function(data) {
				if (data) { if (data.data.success) {
					selectImage(name);
					refreshFolderList();
				}}
			});
		}

		function refreshFolderList() {
			vm.currentFolderImages = [];
			adminServices.getImagesInFolder({folder: "modules", type: (vm.options.type + "s")}).then(function(data) {
				if (data) { if (data.data.success) vm.currentFolderImages = data.data.data; }
			});
		}

		function uploadPicture() {
			return adminServices.uploadModulePicture(vm.options.type, vm.currentUploadName, vm.currentUploadedImage).then(function(data) {
				var dMessage = ["success", "Object picture uploaded."];
				if (!data.data.success) dMessage = ["warning", data.data.message];
				alertsServices.addNewAlert(dMessage[0], dMessage[1]);
				initializeValues();
				refreshFolderList();
			});
		}

		function allowForUpload() {
			var sizeLimit = vm.options.filenameLimit,
				currentSize = vm.currentUploadName.length;
			return ((vm.currentUploadName === "") || ((currentSize < sizeLimit.min) || (currentSize > sizeLimit.max)));
		}

		function applyFilenameFilter(value) {
			if (vm.options.filenameFilter) vm[value] = vm.options.filenameFilter(vm[value]);
		}

		function getCharLimitClass(limit) {
			var sizeLimit = vm.options.filenameLimit,
				currentSize = vm.currentUploadName.length;
			return {
				good: ((limit === "min") ? (sizeLimit.min <= currentSize) : (sizeLimit.max >= currentSize)),
				bad: ((limit === "min") ? (sizeLimit.min > currentSize) : (sizeLimit.max < currentSize)),
			};
		}

		function checkInputExists() {
			for (var i in vm.currentFolderImages) { if (vm.currentFolderImages[i] === vm.currentUploadName) return true; }
			return false;
		}

		function imageChange(file) {
			if (file) {
				vm.cachedImage = file;
				vm.currentUploadName = file.name.split(".")[0];
				applyFilenameFilter("currentUploadName");
			}
		}

		$scope.closeModal = function(choice) { $uibModalInstance.close(vm.selectedImage); };
	}

	function ModalGenericYesNo($scope, $uibModalInstance, apiServices, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.isPaidFor = isPaidFor;

		vm.specialMode = (vm.options.specialMode ? vm.options.specialMode : null);

		vm.requiresPayment = !(angular.isUndefinedOrNull(vm.options.cost));
		vm.acceptPayment = false;

		if (vm.specialMode) {
			switch (vm.specialMode) {
				case "air-drop": {
					vm.dropInputs = {
						gridRef1: "054",
						gridRef2: "031",
						smokeColor: 0
					};

					vm.airDropColors = [
						{ name: "No beacons", value: "White", class: "color-white" },
						{ name: "Blue", value: "Blue", class: "color-blue" },
						{ name: "Green", value: "Green", class: "color-green" },
						{ name: "Red", value: "Red", class: "color-red" },
						{ name: "Yellow", value: "Yellow", class: "color-orange" }
					];

					vm.changeAirDropColor = function(index) { vm.dropInputs.smokeColor = index; };

				} break;
				case "eximport-loadout": {
					vm.decryptedLoadout = null;
					vm.loadoutInput = (vm.options.hashedLoadout || "");

					vm.readImports = function() {
						if (vm.loadoutInput) {
							var simpleEncrypt = new SimpleCryptoJS.default("LOADOUTKEY");
							vm.decryptedLoadout = simpleEncrypt.decryptObject(vm.loadoutInput);
						}
					};
					vm.readImports();

				} break;
			}
		}

		function isPaidFor() {
			if (!vm.requiresPayment) return true;
			return (vm.acceptPayment);
		}

		$scope.closeModal = function(choice) {
			if (choice) {
				if (vm.requiresPayment) {
					if (vm.acceptPayment) {
						if (vm.specialMode) {
							switch (vm.specialMode) {
								case "air-drop": {
									vm.dropInputs.smokeColor = vm.airDropColors[vm.dropInputs.smokeColor].value;
									$uibModalInstance.close({result: true, data: vm.dropInputs});
								} break;
							}
						} else {
							$uibModalInstance.close(true);
						}
					}
				} else {
					if (vm.specialMode) {
						switch (vm.specialMode) {
							case "eximport-loadout": {
								$uibModalInstance.close({result: true, data: vm.decryptedLoadout});
							} break;
						}
					} else { $uibModalInstance.close(true); }
				}
			} else {
				$uibModalInstance.close(false);
			}
		};
	}

	function ModalDisplayItem($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.itemDetails = vm.options.itemDetails;
		vm.itemTypes = vm.options.types;
		vm.itemClasses = vm.options.classes;
		vm.contentData = vm.options.content;

		$timeout(function() { $scope.$broadcast('itemModal:reloadDescriptionBar'); }, 1250);

		$scope.closeModal = function(choice) { $uibModalInstance.close(true); };
	}

	function ModalSignContract($scope, $timeout, apiServices, missionsServices, operationsServices, $uibModalInstance, parameters) {
		var vm = this;
		vm.displayOptions = false;

		vm.applyControlledClass = apiServices.applyControlledClass;
		vm.canCounterOffer = canCounterOffer;

		vm.options = parameters;
		vm.missionDetails = vm.options.missionDetails;
		vm.contractSide = vm.options.contractSide;
		vm.selfInfo = vm.options.selfInfo;
		vm.selfPMC = vm.options.selfPMC;
		vm.hasInterest = vm.options.interestDetails;
		vm.negotiationTarget = (vm.options.negotiationTarget || {});
		vm.negotiationDetails = normalizeNegotiation(vm.options.negotiationDetails);

		vm.clientFaction = ((vm.missionDetails.FactionA.sideField === vm.contractSide) ? vm.missionDetails.FactionA : vm.missionDetails.FactionB);
		vm.validInfo = (vm.selfInfo.PMC ? vm.selfPMC : vm.selfInfo);

		vm.selfProperties = {
			name: (vm.selfInfo.PMC ? "display_name" : "aliasField"),
			image: (vm.selfInfo.PMC ? "pmc" : "players"),
			side: (vm.selfInfo.PMC ? "side" : "sideField")
		};

		vm.ui = {
			interest: {
				details: { show_counter: true },
				model: { min: (vm.hasInterest ? vm.hasInterest.percentField : 15) },
				options: { floor: 1, ceil: 99, step: 1, translate: function(v) {return(v + "%");}}
			},
			negotiation: {
				details: {
					enable: (vm.options.mode === "negotiation"),
					turn: (vm.negotiationDetails.turnField || 0),
					round: (vm.negotiationDetails.roundField || 1),
					show_counter: false
				},
				model: { min: (vm.negotiationTarget ? (vm.negotiationTarget.percentageField || vm.negotiationDetails.percentField) : 15) },
				options: { floor: 1, ceil: 99, step: 1, translate: function(v) {return(v + "%");}}
			}
		};

		vm.modalSettings = modalSettings((vm.options.mode || 'sign'));
		vm.currentConditions = checkConditions();

		initializeModal(vm.options.mode);

		// =============================================================
		// =============================================================

		function initializeModal(mode) {
			switch(mode) {
				case "negotiation": {
					getContractLimit((vm.negotiationDetails.employer || vm.negotiationDetails.Outfit), vm.missionDetails);
				} break;
				case "sign": {
					var reward = operationsServices.getActiveFaction(vm.contractSide, vm.missionDetails);
					missionsServices.getSignatureFee().then(function(fee) {
						vm.ui.contract = {
							percentage: fee,
							finalFee: _.floor((fee * reward.faction_client.reward) / 100)
						};
					});
				} break;
			}
		}

		function normalizeNegotiation(negotiation) {
			return {
				turnField: (negotiation ? negotiation.turnField : 0),
				roundField: (negotiation ? negotiation.roundField : 0),
				employer: (negotiation ? negotiation.Outfit : vm.selfPMC),
				operator: (negotiation ? negotiation.Freelancer : vm.negotiationTarget),
				percentField: (negotiation ? negotiation.percentField : vm.negotiationTarget.percentageField)
			};
		}

		function canCounterOffer() {
			return ((vm.negotiationDetails.turnField === 0) ? (vm.selfInfo.PMC) : !(vm.selfInfo.PMC));
		}

		function getContractLimit(contractor, mission) {
			missionsServices.getContractedPercentage({ qEmployer: contractor.hashField, qMission: mission.hashField }).then(function(data) {
				vm.ui.negotiation.options.ceil = (99 - data.data.percentage);
			});
		}

		function modalSettings(mode) {
			return {
				sign: {
					ui: {
						info: 0,
						header: { text: "Sign Mission Contract", icon: "ion-compose" },
						ok: { class: "success", icon: "ion-android-checkbox-outline", text: "Confirm" }
					}
				},
				cancel: {
					ui: {
						info: 0,
						header: { text: "Cancel Mission Contract", icon: "ion-backspace" },
						ok: { class: "warning", icon: "ion-alert-circled", text: "Cancel" }
					}
				},
				interest: {
					ui: {
						info: 0,
						header: { text: "Mark Interest on Mission", icon: "ion-star" },
						ok: { class: "success", icon: "ion-android-checkbox-outline", text: "Confirm" }
					}
				},
				negotiation: {
					ui: {
						info: 1,
						header: { text: ("Contract Negotiation - Round " + vm.ui.negotiation.details.round), icon: "ion-arrow-swap" },
						ok: { class: "success", icon: "ion-thumbsup", text: "Accept" }
					}
				}
			}[mode];
		}

		function checkConditions() {
			var errorMessages = [
				"Your Outfit rank is insufficient to sign this Contract.",
				"Your current Side Alignment is opposed to this Faction."
			], errorIndex = (function() {
				switch (true) {
					case ((vm.selfInfo.PMC) && (vm.selfInfo.playerTier >= 3)): { return 0; } break;
					case (!(apiServices.isValidAlignment(vm.validInfo[vm.selfProperties.side], vm.contractSide))): { return 1; } break;
					default: { return -1; } break;
				}
			})();
			return {
				hasError: (errorIndex > -1),
				message: errorMessages[errorIndex],
				set_interest: ((vm.options.mode === "interest") ? (vm.options.prevInterest || 0) : 0)
			};
		}

		vm.flipNegotiation = function() {
			vm.ui[vm.options.mode].details.show_counter = !(vm.ui[vm.options.mode].details.show_counter);
		};

		vm.closeModal = function(choice) {
			var rInterest = (function(vm) {
				switch (vm.options.mode) {
					case "interest": { return vm.ui[vm.options.mode].model.min; } break;
					case "negotiation": { return vm.ui[vm.options.mode].model.min; } break;
					default: { return 0; } break;
				}
			})(vm);
			$uibModalInstance.close({ choice: choice, interest: rInterest, fee: (vm.ui.contract ? vm.ui.contract.finalFee : 0) });
		};

		// =============================================================
		// =============================================================
	}

	function ModalSendMessage($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modalTitle = "";
		vm.modalMessage = "";
		vm.currentError = "";

		vm.maxTitleCharacters = 48;
		vm.maxMessageCharacters = 1024;

		if (parameters.suggestions) {
			vm.modalTitle = (parameters.suggestions.title || "");
			vm.modalMessage = (parameters.suggestions.body || "");

			$timeout(function(){
				if (parameters.suggestions.title) $("#messageInputBody").focus();
				if (parameters.suggestions.body) $("#messageInputTitle").focus();
			}, 300);

		}

		$scope.closeModal = function(choice) {
			if (choice) {
				var titleCharactersLeft = (vm.maxTitleCharacters - vm.modalTitle.length),
					messageCharactersLeft = (vm.maxMessageCharacters - vm.modalMessage.length);

				if (
					((titleCharactersLeft >= 0) && (messageCharactersLeft >= 0)) &&
					((titleCharactersLeft !== vm.maxTitleCharacters) && (messageCharactersLeft !== vm.maxMessageCharacters))
				) {
					$uibModalInstance.close({choice: true, title: vm.modalTitle, body: vm.modalMessage, receiver: vm.options.receiver.hash});
				} else {
					vm.currentError = (function(titleLeft, messageLeft, maxTitle, maxMessage) {
						switch (true) {
							case (titleLeft < 0): { return "Your title cannot be longer than " + maxTitle + " characters!"; } break;
							case (messageLeft < 0): { return "Your message cannot be longer than " + maxMessage + " characters!"; } break;
							case (titleLeft ===  maxTitle): { return "Your title cannot be empty."; } break;
							case (messageLeft === maxMessage): { return "Your message body cannot be empty."; } break;
							default: { return "Please format your message properly."; }
						}
					})(titleCharactersLeft, messageCharactersLeft, vm.maxTitleCharacters, vm.maxMessageCharacters);

					$timeout(function() { vm.currentError = ""; }, 6000);
				}
			} else {
				$uibModalInstance.close({ choice: false });
			}

		};
	}

	function ModalSendReport($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modalTitle = "";
		vm.modalMessage = "";
		vm.currentError = "";

		vm.maxMessageCharacters = 144;

		vm.currentReportIndex = 0;

		vm.contextData = (function(content) {
			switch(content) {
				case "player": { return {image: "images/avatars/players/", name: "Operator"}; } break;
				case "pmc": { return {image: "images/avatars/pmc/", name: "Outfit"}; } break;
				case "item": { return {image: "images/modules/items/", name: "Item"}; } break;
				case "map": { return {image: "images/modules/maps/", name: "Map"}; } break;
				case "location": { return {image: "images/modules/locations/", name: "Location"}; } break;
				case "faction": { return {image: "images/modules/factions/", name: "Faction"}; } break;
				case "objective": { return {image: "images/modules/objectives/", name: "Objective"}; } break;
				case "conflict": { return {image: "images/modules/conflict/", name: "Conflict"}; } break;
				case "mission": { return {image: "images/modules/mission/", name: "Mission"}; } break;
				case "store": { return {image: "images/modules/stores/", name: "Store"}; } break;
				case "intel": { return {image: "", name: "Intel"}; } break;
				default: { return {image: "images/avatars/players/", name: "Unit"}; } break;
			}
		})(vm.options.content);

		vm.defaultReportRules = {
			rules: {name: "Rule Violation", description: "The subject has intentionally violated any of the established rules.", type: "rules"},
			harassment: {name: "Harassment", description: "The subject has intentionally harassed or disturbed other users.", type: "harassment"},
			illegal: {name: "Illegal Content", description: "The subject has posted illegal content.", type: "illegal"},
			bug: {name: "Hacking", description: "The subject has intentionally utilized third-party tools or abused bugs.", type: "bug"},
			intelIllegal: {name: "Illegal Content", description: "This Intel contains illegal content.", type: "illegal"},
			intelRules: {name: "Rule Violation", description: "This Intel violates the rules.", type: "rules"},
			itemData: {name: "Incorrect Data", description: "Some of the information for this item is incorrect or disputable.", type: "bug"},
			itemBugged: {name: "Broken Item", description: "This item contains a game-breaking bug.", type: "rules"},
			storeItems: {name: "Malformed Inventory", description: "The items sold at this store are non-sensical or clearly incorrect.", type: "bug"},
			storeData: {name: "Incorrect Data", description: "Some of the information for this Store is incorrect or disputable.", type: "bug"},

			objectData: {name: "Incorrect " + vm.contextData.name + " Data", description: "Some of the information for this " + vm.contextData.name + " is incorrect or disputable.", type: "bug"},
			objectBugged: {name: "Broken " + vm.contextData.name, description: "This " + vm.contextData.name + " contains a game-breaking bug.", type: "rules"}
		};

		vm.reportRules = [];

		for (var i in vm.options.types) { vm.reportRules.push(vm.defaultReportRules[vm.options.types[i]]); }

		$scope.closeModal = function(choice) {
			var reportType = vm.reportRules[vm.currentReportIndex].type;

			if (choice) {
				$uibModalInstance.close({
					choice: true,
					reason: (vm.modalMessage || "No reason specified."),
					type: reportType,
					reported: vm.options.hash,
					content: vm.options.content,
					hashProperty: (vm.options.hashProperty || "hashField")
				});
			} else { $uibModalInstance.close({ choice: false }); }

		};
	}

	function ModalSendInvite($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modalMessage = "";
		vm.currentError = "";
		vm.isPaidFor = isPaidFor;

		vm.requiresPayment = !(angular.isUndefinedOrNull(vm.options.cost));
		vm.acceptPayment = false;

		function isPaidFor() {
			if (!vm.requiresPayment) return true;
			return (vm.acceptPayment);
		}

		vm.maxMessageCharacters = 144;

		vm.contextData = (function(context) {
			switch(context) {
				case "player": { return {image: "images/avatars/players/", name: "Operator"}; } break;
				case "pmc": { return {image: "images/avatars/pmc/", name: "Outfit"}; } break;
				default: { return {image: "images/avatars/players/", name: "Unit"}; } break;
			}
		})(vm.options.context);

		$scope.closeModal = function(choice) {
			var messageCharactersLeft = (vm.maxMessageCharacters - vm.modalMessage.length);
			if (choice) {
				if (messageCharactersLeft >= 0) {
					if (vm.requiresPayment) {
						if (vm.acceptPayment) $uibModalInstance.close({choice: true, note: vm.modalMessage});
					} else { $uibModalInstance.close({choice: true, note: vm.modalMessage}); }
				} else {
					vm.currentError = (function(messageLeft, maxMessage) {
						switch (true) {
							case (messageLeft < 0): { return "Your message cannot be longer than " + maxMessage + " characters!"; } break;
							default: { return "Please format your message properly."; }
						}
					})(messageCharactersLeft, vm.maxMessageCharacters);
					$timeout(function() { vm.currentError = ""; }, 6000);
				}
			} else { $uibModalInstance.close({ choice: false }); }
		};
	}

	function ModalConfirmPassword($scope, $uibModalInstance, loginServices, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modelPassword = "";

		$scope.closeModal = function(choice) {
			if (choice) {
				loginServices.confirmSelfPassword({password: vm.modelPassword}, function(data) { $uibModalInstance.close(true); });
			} else {
				$uibModalInstance.close(false);
			}
		};
	}

	function ModalRedeemCode($scope, $uibModalInstance, parameters, generalServices) {
		var vm = this;
		vm.options = parameters;
		vm.accessKeyInput = "";

		vm.redeeemKey = redeeemKey;

		function redeeemKey() {
			generalServices.redeemAccessKey(vm.accessKeyInput).then(function(data) {
				if (data) {	if (data.data.success) { $uibModalInstance.close(data.data.data); }}
			});
		}

		$scope.closeModal = function(choice) { if (!choice) $uibModalInstance.close(false); };
	}

	function ModalBanPlayer($scope, $uibModalInstance, parameters, apiServices, generalServices) {
		var vm = this, diffDays, givenReason;
		vm.options = parameters;

		if (vm.options.settings) {
			var
				todayDate = new Date(),
				banDate = new Date(vm.options.settings[1]),
				timeDiff = Math.abs(banDate.getTime() - todayDate.getTime());
			diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
			givenReason = vm.options.settings[0];
		}

		vm.banReason = (givenReason || "");
		vm.banDays = (diffDays || 1);
		vm.maxMessageCharacters = 128;

		vm.minMax = minMax;
		vm.doMax = doMax;

		function minMax(min, max, item, value) { item[value] = (apiServices.minMax(min, max, item[value]) || 999); }
		function doMax(max, item, value) { item[value] = (Math.min(item[value], max)); }

		generalServices.getPlayer(vm.options.player).then(function(playerData) {
			vm.playerData = playerData[0];

			$scope.closeModal = function(choice) {
				if (choice) {
					$uibModalInstance.close({choice: true, banned: vm.playerData.hashField, reason: vm.banReason, days: vm.banDays});
				} else { $uibModalInstance.close({choice: false});}
			};
		});
	}

	exports.ModalGenericYesNo = ModalGenericYesNo;
	exports.ModalDisplayItem = ModalDisplayItem;
	exports.ModalSendMessage = ModalSendMessage;
	exports.ModalSendReport = ModalSendReport;
	exports.ModalSendInvite = ModalSendInvite;
	exports.ModalConfirmPassword = ModalConfirmPassword;
	exports.ModalBanPlayer = ModalBanPlayer;
	exports.ModalManageImages = ModalManageImages;
	exports.ModalSignContract = ModalSignContract;
	exports.ModalRedeemCode = ModalRedeemCode;
})();