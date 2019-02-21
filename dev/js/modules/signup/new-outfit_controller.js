(function() {
	'use strict';

	TemplateControllerFunction.$inject = ["$rootScope", "$state", "$cookies", "$stateParams", "$scope", "$window", "$timeout", "apiServices", "generalServices", "alertsServices", "uiServices", "routesServices", "loginServices", "Upload"];

	function TemplateControllerFunction($rootScope, $state, $cookies, $stateParams, $scope, $window, $timeout, apiServices, generalServices, alertsServices, uiServices, routesServices, loginServices, Upload) {
		var vm = this;

		vm.currentStep = 0;
		vm.viewAvatarUpload = 0;

		vm.currentUploadedAvatar = [];
		vm.croppedDataUrl = "";
		vm.confirmedCreation = false;
		vm.displayOutfitCard = false;
		vm.outfitInfoCard = {};

		vm.changeStep = changeStep;
		vm.getFieldLimit = getFieldLimit;
		vm.validateInputForm = validateInputForm;
		vm.validateAllFields = validateAllFields;
		vm.switchUploadView = switchUploadView;
		vm.createNewAccount = createNewAccount;
		vm.proccessOutfitInfo = proccessOutfitInfo;

		generalServices.getRegions().then(function(regions) { vm.regionOptions = regions; });

		vm.stepProperties = [
			{
				startFunc: function(_cb) { return _cb(true); }
			},
			{
				startFunc: function(_cb) { return _cb(true); },
				requiredFunc: function(_cb) { validateAllFields(function(result){ return _cb(result); }); }
			},
			{
				startFunc: function(_cb) { return _cb(proccessOutfitInfo()); },
				requiredFunc: function(_cb) { return _cb(vm.confirmedCreation); },
				failMessage: "You must confirm the Outfit details before proceeding."
			},
			{
				startFunc: function(_cb) { return _cb(createNewAccount()); }
			}
		];

		vm.currentStepProperty = vm.stepProperties[vm.currentStep];

		vm.formCharacters = {
			inputOutfitDisplayname: {
				class: "inputOutfitDisplayname",
				name: "Name",
				placeholder: "Choose your Outfit name.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 24} } ]
			},
			inputOutfitMotto: {
				class: "inputOutfitMotto",
				name: "Motto",
				placeholder: "Enter your Outfit's motto.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 64} } ]
			},
			inputOutfitLocation: {
				class: "inputOutfitLocation",
				type: "dropdown",
				name: "Location",
				placeholder: "Enter your Outfit's location",
				value: 0
			},
			inputOutfitDescription: {
				class: "inputOutfitDescription",
				name: "Description",
				placeholder: "Describe your Outfit.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 255} } ],
				type: "textarea"
			}
		};

		changeStep(0);

		function switchUploadView() {
			var oldUploadValue = vm.viewAvatarUpload;
			if (oldUploadValue === 1) validateAvatar();
			vm.viewAvatarUpload = -1;

			var	previewImageDiv = $("#preview-image");
			previewImageDiv.removeClass("good");
			previewImageDiv.removeClass("bad");
			$timeout(function() { vm.viewAvatarUpload = ((oldUploadValue === 0) ? 1 : 0); }, 350);
		}

		function getFieldLimit(field) {
			return (vm.formCharacters[field].validation[0].params.max - vm.formCharacters[field].text.length);
		}

		function validateInputForm(field) {
			var validateR = apiServices.validateParams(vm.formCharacters[field].text, vm.formCharacters[field].validation, vm.formCharacters[field].name);

			if (field === "inputUnitPassword2") {
				if (vm.formCharacters.inputUnitPassword2.text !== vm.formCharacters.inputUnitPassword.text) {
					alertsServices.addNewAlert("warning", "The passwords do not match.");
					validateR = false;
				}
			}

			var fieldClass = validateR ? "good" : "bad";
			$("#" + field).removeClass("good");
			$("#" + field).removeClass("bad");
			$("#" + field).addClass(fieldClass);

			return validateR;
		}

		function validateAvatar() {
			var success = true,
				previewImageDiv = $("#preview-image");

			previewImageDiv.removeClass("good");
			previewImageDiv.removeClass("bad");

			if ((vm.croppedDataUrl.length) > 5000) {
				previewImageDiv.addClass("good");
			} else {
				alertsServices.addNewAlert("warning", "No avatar selected.");
				previewImageDiv.addClass("bad");
				success = false;
			}

			return success;
		}

		function validateAllFields(_cb) {
			var success = true;

			for (var key in vm.formCharacters) {
				if (vm.formCharacters.hasOwnProperty(key)) {
					if (!validateInputForm(key)) success = false;
				}
			}
			return _cb(success && validateAvatar());
		}

		function proccessOutfitInfo() {
			vm.displayOutfitCard = false;

			vm.outfitInfoCard.displayName = vm.formCharacters.inputOutfitDisplayname.text;
			vm.outfitInfoCard.motto = vm.formCharacters.inputOutfitMotto.text;
			vm.outfitInfoCard.location = vm.formCharacters.inputOutfitLocation.value;
			vm.outfitInfoCard.description = vm.formCharacters.inputOutfitDescription.text;

			// vm.outfitInfoCard.displayName = "Ahkma PMC";
			// vm.outfitInfoCard.motto = "The best at being the worst.";
			// vm.outfitInfoCard.location = 3;
			// vm.outfitInfoCard.description = "This is a cool PMC, we mess everyone up and take names.";

			vm.outfitInfoCard.issueDate = new Date();

			$timeout(function(){ vm.displayOutfitCard = true; }, 750);

			return true;
		}

		function createNewAccount() {
			var outfitInfo = {
				displayname: vm.formCharacters.inputOutfitDisplayname.text,
				motto: vm.formCharacters.inputOutfitMotto.text,
				location: vm.formCharacters.inputOutfitLocation.value,
				description: vm.formCharacters.inputOutfitDescription.text,
			};

			apiServices.requestPOST({url: "/api/playeractions/startPMC", data: outfitInfo}).then(function(data) {
				if (data.data.success) {
					Upload.upload({
						url: '/api/pmcactions/uploadPMCAvatar',
						headers: { 'x-access-session-token': apiServices.getToken()	},
						data: {	avatar_picture: Upload.dataUrltoBlob(vm.croppedDataUrl, vm.currentUploadedAvatar)},
					}).then(function(response) {
						$state.go('app.private.dashboard', {page: "outfit"});
						$rootScope.$broadcast("navbar:refreshDirective");
					},
					function (r){}, function(evt){});
				}
			});
		}

		function setStepHeight(step) {
			var signupView = $("#signup-view"), i;
			for (i = 0; i < (vm.stepProperties.length); i++) { signupView.removeClass("step-" + i);}
			signupView.addClass("step-" + step);
		}

		function changeStep(step) {
			var maxSteps = 5, newV = vm.currentStep, nullFunc = function(_cb){return _cb(true);};

			var callbackFunc = (vm.stepProperties[newV].requiredFunc || nullFunc);
			if (step === -1) callbackFunc = nullFunc;

			callbackFunc(function(result) {
				if (result) {
					routesServices.scrollToTop();
					setStepHeight(vm.currentStep + step);

					vm.currentStep = -1;

					$timeout(function() {
						newV = newV + step;
						newV = Math.max(0, Math.min(newV, maxSteps));
						vm.currentStep = newV;
						vm.currentStepProperty = vm.stepProperties[vm.currentStep];

						var startFunc = (vm.stepProperties[newV].startFunc || nullFunc);
						startFunc(function(result2){return true;});
					}, 300);
				} else {
					var errorMsg = (vm.stepProperties[newV].failMessage || "Unable to continue.");
					alertsServices.addNewAlert("warning", errorMsg);
				}
			});
		}
	}

	exports.function = TemplateControllerFunction;
})();