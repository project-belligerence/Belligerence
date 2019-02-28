(function() {
	'use strict';

	DashboardServicesFunction.$inject = [
		"$rootScope", "$timeout", "$q", "$templateRequest",
		"apiServices", "generalServices",
		"playerServices", "pmcServices",
		"alertsServices", "uiServices", "fundsServices",
		"Upload"
	];

	function DashboardServicesFunction($rootScope, $timeout, $q, $templateRequest, apiServices, generalServices, playerServices, pmcServices, alertsServices, uiServices, fundsServices, Upload) {

		var methods = {
			loadNewView: loadNewView,
			menuItem: menuItem,
			statsItem: statsItem,
			editFieldPlayer: editFieldPlayer,
			editPMCTierNames: editPMCTierNames,
			editFieldPMC: editFieldPMC,
			uploadAvatar: uploadAvatar,
			modalRedeemCode: modalRedeemCode,
			uploadPMCAvatar: uploadPMCAvatar,
			askClaimNetworth: askClaimNetworth,
			resetSideAlignment: resetSideAlignment,
			upgradePMCSize: upgradePMCSize,
			upgradePrestigeRank: upgradePrestigeRank
		};

		var validationForm = {
			alias: [ { library: validator, func: 'isLength', params: { min: 3, max: 32} } ],
			tierNames: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
			displayname: [ { library: validator, func: 'isLength', params: { min: 3, max: 32} } ],
			motto: [ { library: validator, func: 'isLength', params: { min: 3, max: 128} } ],
			bio: [ { library: validator, func: 'isLength', params: { min: 1, max: 255} } ],
			location: [],
			email:  [ { library: validator, func: 'isLength', params: { min: 1, max: 32} },
		 			  { library: validator, func: 'isEmail', params: {} }
				 	]
		};

		function loadNewView(view) { return $templateRequest('dashboard/' + view + '.ejs', function(e) { return false; }); }

		function menuItem(text, icon, fnc) {
			return {
				text: text,
				icon: ("ion-" + icon),
				f: fnc
			};
		}

		function statsItem(text, icon, value) {
			return {
				text: text,
				icon: ("ion-" + icon),
				value: value
			};
		}

		function uploadAvatar(dataUrl, name, _cb) {
			function resolveUpload(response) { $timeout(function () { $rootScope.$broadcast("navbar:refreshDirective"); return _cb(response.data); }, 0);	}
			function eventStep(evt) { /* $scope.progress = parseInt(100.0 * evt.loaded / evt.total); */ }

			Upload.upload({
				url: '/api/playeractions/uploadPlayerAvatar',
				headers: { 'x-access-session-token': apiServices.getToken()	},
				data: {	avatar_picture: Upload.dataUrltoBlob(dataUrl, name)	},
			}).then(resolveUpload, function (response) {}, eventStep);
		}

		function uploadPMCAvatar(dataUrl, name, _cb) {
			function resolveUpload(response) { $rootScope.$broadcast("navbar:refreshDirective"); $timeout(function () { return _cb(response.data); }, 0);	}
			function eventStep(evt) { /* $scope.progress = parseInt(100.0 * evt.loaded / evt.total); */ }

			Upload.upload({
				url: '/api/pmcactions/uploadPMCAvatar',
				headers: { 'x-access-session-token': apiServices.getToken()	},
				data: {	avatar_picture: Upload.dataUrltoBlob(dataUrl, name)	},
			}).then(resolveUpload, function (response) {}, eventStep);
		}

		function editField(api, field, value) {
			function handleFailure(v) {	dfd.reject(v); }
			function handleSuccess(v) {
				alertsServices.addNewAlert("success", "Updated successfully.");
				dfd.resolve(v);
			}

			var
				dfd = $q.defer(),
				request = {
					url: api,
					data: {}
				};

			request.data[field] = value;

			if (value === "") return dfd.reject(value);

			if (apiServices.validateParams(value, validationForm[field])) {
				apiServices.requestPUT(request).then(function(data) {
					if (data.data.success) handleSuccess(value);
					else handleFailure(value);
				});
			} else { handleFailure(value); }

			return dfd.promise;
		}

		function editFieldPlayer(field, value) { return editField("/api/playeractions/updateSelf", field, value); }
		function editFieldPMC(field, value) { return editField("/api/pmcactions/editSelfPMC", field, value); }

		function editPMCTierNames(field, value, index) {
			function handleFailure(v) {	dfd.reject(v); }
			function handleSuccess(v) {
				alertsServices.addNewAlert("success", "Updated successfully.");
				dfd.resolve(v);
			}

			var
				dfd = $q.defer(),
				request = {
					url: "/api/pmcactions/editSelfPMC",
					data: {}
				};

			request.data[field] = value;

			if (value === "") return dfd.reject(value);

			if (apiServices.validateParams(value[index], validationForm[field])) {
				apiServices.requestPUT(request).then(function(data) {
					if (data.data.success) handleSuccess(value);
					else handleFailure(value);
				});
			} else { handleFailure(value); }

			return dfd.promise;
		}

		function askClaimNetworth(amount) {
			var modalOptions = {
					header: { text: 'Claim Personal Networth', icon: "ion-android-drafts" },
					body: {	text: 'Do you want to claim your entire personal networth and transfer it to your funds?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);
			return newModal.result.then(function(choice) {
				if (choice) {
					return playerServices.postClaimNetworth().then(function(data) {
						if (data) {
							fundsServices.showChangedFunds(amount);
							alertsServices.addNewAlert("success", data.data.message);
							return data.data.data;
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function modalRedeemCode() {
			var newModal = uiServices.createModal('RedeemCode', {});
			return newModal.result.then(function(choice) {
				return choice;
			});
		}

		function resetSideAlignment(amount) {
			var modalOptions = {
					header: { text: 'Reset Side Alignment', icon: "ion-refresh" },
					body: {	text: 'Do you want to reset your Side Alignment back to neutrality?' },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},newModal = uiServices.createModal('GenericYesNo', modalOptions);
			return newModal.result.then(function(choice) {
				if (choice) {
					return generalServices.resetSideAlignment().then(function(data) {
						if (data) {
							if (!(data.success || data.data.success)) return false;
							alertsServices.addNewAlert("success", data.data.message);
							$rootScope.$broadcast("navbar:setEntitySide", 0);
							return true;
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function upgradePMCSize(amount) {
			var modalOptions = {
					header: { text: 'Increase Outfit Size', icon: "ion-person-add" },
					body: {	text: "Do you want to increase the Outfit's unit limit by one?" },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-plus', class: "success" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}, cost: amount
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return pmcServices.upgradePMCSize().then(function(data) {
						if (data.data.success) {
							if (data.data.data.valid) {
								alertsServices.addNewAlert("success", data.data.message);
								fundsServices.showChangedFunds(data.data.data.neededFunds, "subtract");
								return data.data.data;
							} else { return false; }
						} else { return false; }
					});
				} else { return false; }
			});
		}

		function upgradePrestigeRank(amount) {
			var modalOptions = {
					header: { text: 'Upgrade Prestige Rank?', icon: "ion-star" },
					body: {	text: "Do you want to increase your Prestige Rank by one level?" },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-plus', class: "success" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}, cost: amount
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					return generalServices.upgradePrestigeRank().then(function(data) {
						if (data.data.success) {
							if (data.data.data.valid) {
								alertsServices.addNewAlert("success", data.data.message);
								fundsServices.showChangedFunds(data.data.data.neededFunds, "subtract");
								return data.data.data;
							} else { return false; }
						} else { return false; }
					});
				} else { return false; }
			});
		}

		return methods;
	}

	exports.function = DashboardServicesFunction;
})();