(function() {
	'use strict';

	NavDirectiveFunctions.$inject = ["$scope", "$timeout", "generalServices", "navServices", "playerServices", "loginServices"];

	function NavDirectiveFunctions($scope, $timeout, generalServices, navServices, playerServices, loginServices) {
		var vm = this;

		vm.displayIcons = false;
		vm.navMode = 2;
		vm.isLogged = false;

		vm.getMessageCount = generalServices.countMessagesInvitesReceived;
		vm.askLogout = loginServices.askLogout;
		vm.toggleNavMode = toggleNavMode;

		vm.expandedMenuItems = [];

		vm.windowSize = $(window).width();

		vm.totalExpandedMenuItems = [
			{ name: "News", icon: "ion-speakerphone" },
			{ name: "Units", icon: "ion-person-stalker" },
			{ name: "Market", icon: "ion-card" },
			{ name: "Upgrades", icon: "ion-flash" },
			{ name: "Missions", icon: "ion-clipboard" }
		];

		initDirective();

		function isMobile() { return ($(window).width() <= 979);}

		function toggleNavMode() {
			if (isMobile()) {
				var curMode = vm.navMode;
				vm.navMode = (curMode === 1 ? 2 : 1);

				switch(vm.navMode) {
					case 1: {
						$("#expand-icon").removeClass("active");
						$("#menu-items").removeClass("show-mobile");

						$("#menu-items").fadeOut(function() {
							$("#menu-items").addClass("hide-mobile");
							$("#nav-icons").fadeIn();
						});
					} break;
					case 2: {
						$("#expand-icon").addClass("active");

						$("#nav-icons").fadeOut(function() {
							$("#menu-items").removeClass("hide-mobile");
							$("#menu-items").fadeIn();
							if (isMobile()) $("#menu-items").addClass("show-mobile");
						});
					} break;
				}
			}
		}

		function initDirective() {
			if (isMobile()) $("#menu-items").hide();

			toggleNavMode();

			$(window).resize(function(a, b, c) {
				var windowWidth = $(window).width();

				if (windowWidth >= 980) {
					var menuItems = $("#menu-items");
					$("#nav-icons").fadeIn();
					$("#menu-items").fadeIn();

					menuItems.addClass("hide-mobile");
				}
			});

			playerServices.getSelf().then(function(data) {
				if (data) {
					vm.isLogged = true;
					vm.playerInfo = data;
					vm.totalMessages = 0;
					vm.receivedMessages = {};

					vm.getMessageCount().then(function(totalData) {
						vm.receivedMessages = totalData;
						vm.totalMessages = (totalData.messages + totalData.receivedPlayer + (totalData.receivedPMC ? totalData.receivedPMC : 0));

						vm.dropdownOptions = {
							player: [
								{ text: "Profile", icon: "ion-person", route: "app.public.player({'playerHash': '" + vm.playerInfo.hashField + "'})" },
								{ text: "Dashboard", icon: "ion-gear-a", route: "app.private.dashboard({page: 'operator'})" }
							],
							pmc: [
								{ text: "Profile",
									route: "app.public.pmc({'pmcHash': '" + (vm.playerInfo.PMC ? vm.playerInfo.PMC.hashField : "123") + "'})",
								icon: "ion-ios-people" },
								{ text: "Dashboard", route: "app.private.dashboard({page: 'outfit'})", icon: "ion-gear-a" }
							],
							mail: [
								{ text: "Inbox ", url: "/dashboard", icon: "ion-archive", value: vm.receivedMessages.messages },
								{ text: "separator1", separator: true },
								{ text: "Operator Invites", url: "/", icon: "ion-plus-circled", value: vm.receivedMessages.receivedPlayer },
								{ text: "Outfit Invites", url: "/", icon: "ion-person-add", value: vm.receivedMessages.receivedPMC, if: vm.playerInfo.PMC }, // IMPLEMENT ATTRIBUTE FOR ONLY RENDERING IF
								{ text: "separator2", separator: true },
								{ text: "Refresh", icon: "ion-loop", doFunction: vm.getMessageCount }
							]
						};

						$timeout(function(){ vm.displayIcons = true; }, 150);
					});
				} else {
					$timeout(function(){ vm.displayIcons = true; }, 150);
				}
			});
			$timeout(function(){ vm.expandedMenuItems = vm.totalExpandedMenuItems; }, 150);
		}
	}

	function NavDirectiveFunction() {
		return {
			scope: {
			},
			restrict : "E",
			templateUrl: 'directive/nav.ejs',
			controller: NavDirectiveFunctions,
			controllerAs: "NavController"
		};
	}

	exports.function = NavDirectiveFunction;
})();