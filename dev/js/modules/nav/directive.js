(function() {
	'use strict';

	NavDirectiveFunctions.$inject = ["$rootScope", "$scope", "$state", "$q", "$timeout", "apiServices", "generalServices", "navServices", "playerServices", "loginServices", "messagesServices", "missionsServices", "marketServices", "uiServices", "websocketsServices"];

	function NavDirectiveFunctions($rootScope, $scope, $state, $q, $timeout, apiServices, generalServices, navServices, playerServices, loginServices, messagesServices, missionsServices, marketServices, uiServices, websocketsServices) {
		var vm = this;

		initializeDirective();

		// ===================================================
		// ===================================================

		function initializeDirective() {
			initializeVariables();
			initializeFunctions();
			vm.intializeEvents();

			vm.refreshDataNav();
		}

		function initializeVariables() {
			vm.playerInfo = [];
			vm.displayIcons = false;
			vm.navMode = 1;
			vm.isLogged = false;
			vm.isMobile = ((apiServices.isPortrait) || (apiServices.isLandscape));
		}

		function initializeFunctions() {
			vm.toggleNavMode = toggleNavMode;
			vm.setNavMenuState = setNavMenuState;
			vm.extendMenu = extendMenu;
			vm.renderEtcMenu = renderEtcMenu;
			vm.getUIRoute = getUIRoute;

			vm.intializeEvents = intializeEvents;
			vm.refreshDataNav = refreshDataNav;

			vm.applyControlledClass = apiServices.applyControlledClass;
			vm.askLogout = loginServices.askLogout;

			var getMessageCount = generalServices.countMessagesInvitesReceived,
				getOperationsCount = generalServices.countActiveOperations;

			function initializeData() {
				return playerServices.getSelf().then(function(data) {
					if (data) {
						vm.totalAlerts = 0;
						vm.navigationData = {};
						vm.currentCartSize = 0;
						vm.currentCart = {};
						vm.isLogged = true;
						vm.playerInfo = data;
						vm.outfitPermission = apiServices.getOutfitPermissions(vm.playerInfo);
						vm.playerInfo.absoluteSide = getSideVar(vm.playerInfo);

						refreshCurrentCart();
						initializeWebsockets();

						return refreshAllAlerts();
					} else {
						vm.playerInfo = [];
						vm.isLogged = false;
						return false;
					}
				});
			}

			function getSideVar(player) { return (player.PMC ? player.PMC : player).sideField; }

			function intializeEvents() {
				$rootScope.$on("navbar:refreshDirective", refreshDataNav);
				$rootScope.$on("navbar:setEntitySide", setEntitySide);
				$rootScope.$on("navbar:refreshCurrentCart", refreshCurrentCart);
				$rootScope.$on("navbar:setNavMenuState", setNavMenuState);
				$rootScope.$on("navbar:resetCurrentCart", resetCurrentCart);

				$rootScope.$on("navbar:refreshMessageCount", refreshMessages);
				$rootScope.$on("navbar:refreshOperationCount", refreshOperations);

				$(window).resize(resizeWindow);
			}

			function initializeUI() {
				var uiData = initializeUIMenus();

				vm.expandedMenuItems = uiData.main_menu;
				vm.dropdownOptions = uiData.dropdown_menu;

				if (vm.isMobile()) $("#menu-items").hide();

				renderNav();
				resizeWindow();

				$timeout(function() { vm.displayIcons = true; }, 500);
			}

			function refreshDataNav() {
				vm.displayIcons = false;
				$timeout(150).then(function() { initializeData().then(initializeUI); });
			}

			function setEntitySide(e, s) { vm.playerInfo.absoluteSide = s; }

			function refreshSideAsync() {
				if (apiServices.getToken()) {
					$q(function(resolve, reject) {
						generalServices.getSideAlignment().then(function(data) {
							setEntitySide({}, data.side);
							resolve();
						});
					});
				}
			}

			function initializeUIMenus() {
				var rV = {
					main_menu: [
						{ name: "Intel", icon: "ion-speakerphone", menu:
							[
								{ name: "View", route: "app.public.intel", icon: "ion-speakerphone" },
								{ name: "New", route: "app.private.intel-compose", class: "color-green", icon: "ion-plus", }
							]},
						{ name: "Units", icon: "ion-person-stalker", menu:
							[
								{ name: "Operators", route: "app.public.view-operators", icon: "ion-person" },
								{ name: "Outfits", route: "app.public.view-outfits", icon: "ion-ios-people" }
							]},
						{ name: "Economy", icon: "ion-social-usd", menu:
							[
								{ name: "Exchange", route: "app.public.market", icon: "ion-card" },
								{ name: "Items", route: "app.public.items", icon: "ion-cube" }
							]},
						{ name: "Upgrades", route: "upgrades", icon: "ion-flash" },
						{ name: "Missions", route: "missions", icon: "ion-clipboard" }
					],
				};

				if (vm.isLogged) {
					var commonRoutes = {
						player: "app.public.player",
						pmc: "app.public.pmc",
						dashboard: "app.private.dashboard",
						messages: "app.private.messages",
						operations: "app.private.operations"
					};

					rV.dropdown_menu = {
						player: [
							{ text: "Dashboard", icon: "ion-home", route: commonRoutes.dashboard, params: { page: "home" } },
							{ text: "Profile", icon: "ion-person", route: commonRoutes.player, params: { playerHash: vm.playerInfo.hashField } },
							{ text: "Settings", icon: "ion-gear-a", route: commonRoutes.dashboard, params: { page: "operator" } },
							{ separator: true },
							{ text: "Bureaucracy", route: "app.private.bureaucracy-operator", icon: "ion-clipboard" }
						],
						pmc: [
							{
								text: "Profile", icon: "ion-ios-people",
								route: commonRoutes.pmc, params: { pmcHash: (vm.playerInfo.PMC ? vm.playerInfo.PMC.hashField : "123") },
							},
							{ text: "Settings", route: commonRoutes.dashboard, params: { page: "outfit" }, icon: "ion-gear-a" },
							{ separator: true },
							{ text: "Bureaucracy", route: "app.private.bureaucracy-outfit", icon: "ion-clipboard" }
						],
						alerts: [
							{ text: "Inbox", route: commonRoutes.messages, params: { view: "messages" }, icon: "ion-archive", value: vm.navigationData.messages },
							{ text: "Invites", sub: true, route: commonRoutes.messages, params: { view: "invites" }, icon: "ion-android-person-add", value: (vm.navigationData.receivedPlayer) },
							{ text: "Outfit Invites", sub: true, route: commonRoutes.messages, params: { view: "outfitinvites" }, icon: "ion-ios-people", value: (vm.navigationData.receivedPMC), if: vm.outfitPermission },
							{ separator: true },
							{
								text: "Contracts", route: commonRoutes.operations, params: { view: "contracts" }, icon: "ion-document-text",
								values: [
									{ value: vm.navigationData.contracts.active, class: "muted" },
									{ value: vm.navigationData.contracts.completed, class: "success" },
									{ value: vm.navigationData.contracts.failed, class: "black" }
								]
							},
							{
								text: "Negotiations ", route: commonRoutes.operations, params: { view: "negotiations" }, icon: "ion-arrow-swap",
								values: [
									{ value: vm.navigationData.negotiations.waiting, class: "muted" },
									{ value: vm.navigationData.negotiations.active, class: "caution" }
								]
							},
							{
								text: "Interests ",
								route: commonRoutes.operations, params: { view: "interests" }, value: vm.navigationData.interests.active,
								icon: "ion-star", class: "muted", display: function() { return (vm.playerInfo.contractType === 2); }
							}
						]
					};
				}
				return rV;
			}

			function initializeWebsockets() {
				websocketsServices.initCtrlWS($scope, {
					NewMessage: {
						onMessage: refreshNavigationMessages,
						filter: function() { return websocketsServices.joinFilter(["NewMessage", vm.playerInfo.hashField]); },
						notification: function(data) {
							return {
								title: (data.Sender.aliasField + " sent you a message:"),
								icon: ("images/avatars/players/thumb_" + data.Sender.hashField + ".jpg"),
								body: data.titleField,
								route: function() { return { route: "app.private.messages", params: { view: "messages", latest: true } }; }
							};
						},
						notificationData: function(_cb) {
							messagesServices.getReceivedMessagesSelf({ qLimit: 1 }).then(function(data) {
								return _cb((data ? data.data[0] : false));
							});
						}
					},
					NewInvite: {
						onMessage: refreshNavigationMessages,
						filter: function() { return websocketsServices.joinFilter(["NewInvite", "player", vm.playerInfo.hashField]); },
						notification: function(data) {
							var inviteN = messagesServices.inviteNotification(data);
							return _.merge(inviteN, {
								body: data.note,
								onClick: function() { messagesServices.askResolveInvite(data, function() { }); }
							});
						},
						notificationData: function(_cb) {
							messagesServices.getReceivedInvitesSelf({ qLimit: 1 }).then(function(data) {
								return _cb((data ? data.data[0] : false));
							});
						}
					},
					SendNegotiation: {
						onMessage: refreshNavigationOperations,
						filter: function() { return websocketsServices.joinFilter(["SendNegotiation", "player", vm.playerInfo.hashField]); },
						notification: messagesServices.negotiationNotification,
						notificationData: function(_cb) {
							missionsServices.getNegotiationsSelf({ qLimit: 1, qLast: true }).then(function(data) {
								return _cb((data ? data.data[0] : false));
							});
						}
					},
					NewContract: {
						onMessage: refreshNavigationOperations,
						filter: function() { return websocketsServices.joinFilter(["NewContract", "player", vm.playerInfo.hashField]); },
						notification: function(data) { return messagesServices.contractNotification(data, vm.playerInfo); },
						notificationData: function(_cb) {
							missionsServices.getLastSignedContractSelf().then(function(data) {
								return _cb((data ? data.data : false));
							});
						}
					},
					CancelNegotiation: {
						onMessage: refreshNavigationOperations,
						filter: function() { return websocketsServices.joinFilter(["CancelNegotiation", vm.playerInfo.hashField]); },
						notification: messagesServices.negotiationCancelled
					}
				});

				if (vm.playerInfo.PMC) {
					websocketsServices.initCtrlWS($scope, {
						NewInvite: {
							onMessage: refreshNavigationMessages,
							filter: function() { return websocketsServices.joinFilter(["NewInvite", "pmc", vm.playerInfo.PMC.hashField]); },
							notification: function(data) {
								var inviteN = messagesServices.inviteNotification(data);
								return _.merge(inviteN, {
									body: data.note,
									onClick: function() { messagesServices.askResolveInvite(data, function() { }); }
								});
							},
							notificationData: function(_cb) {
								messagesServices.getReceivedOutfitInvitesSelf({ qLimit: 1 }).then(function(data) {
									return _cb((data ? data.data[0] : false));
								});
							}
						},
						SendNegotiation: {
							onMessage: refreshNavigationOperations,
							filter: function() { return websocketsServices.joinFilter(["SendNegotiation", "pmc", vm.playerInfo.PMC.hashField]); },
							notification: messagesServices.negotiationNotification,
							notificationData: function(_cb) {
								missionsServices.getNegotiationsSelf({ qLimit: 1, qLast: true }).then(function(data) {
									return _cb((data ? data.data[0] : false));
								});
							}
						},
						NewContract: {
							onMessage: refreshNavigationOperations,
							filter: function() { return websocketsServices.joinFilter(["NewContract", "pmc", vm.playerInfo.PMC.hashField]); },
							notification: function(data) { return messagesServices.contractNotification(data, vm.playerInfo); },
							notificationData: function(_cb) {
								missionsServices.getLastSignedContractSelf().then(function(data) {
									return _cb((data ? data.data : false));
								});
							}
						},
						CancelNegotiation: {
							onMessage: refreshNavigationOperations,
							filter: function() { return websocketsServices.joinFilter(["CancelNegotiation", vm.playerInfo.PMC.hashField]); },
							notification: messagesServices.negotiationCancelled
						}
					});
				}

				function refreshNavigationMessages() {
					refreshMessages();
					$rootScope.$broadcast("messagesPage:refresh");
				}

				function refreshNavigationOperations() {
					refreshOperations();
					refreshSideAsync();
					$rootScope.$broadcast("operationsPage:refresh");
				}
			}

			function renderNav() {
				var FADE_TIME = 150;
				switch(vm.navMode) {
					case 1: {
						$("#expand-icon").removeClass("active");
						$("#menu-items").removeClass("show-mobile");

						$("#menu-items").fadeOut(FADE_TIME, function() {
							$("#menu-items").addClass("hide-mobile");
							$("#nav-icons").fadeIn(FADE_TIME);
						});
					} break;
					case 2: {
						$("#expand-icon").addClass("active");

						$("#nav-icons").fadeOut(FADE_TIME, function() {
							$("#menu-items").removeClass("hide-mobile");
							$("#menu-items").fadeIn(FADE_TIME);
							if (vm.isMobile()) $("#menu-items").addClass("show-mobile");
						});
					} break;
				}
			}

			function resizeWindow() {
				var windowWidth = $(window).width();

				if (windowWidth >= 980) {
					var menuItems = $("#menu-items");
					$("#nav-icons").fadeIn();

					menuItems.fadeIn();
					menuItems.addClass("hide-mobile");
					$("#expand-icon").removeClass("active");

					vm.navMode = 1;
				}
			}

			function renderEtcMenu() {
				var cartLength = (vm.currentCart || []),
					rVal = {
					class: {
						"ion-ios-more": (cartLength.length === 0),
						"ion-android-cart": (cartLength.length > 0)
					},
					color: {
						"success": (cartLength.length > 0)
					}
				};
				return rVal;
			}

			function setAlertIcon(obj) {
				var maxKey = _.maxBy(Object.keys(obj), function(o) { return obj[o]; });

				if (obj[maxKey] <= 0) return { icon: "ion-briefcase" };

				switch(maxKey) {
					case "messages": { return { icon: "ion-email-unread" }; } break;
					case "invites": { return { icon: "ion-person-add" }; } break;
					case "invites_pmc": { return { icon: "ion-person-stalker" }; } break;
					case "contracts_done": { return { icon: "ion-trophy", class: "success" }; } break;
					case "contracts_failed": { return { icon: "ion-thumbsdown", class: "danger" }; } break;
					case "negotiations": { return { icon: "ion-arrow-swap", class: "warning" }; } break;
					default: { return { icon: "ion-briefcase" }; } break;
				}
			}

			function refreshMessages() {
				return handleNavAlerts([getMessageCount()], ["message"]);
			}
			function refreshOperations() {
				return handleNavAlerts([getOperationsCount()], ["operation"]);
			}

			function refreshAllAlerts() {
				return handleNavAlerts([getMessageCount(), getOperationsCount()], ["message", "operation"]);
			}

			function handleNavAlerts(promises, modes) {
				return $q.all(promises).then(function(values) {
					var retrieved_data = {}, i, navigationData = {}, relevantAlerts = {};

					for (i = (values.length - 1); i >= 0; i--) {
						retrieved_data[modes[i]] = values[i];
						navigationData = _.merge(navigationData, values[i]);
					}
					vm.navigationData = _.merge(vm.navigationData, navigationData);

					if (apiServices.getToken()) {
						relevantAlerts = {
							messages: vm.navigationData.messages,
							invites: vm.navigationData.receivedPlayer,
							invites_pmc: vm.navigationData.receivedPMC,
							contracts_done: vm.navigationData.contracts.completed,
							contracts_failed: vm.navigationData.contracts.failed,
							negotiations: vm.navigationData.negotiations.active
						};
					} else {
						relevantAlerts = {
							messages: [], invites: [], invites_pmc: [],
							contracts_done: [], contracts_failed: [], negotiations: []
						};
					}

					setTotalAlerts(vm.navigationData);
					vm.alertIcon = setAlertIcon(relevantAlerts);

					vm.dropdownOptions = initializeUIMenus().dropdown_menu;
					return true;
				});
			}

			function getAccountedProperties() {
				return [
					"messages", "receivedPlayer", "receivedPMC",
					"contracts.completed", "contracts.failed", "negotiations.active"
				];
			}

			function setTotalAlerts(navigation_data) {
				var totalAlerts = 0, accountedProperties = getAccountedProperties();
				for (var i = (accountedProperties.length - 1); i >= 0; i--) {
					var cProp = accountedProperties[i];
					totalAlerts += (_.map([navigation_data], _.property(cProp))[0] || 0);
				}
				vm.totalAlerts = totalAlerts;

				uiServices.updateWindowTitleNumber(totalAlerts);
			}

			function extendMenu(event) { $(event.currentTarget).toggleClass('extended'); }
			function toggleNavMode() {
				var curMode = vm.navMode;
				vm.navMode = (curMode === 1 ? 2 : 1);
				renderNav();
				resizeWindow();
			}
			function refreshCurrentCart() {
				vm.currentCart = marketServices.getCart();
				if (vm.currentCart.length > 0) vm.currentCartSize = marketServices.getCartSize();
			}
			function resetCurrentCart() { vm.currentCart = []; }
			function getUIRoute(item) { return (item.route + "(" + JSON.stringify(item.params) + ")"); }
			function setNavMenuState(state) {
				if (vm.isMobile()) {
					vm.navMode = state;
					renderNav();
				}
			}
		}
	}

	function NavDirectiveFunction() {
		return {
			scope: { },
			restrict : "E",
			templateUrl: 'directive/nav.ejs',
			controller: NavDirectiveFunctions,
			controllerAs: "NavController"
		};
	}

	exports.function = NavDirectiveFunction;
})();