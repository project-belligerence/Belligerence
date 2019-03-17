(function() {
	'use strict';

	IntelControllerFunction.$inject = ["$state", "$stateParams", "$timeout", "playerInfo", "apiServices", "generalServices", "intelServices", "alertsServices", "fundsServices", "Upload"];

	function IntelControllerFunction($state, $stateParams, $timeout, playerInfo, apiServices, generalServices, intelServices, alertsServices, fundsServices, Upload) {
		var vm = this, i;

		vm.playerInfo = playerInfo;
		vm.hasPMC = !(angular.isUndefinedOrNull(playerInfo.PMC));

		vm.currentUploadedAvatar = [];
		vm.playerCard = {};
		vm.croppedDataUrl = "";

		vm.usingPicture = false;
		vm.customColor = "#fff";
		vm.customIconColor = "#111";
		vm.enablePriceQuery = false;
		vm.maxFieldType = 0;
		vm.intelPrice = 0;
		vm.emptyFee = 1;

		vm.formValues = {
			titleField: "",
			bodyField: "",
			visibilityField: "",
			typeField: "",
			postedAs: "",
			backgroundField: "",
			backgroundType: ""
		};

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

		vm.textFields = ["titleField", "bodyField"];

		vm.changeVisibilityType = changeVisibilityType;
		vm.changeTypeField = changeTypeField;
		vm.changePostedAsMethod = changePostedAsMethod;
		vm.changeBackgroundType = changeBackgroundType;
		vm.checkCharactersRemaining = apiServices.checkCharactersRemaining;
		vm.submitIntelForm = submitIntelForm;

		var intelTypes = intelServices.getIntelTypes(),
			visibilityTypes = intelServices.getIntelVisibility(),
			postedAsTypes = intelServices.getIntelPostedAs();

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

		changeVisibilityType(0);
		changeTypeField(0);
		changePostedAsMethod(0);
		changeBackgroundType(0);

		function changeVisibilityType(index) { vm.formValues.visibilityField = vm.dropdownMenu.visibility[index]; calculateIntelPrice(); }
		function changeTypeField(index) {
			vm.formValues.typeField = vm.dropdownMenu.types[index];
			vm.maxFieldType = (vm.formValues.typeField.value === "statement" ? 1024 : 2048);
			setupFieldSizes();
			calculateIntelPrice();
		}
		function changePostedAsMethod(index) { vm.formValues.postedAs = vm.dropdownMenu.postedAs[index]; calculateIntelPrice(); }
		function changeBackgroundType(index) {
			vm.usingPicture = (index > 0);
			vm.formValues.backgroundType = vm.dropdownMenu.background[index];
			calculateIntelPrice();
		}

		function setupFieldSizes() {
			vm.validatorFields = {
				titleField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 50} } ], name: "Title" },
				bodyField: { validation: [ { library: validator, func: 'isLength', params: { min: 5, max: vm.maxFieldType} } ], name: "Body" },
			};
		}

		$timeout(function(){ vm.enablePriceQuery = true; calculateIntelPrice(); }, 1000);

		function calculateIntelPrice() {
			if (vm.enablePriceQuery) {
				var submitInfo = apiServices.cloneValue(vm.formValues);

				submitInfo.visibilityField = vm.formValues.visibilityField.value;
				submitInfo.typeField = vm.formValues.typeField.value;
				submitInfo.postedAs = vm.formValues.postedAs.value;

				submitInfo.backgroundField = (function(type){
					switch(type) {
						case "color": { return vm.customColor + "|" + vm.customIconColor; } break;
						case "operator-picture": { return vm.playerInfo.hashField; } break;
						case "outfit-picture": { return vm.playerInfo.PMC.hashField; } break;
						case "uploaded-picture": { return "own-hash"; } break;
					}
				})(submitInfo.backgroundType.value);

				submitInfo.backgroundType = submitInfo.backgroundType.value;

				if (apiServices.validatePrivilege(playerInfo, "moderator")) {
					$timeout(1).then(function() { vm.intelPrice = vm.emptyFee; });
				} else {
					intelServices.getIntelPrice(submitInfo).then(function(cost) { vm.intelPrice = cost; });
				}
			}
		}

		function submitIntelForm() {
			var submitInfo = apiServices.cloneValue(vm.formValues),
				goodFields = 0;

			submitInfo.visibilityField = vm.formValues.visibilityField.value;
			submitInfo.typeField = vm.formValues.typeField.value;
			submitInfo.postedAs = vm.formValues.postedAs.value;

			vm.textFields.forEach(function(field) {
				var goodCheck = apiServices.validateParams(vm.formValues[field], vm.validatorFields[field].validation, vm.validatorFields[field].name);
				if (goodCheck) goodFields++;
			});

			submitInfo.backgroundField = (function(type){
				switch(type) {
					case "color": { return vm.customColor + "|" + vm.customIconColor; } break;
					case "operator-picture": { return vm.playerInfo.hashField; } break;
					case "outfit-picture": { return vm.playerInfo.PMC.hashField; } break;
					case "uploaded-picture": { return "own-hash"; } break;
				}
			})(submitInfo.backgroundType.value);

			submitInfo.backgroundType = submitInfo.backgroundType.value;

			submitInfo.finalCost = vm.intelPrice;
			submitInfo.modalIcon = vm.formValues.typeField.icon;

			var goodPicture = ((vm.croppedDataUrl.length) > 5000),
				passedPicture = ((submitInfo.backgroundType.value === "uploaded-picture") ? goodPicture : true);
			if (!(passedPicture)) {
				alertsServices.addNewAlert("warning", "Please select a picture, if you desire to do so.");
				return false;
			}

			if ((goodFields === vm.textFields.length)) {
				intelServices.askPostIntel(submitInfo).then(function(data) {
					if (!data.data) return false;

					if (submitInfo.backgroundType === "uploaded-picture") {
						Upload.upload({
							url: '/api/playeractions/uploadIntelPicture/' + data.data.data.hashField,
							headers: { 'x-access-session-token': apiServices.getToken()	},
							data: {	intel_picture: Upload.dataUrltoBlob(vm.croppedDataUrl, vm.currentUploadedAvatar)},
						}).then(function(response){ finishUpload(data, response); } );
					} else { return finishUpload(data); }
				});
			}
		}

		function finishUpload(data, response) {
			alertsServices.addNewAlert("success", (response ? response.data.message : "Intel uploaded successfully."));
			$timeout(function(){ $state.go("app.public.intel-single", {intelHash: data.data.data.hashField}); }, 2000);
			fundsServices.showChangedFunds(-vm.intelPrice);
		}
	}

	exports.function = IntelControllerFunction;
})();