(function() {
	'use strict';

	TemplateControllerFunction.$inject = ["$rootScope", "$state", "$cookies", "$stateParams", "$scope", "$window", "$timeout", "$q", "apiServices", "generalServices", "alertsServices", "routesServices", "loginServices", "Upload"];

	function TemplateControllerFunction($rootScope, $state, $cookies, $stateParams, $scope, $window, $timeout, $q, apiServices, generalServices, alertsServices, routesServices, loginServices, Upload) {
		var vm = this;

		vm.currentStep = 0;
		vm.startingStep = 0;

		vm.passedSteam = false;
		vm.displayPlayerCard = false;
		vm.currentSteamSession = 0;
		vm.viewAvatarUpload = 0;
		vm.currentSelectedClass = -1;
		vm.acceptUseTerms = false;

		vm.currentUploadedAvatar = [];
		vm.playerCard = {};
		vm.croppedDataUrl = "";

		vm.steamStatusMsg = "Evaluating your status...";

		vm.changeStep = changeStep;
		vm.authSteam = authSteam;
		vm.destroySteamStatus = destroySteamStatus;
		vm.getFieldLimit = getFieldLimit;
		vm.validateInputForm = validateInputForm;
		vm.validateAllFields = validateAllFields;
		vm.switchUploadView = switchUploadView;
		vm.validateAccessKey = validateAccessKey;
		vm.verifyUsernameButton = verifyUsernameButton;
		vm.selectClass = selectClass;
		vm.createNewAccount = createNewAccount;
		vm.displayPrivilege = apiServices.displayPrivilege;

		generalServices.getRegions().then(function(regions) { vm.regionOptions = regions; });

		vm.stepProperties = [
			{
				height: 500,
				startFunc: function(_cb) { return _cb(writeInText()); }
			},
			{
				height: 550,
				startFunc: function(_cb) {
					vm.accessKeyValue = "";

					if ($stateParams.key) {
						vm.accessKeyValue = $stateParams.key;
						$q(function(resolve, reject) {
							validateAccessKey(vm.accessKeyValue, resolve);
						}).then(function() {
							getSteamStatus(function(result){ return _cb(result); });
						});
					} else {
						getSteamStatus(function(result){ return _cb(result); });
					}
				},
				requiredFunc: function(_cb) { return _cb(vm.passedSteam); },
				failMessage: "Please make sure you are logged in a valid Steam account."
			},
			{
				height: 750,
				startFunc: function(_cb) { return _cb(true); },
				requiredFunc: function(_cb) { validateAllFields(function(result){ return _cb(result); }); }
			},
			{
				height: 950,
				requiredFunc: function(_cb) { return _cb(verifyClass()); },
				failMessage: "Select a class before continuing."
			},
			{
				height: 700,
				startFunc: function(_cb) { return _cb(generatePlayerCard()); },
				requiredFunc: function(_cb) { return _cb(vm.acceptUseTerms); },
				failMessage: "You must accept the terms of use before continuing."
			},
			{
				height: 550,
				startFunc: function(_cb) { return _cb(createNewAccount()); }
			}
		];

		vm.currentStepProperty = vm.stepProperties[vm.currentStep];

		vm.formCharacters = {
			inputUnitUsername: {
				class: "inputUnitUsername",
				name: "Username",
				placeholder: "Choose your unique username.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 32} } ]
			},
			inputUnitAlias: {
				class: "inputUnitAlias",
				name: "Alias",
				placeholder: "Enter your desired alias.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ]
			},
			inputUnitLocation: {
				class: "inputUnitLocation",
				type: "dropdown",
				name: "Location",
				placeholder: "Enter your Outfit's location",
				value: 0
			},
			inputUnitEmail: {
				class: "inputUnitEmail",
				name: "E-mail",
				placeholder: "Enter a valid e-mail to be used.",
				text: "",
				validation: [
					{ library: validator, func: 'isLength', params: { min: 3, max: 32} },
					{ library: validator, func: 'isEmail', params: {} }
				]
			},
			inputUnitPassword: {
				class: "inputUnitPassword",
				name: "Password",
				placeholder: "Enter your desired password.",
				text: "",
				validation: [
					{ library: validator, func: 'isLength', params: { min: 6, max: 64} }
				],
				type: "password"
			},
			inputUnitPassword2: {
				class: "inputUnitPassword2",
				name: "Confirm",
				placeholder: "Confirm the password entered above.",
				text: "",
				validation: [
					{ library: validator, func: 'isLength', params: { min: 6, max: 64} }
				],
				type: "password"
			},
			inputUnitDescription: {
				class: "inputUnitDescription",
				name: "Description",
				placeholder: "Describe yourself in a few words.",
				text: "",
				validation: [ { library: validator, func: 'isLength', params: { min: 5, max: 255} } ],
				type: "textarea"
			},
		};

		vm.formCharacters.inputUnitUsername.text = "myusername";
		vm.formCharacters.inputUnitAlias.text = "Neefay";
		vm.formCharacters.inputUnitEmail.text = "neefay@belligerence.com";
		vm.formCharacters.inputUnitDescription.text = "Got yourself a target that requires some extra punch? Maybe some building that needs to up in the air? For all your heavy demolition needs, I'm your guy.";
		vm.formCharacters.inputUnitLocation.value = 0;

		vm.formCharacters.inputUnitPassword.text = "abc123123321321";
		vm.formCharacters.inputUnitPassword2.text = vm.formCharacters.inputUnitPassword.text;

		if ($stateParams.key) { changeStep(1); } else {
			if ($stateParams.step === "steam") { changeStep(1); } else { changeStep(vm.startingStep); }
		}

		function selectClass(newClass) { vm.currentSelectedClass = newClass; }
		function verifyClass() { return (vm.currentSelectedClass > -1); }

		function validateAccessKey(key, cb) {
			var accessKey = (key || vm.accessKeyValue),
				_cb = (cb || function(){});

			if (accessKey === "") return false;

			generalServices.validateAccessKey(accessKey).then(function(data) {
				if (data) {
					vm.accessKeyData = data;

					if (data.skipSteamField) {
						vm.passedSteam = true;
						$("#signup-view").addClass("no-steam");
						vm.currentSteamSession = { id: _.join(_.shuffle(_.range(13)), '') };
					}
					return _cb(true);
				}
			});
		}

		function verifyUsernameButton() { return verifyUsername(true, function(){}); }

		function verifyUsername(showmessage, _cb) {
			var valid = validateInputForm("inputUnitUsername");

			if (valid) {
				var request = {
					url: "api/playeractions/findPlayerByProperty",
					data: {
						property: "username",
						value: vm.formCharacters.inputUnitUsername.text
					}
				};
				apiServices.requestPOST(request).then(function(rdata) {
					var userExists = rdata.data.data.exists,
						targetDiv = $("#inputUnitUsername");

					targetDiv.removeClass("good");
					targetDiv.removeClass("bad");

					if (userExists) {
						alertsServices.addNewAlert("warning", "This username is already taken.");
						targetDiv.addClass("bad");
					} else {
						if (showmessage) alertsServices.addNewAlert("success", "Valid username!");
						targetDiv.addClass("good");
					}
					return _cb(userExists);
				});
			}
		}

		function generatePlayerCard() {
			vm.displayPlayerCard = false;

			vm.playerCard.username = vm.formCharacters.inputUnitUsername.text;
			vm.playerCard.alias = vm.formCharacters.inputUnitAlias.text;
			vm.playerCard.email = vm.formCharacters.inputUnitEmail.text;
			vm.playerCard.description = vm.formCharacters.inputUnitDescription.text;
			vm.playerCard.location = vm.formCharacters.inputUnitLocation.value;

			vm.playerCard.playerclass =
				(function(v){
					switch(v) {
						case 1: { return {name: "Commander", class: "co"}; }
						case 2: { return {name: "Soldier", class: "sl"}; }
						case 3: { return {name: "Freelancer", class: "fc"}; }
						default: { return {name: "Soldier", class: "sl"}; }
					}
				})(vm.currentSelectedClass);

			vm.playerCard.issueDate = new Date();

			$timeout(function(){ vm.displayPlayerCard = true; }, 700);

			return true;
		}

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
			success = validateAvatar();

			for (var key in vm.formCharacters) {
				if (vm.formCharacters.hasOwnProperty(key)) {
					if (!validateInputForm(key)) success = false;
				}
			}
			if (!success) { return _cb(success); } else { verifyUsername(false, function(done) { return _cb(!done); }); }
		}

		function authSteam() { $window.location.href = '/auth/steam'; }

		function getSteamStatus(_cb) {
			apiServices.requestGET({url: "api/generalactions/getSteamSession"}).then(function(data) {
				if (data.data.data) {
					vm.currentSteamSession = data.data.data;
					vm.passedSteam = data;
					validateSteamStatus(vm.currentSteamSession.id, function(done){ return (done); });
				}
			});
		}

		function validateSteamStatus(id, _cb) {
			var request = {url: "api/generalactions/getSteamValid", cache: false, data: {id: id}};
			apiServices.requestPOST(request).then(function(rdata) {
				if (rdata) {
					var statusIcon = $("#steam-status-icon");
					statusIcon.removeClass("ion-help");

					vm.passedSteam = rdata.data.success;

					if (vm.passedSteam) {
						statusIcon.addClass("ion-checkmark");
						vm.steamStatusMsg = "Valid credentials.";
						vm.formCharacters.inputUnitAlias.text = vm.currentSteamSession.displayName;
					} else {
						statusIcon.addClass("ion-close");
						vm.steamStatusMsg = "Non-elligible credentials. Make sure your profile is public and try again.";
					}

					return _cb(vm.passedSteam);
				}
			});
		}

		function destroySteamStatus() {
			apiServices.requestPOST({url: "api/generalactions/destroySteamSession"}).then(function(data) {
				vm.currentSteamSession = 0;
				vm.passedSteam = false;
			});
		}

		function createNewAccount() {
			var playerInfo = {
				username: vm.formCharacters.inputUnitUsername.text,
				password: vm.formCharacters.inputUnitPassword.text,
				alias: vm.formCharacters.inputUnitAlias.text,
				email: vm.formCharacters.inputUnitEmail.text,
				location: vm.formCharacters.inputUnitLocation.value,
				bio: vm.formCharacters.inputUnitDescription.text,
				contract: (vm.currentSelectedClass - 1),
				steam_id: vm.currentSteamSession.id,
				access_key: vm.accessKeyValue,
				remember: true
			};
			apiServices.requestPOST({url: "api/generalactions/newPlayer", data: playerInfo}).then(function(data) {
				if (!data) return console.warn(data);
				if (!data.data) return console.warn(data);

				if (data.data.success) {
					var returnedHash = data.data.data.hashField;

					console.log("Calling for log-in...");

					loginServices.callLoginSimple(playerInfo, function(data2) {

						console.log("Logged in-successfully...");

						Upload.upload({
							url: '/api/playeractions/uploadPlayerAvatar',
							headers: { 'x-access-session-token': apiServices.getToken()	},
							data: {	avatar_picture: Upload.dataUrltoBlob(vm.croppedDataUrl, vm.currentUploadedAvatar)},
						}).then(function(response) {

							console.log("Redirecting to dashboard...");

							var doneRoute = "app.private.dashboard";
							if (playerInfo.contract === 0) doneRoute = "app.private.new-outfit";

							$state.go(doneRoute);
							$rootScope.$broadcast("navbar:refreshDirective");
						},
						function (r){}, function(evt){});
					});
				}
			});
		}

		function initializeFX() {
			$("#page-top").addClass("pulse-bg-animation");
			$scope.$on('$destroy', removeFX);
		}

		function removeFX() {
			$("#page-top").removeClass("pulse-bg-animation");
		}

		function setStepHeight(step) {
			var signupView = $("#signup-view"), i;
			for (i = 0; i < (vm.stepProperties.length); i++) { signupView.removeClass("step-" + i);}
			signupView.addClass("step-" + step);
		}

		function writeInText() { /* do later */ }

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