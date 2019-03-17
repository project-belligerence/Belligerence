(function() {
	'use strict';

	IntelControllerFunction.$inject = ["$scope", "$state", "$stateParams", "$timeout", "playerInfo", "intelInfo", "apiServices", "generalServices", "intelServices", "alertsServices", "fundsServices", "Upload"];

	function IntelControllerFunction($scope, $state, $stateParams, $timeout, playerInfo, intelInfo, apiServices, generalServices, intelServices, alertsServices, fundsServices, Upload) {
		var vm = this, i;

		var intelTypes = intelServices.getIntelTypes(),
			visibilityTypes = intelServices.getIntelVisibility(),
			postedAsTypes = intelServices.getIntelPostedAs();

		vm.playerInfo = playerInfo;
		vm.intelInfo = intelInfo.data[0];
		vm.hasPMC = !(angular.isUndefinedOrNull(playerInfo.PMC));

		vm.currentUploadedAvatar = [];
		vm.playerCard = {};
		vm.croppedDataUrl = "";

		vm.usingPicture = false;
		vm.changedPicture = false;
		vm.noOriginalAvatar = false;
		vm.allowForceOriginal = true;
		vm.maxFieldType = 0;
		vm.enablePriceQuery = false;
		vm.intelPrice = 0;
		vm.emptyFee = 1;

		if (vm.intelInfo.backgroundField === "own-hash") {
			apiServices.loadXHR("/images/modules/intel/main_" + vm.intelInfo.hashField + ".jpg").then(function(blob) {
	  			vm.currentUploadedAvatar = blob;
	  			vm.originalAvatar = blob;

	  			vm.noOriginalAvatar = (vm.originalAvatar.size < 2000);
				if (vm.noOriginalAvatar) { (vm.lockPicture = false); (vm.allowForceOriginal = false); }
			});
		} else { (vm.lockPicture = false); (vm.allowForceOriginal = false); }

		$scope.$watch('CtrlIntelEdit.currentUploadedAvatar', function(newValue, oldValue) {
			if (vm.formValues.backgroundField === 'uploaded-picture') {
				if (newValue !== vm.originalAvatar) { vm.changedPicture = true; calculateIntelPrice(); }
			}
		});

		if (vm.intelInfo.backgroundType === "color") {
			var customColors = vm.intelInfo.backgroundField.split("|");

			vm.customColor = customColors[0];
			vm.customIconColor = customColors[1];
		} else {
			vm.customColor = "#fff";
			vm.customIconColor = "#111";
		}

		vm.changeVisibilityType = changeVisibilityType;
		vm.changeTypeField = changeTypeField;
		vm.changePostedAsMethod = changePostedAsMethod;
		vm.changeBackgroundType = changeBackgroundType;
		vm.submitIntelForm = submitIntelForm;
		vm.checkCharactersRemaining = apiServices.checkCharactersRemaining;
		vm.findIndexInObject = apiServices.findIndexInObject;
		vm.doLockPicture = doLockPicture;

		vm.formValues = {
			titleField: vm.intelInfo.titleField,
			bodyField: vm.intelInfo.bodyField,
			visibilityField: vm.intelInfo.visibilityField,
			typeField: vm.intelInfo.typeField,
			postedAs: vm.intelInfo.displayAs,
			backgroundField: vm.intelInfo.backgroundField,
			backgroundType: ""
		};

		vm.originalIntelForm = apiServices.cloneValue(vm.intelInfo);
		vm.originalIntelForm.postedAs = (vm.formValues.postedAs);

		vm.dropdownMenu = {
			types: [],
			visibility: [],
			postedAs: [],
			background: [
				{ type: "Choose color", icon: "ion-paintbucket", value: "color" },
				{ type: "Upload picture", icon: "ion-image", value: "uploaded-picture" },
				{ type: "Operator avatar", icon: "ion-person", value: "operator-picture" },
				{ type: "Outfit emblem", icon: "ion-ios-people", value: "outfit-picture" }
			]
		};

		vm.validatorFields = {
			titleField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 50} } ], name: "Title" },
			bodyField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 2048} } ], name: "Body" },
		};

		vm.textFields = ["titleField", "bodyField"];

		for (i in intelTypes) { vm.dropdownMenu.types.push(intelServices.getTypeDetails(intelTypes[i])); }
		for (i in visibilityTypes) { vm.dropdownMenu.visibility.push(intelServices.getVisibilityDetails(visibilityTypes[i])); }
		for (i in postedAsTypes) { vm.dropdownMenu.postedAs.push(intelServices.getPostedAsDetails(postedAsTypes[i])); }

		vm.dropdownMenu.types.splice(0, 1);
		vm.dropdownMenu.types.splice(3, 1);
		vm.dropdownMenu.types.splice(2, 1);

		vm.dropdownMenu.postedAs.splice(0, 1);

		if (!vm.hasPMC) {
			vm.dropdownMenu.postedAs.splice(1, 1);

			vm.dropdownMenu.visibility.splice(2, 1);
			vm.dropdownMenu.visibility.splice(2, 1);
			vm.dropdownMenu.visibility.splice(2, 1);

			vm.dropdownMenu.background.splice(3, 1);
		}
		if (apiServices.displayContract(playerInfo.contractType).name !== "Freelancer") {
			vm.dropdownMenu.visibility.splice((vm.dropdownMenu.visibility.length - 1), 1);
		}

		changeVisibilityType(vm.findIndexInObject(vm.dropdownMenu.visibility, "value", vm.intelInfo.visibilityField));
		changeTypeField(vm.findIndexInObject(vm.dropdownMenu.types, "value", vm.intelInfo.typeField));
		changePostedAsMethod(vm.findIndexInObject(vm.dropdownMenu.postedAs, "value", vm.intelInfo.displayAs));
		changeBackgroundType(changeBackground());

		$timeout(function(){ vm.enablePriceQuery = true; calculateIntelPrice(); }, 1000);

		function changeVisibilityType(value) { vm.formValues.visibilityField = vm.dropdownMenu.visibility[value]; calculateIntelPrice(); }
		function changeTypeField(value) {
			vm.formValues.typeField = vm.dropdownMenu.types[value];
			vm.maxFieldType = (vm.formValues.typeField.value === "statement" ? 1024 : 2048);
			setupFieldSizes();
			calculateIntelPrice();
		}

		function changePostedAsMethod(value) { vm.formValues.postedAs = vm.dropdownMenu.postedAs[value]; calculateIntelPrice(); }

		function changeBackgroundType(index) {
			vm.formValues.backgroundType = vm.dropdownMenu.background[index];
			vm.usingPicture = (vm.formValues.backgroundType.value !== "color");
			vm.lockPicture = (
				((vm.originalIntelForm.backgroundType === "uploaded-picture") || (vm.lockPicture)) && (!(vm.noOriginalAvatar))
			);
			if ((vm.formValues.backgroundType.value === "uploaded-picture")) doLockPicture();
			calculateIntelPrice();
		}

		function changeBackground() {
			var rIndex = -1;
			vm.dropdownMenu.background.forEach(function(element, index) {
				if (element.value === vm.intelInfo.backgroundType) rIndex = index;
			});
			return rIndex;
		}

		function setupFieldSizes() {
			vm.validatorFields = {
				titleField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 50} } ], name: "Title" },
				bodyField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: vm.maxFieldType} } ], name: "Body" },
			};
		}

		function doLockPicture() {
			if (vm.lockPicture) {
				vm.changedPicture = false;
	  			if (vm.currentUploadedAvatar !== vm.originalAvatar) (vm.currentUploadedAvatar = vm.originalAvatar);
			}
			calculateIntelPrice();
		}

		function calculateIntelPrice() {
			if (vm.enablePriceQuery) {
				var submitInfo = {},
					propChanged = function propChanged(p) {
						var result = (vm.originalIntelForm[p] !== vm.formValues[p].value);

						if ((p === "backgroundType") && vm.changedPicture) { return true; } else { return result; }
					},
					doBackgrounds = function doBackgrounds() {
						submitInfo.backgroundType = vm.formValues.backgroundType;

						submitInfo.backgroundField = (function(type) {
							switch(type) {
								case "color": { return vm.customColor + "|" + vm.customIconColor; } break;
								case "operator-picture": { return vm.playerInfo.hashField; } break;
								case "outfit-picture": { return vm.playerInfo.PMC.hashField; } break;
								case "uploaded-picture": { return "own-hash"; } break;
							}
						})(submitInfo.backgroundType.value);
					};

				if (propChanged("visibilityField")) submitInfo.visibilityField = vm.formValues.visibilityField.value;
				if (propChanged("typeField")) submitInfo.typeField = vm.formValues.typeField.value;
				if (propChanged("postedAs")) submitInfo.postedAs = vm.formValues.postedAs.value;

				if (propChanged("backgroundType")) doBackgrounds();

				if ((!(vm.lockPicture)) && !(vm.noOriginalAvatar) && ((vm.formValues.backgroundType.value) === "uploaded-picture")) doBackgrounds();

				var editSubmitInfo = {};

				if (submitInfo.postedAs) editSubmitInfo.display_as = submitInfo.postedAs;
				if (submitInfo.typeField) editSubmitInfo.type = submitInfo.typeField;
				if (submitInfo.visibilityField) editSubmitInfo.visibility = submitInfo.visibilityField;
				if (submitInfo.backgroundType) editSubmitInfo.background_type = submitInfo.backgroundType.value;
				if (submitInfo.backgroundField) editSubmitInfo.background_field = submitInfo.backgroundField;

				if (apiServices.validatePrivilege(playerInfo, "moderator")) {
					vm.intelPrice = vm.emptyFee;
				} else {
					intelServices.getIntelPricePartial(editSubmitInfo).then(function(cost) { vm.intelPrice = cost; });
				}

				return editSubmitInfo;
			}
		}

		function submitIntelForm() {
			var goodFields = 0;

			vm.textFields.forEach(function(field) {
				var goodCheck = apiServices.validateParams(vm.formValues[field], vm.validatorFields[field].validation, vm.validatorFields[field].name);
				if (goodCheck) goodFields++;
			});

			if ((goodFields === vm.textFields.length)) {

				var fieldsToSubmit = calculateIntelPrice();
				fieldsToSubmit.hashField = vm.intelInfo.hashField;
				fieldsToSubmit.finalCost = vm.intelPrice;

				if (vm.originalIntelForm.titleField !== vm.formValues.titleField) fieldsToSubmit.title_field = vm.formValues.titleField;
				if (vm.originalIntelForm.bodyField !== vm.formValues.bodyField) fieldsToSubmit.body_field = vm.formValues.bodyField;

				var goodPicture = ((vm.croppedDataUrl.length) > 5000),
					passedPicture = ((vm.formValues.backgroundType.value === "uploaded-picture") ? goodPicture : true);
				if (!(passedPicture)) {
					alertsServices.addNewAlert("warning", "Please select a picture, if you desire to do so.");
					return false;
				}

				intelServices.askEditIntel(fieldsToSubmit).then(function(data) {
					if (!data.data.success) return false;

					if ((fieldsToSubmit.background_type === "uploaded-picture") && (!(vm.lockPicture))) {
						Upload.upload({
							url: '/api/playeractions/uploadIntelPicture/' + vm.intelInfo.hashField,
							headers: { 'x-access-session-token': apiServices.getToken()	},
							data: {	intel_picture: Upload.dataUrltoBlob(vm.croppedDataUrl, vm.currentUploadedAvatar)},
						}).then(function(response){ finishUpload(data, response); } );
					} else { return finishUpload(data); }
				});
			}
		}

		function finishUpload(data, response) {
			alertsServices.addNewAlert("success", (response ? response.data.message : "Intel uploaded successfully."));
			$timeout(function(){ $state.go("app.public.intel-single", {intelHash: vm.intelInfo.hashField}); }, 500);
			fundsServices.showChangedFunds(-vm.intelPrice);
		}
	}

	exports.function = IntelControllerFunction;
})();