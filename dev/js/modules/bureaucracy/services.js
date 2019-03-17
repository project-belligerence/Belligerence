(function() {
	'use strict';

	BureaucracyServicesFunction.$inject = ["$rootScope", "$state", "$timeout", "$q", "apiServices", "uiServices", "alertsServices", "marketServices"];

	function BureaucracyServicesFunction($rootScope, $state, $timeout, $q, apiServices, uiServices, alertsServices, marketServices ) {

		var methods = {
			menuItem: menuItem,
			askClassChange: askClassChange,
			playerGoSoldierSelf: playerGoSoldierSelf,
			playerGoFreelancerSelf: playerGoFreelancerSelf,
			askLeaveOutfit: askLeaveOutfit,
			playerLeaveOutfit: playerLeaveOutfit,
			askTransferLeadership: askTransferLeadership,
			transferOutfitLeadership: transferOutfitLeadership
		};

		function menuItem(params) {
			return {
				title: params.title,
				icon: "ion-"+params.icon,
				description: params.description,
				requirement: params.requirement,
				state: params.state,
				enable: params.enable,
				route: params.route,
				fn: params.fn
			};
		}

		function askClassChange() {
			var
				modalOptions = {
					header: { text: 'Confirm Class Change?', icon: 'ion-alert-circled' },
					body: {	text: 'WARNING: You are about to switch classes and permanently change your contract. You will reset your current Prestige Rank, Funds, Soldier Tier, and lose your entire Inventory. THIS CANNOT BE REVERTED. Are you sure you want to continue?' },
					choices: {
						yes: { text: 'CONFIRM', icon: 'ion-alert', class: 'warning' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return $q(function(resolve, reject) {
				newModal.result.then(function(choice) {
					if (choice) {
						var passwordModal = uiServices.createModal('ConfirmPassword');
						passwordModal.result.then(resolve);
					} else { reject(); }
				});
			});
		}

		function askTransferLeadership() {
			var
				modalOptions = {
					header: { text: 'Confirm Leadership transfer?', icon: 'ion-person-stalker' },
					body: {	text: 'WARNING: You are about to transfer the leadership of your Outfit to another Operator, forfeitting your current Tier and becoming a Soldier. THIS CANNOT BE REVERTED. Are you sure you want to continue?' },
					choices: {
						yes: { text: 'CONFIRM', icon: 'ion-alert', class: 'warning' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return $q(function(resolve, reject) {
				newModal.result.then(function(choice) {
					if (choice) {
						var passwordModal = uiServices.createModal('ConfirmPassword');
						passwordModal.result.then(resolve);
					} else { reject(); }
				});
			});
		}

		function askLeaveOutfit() {
			var
				modalOptions = {
					header: { text: 'Leave Outfit?', icon: 'ion-android-exit' },
					body: {	text: 'WARNING: You are about to leave your Outfit. If you are its current Commander, the leadership will be transfered to the oldest Unit. If this is undesired, transfer the position accordingly before continuing.' },
					choices: {
						yes: { text: 'CONFIRM', icon: 'ion-alert', class: 'warning' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions)
			;

			return $q(function(resolve, reject) {
				newModal.result.then(function(choice) {
					if (choice) {
						var passwordModal = uiServices.createModal('ConfirmPassword');
						passwordModal.result.then(resolve);
					} else { reject(); }
				});
			});
		}

		function playerGoSoldierSelf() {
			var request = { url: ("/api/playeractions/playerGoSoldierSelf") };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) {
					if (data.data.success) {
						$state.go('app.public.view-outfits', { open: 1 });
						$rootScope.$broadcast("navbar:refreshDirective");
						marketServices.clearCart();
						alertsServices.addNewAlert("warning", data.data.message);
					}
				}
			});
		}

		function playerGoFreelancerSelf() {
			var request = { url: ("/api/playeractions/playerGoFreelancerSelf") };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) {
					if (data.data.success) {
						$state.go('app.private.dashboard');
						$rootScope.$broadcast("navbar:refreshDirective");
						marketServices.clearCart();
						alertsServices.addNewAlert("warning", data.data.message);
					}
				}
			});
		}

		function playerLeaveOutfit() {
			var request = { url: ("/api/pmcactions/leaveSelfPMC") };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) {
					if (data.data.success) {
						$state.go('app.public.view-outfits', { open: 1 });
						$rootScope.$broadcast("navbar:refreshDirective");
						marketServices.clearCart();
						alertsServices.addNewAlert("warning", data.data.message);
					}
				}
			});
		}

		function transferOutfitLeadership(hash) {
			var request = { url: ("/api/pmcactions/transferPMCOwnership"), data: { "member": hash } };
			return apiServices.requestPOST(request).then(function(data) {
				if (data) {
					if (data.data.success) {
						$state.go('app.private.dashboard');
						$rootScope.$broadcast("navbar:refreshDirective");
						marketServices.clearCart();
						alertsServices.addNewAlert("warning", data.data.message);
					}
				}
			});
		}

		return methods;
	}

	exports.function = BureaucracyServicesFunction;
})();