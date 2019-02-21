(function() {
	'use strict';

	MarketControllerFunction.$inject = ["$q", "$location", "$stateParams", "$rootScope", "$scope", "$state", "$timeout", "selfInfo", "apiServices", "generalServices", "marketServices", "upgradesServices", "alertsServices", "pmcServices", "uiServices", "fundsServices", "websocketsServices"];

	function MarketControllerFunction($q, $location, $stateParams, $rootScope, $scope, $state, $timeout, selfInfo, apiServices, generalServices, marketServices, upgradesServices, alertsServices, pmcServices, uiServices, fundsServices, websocketsServices) {
		var vm = this; vm.currentView = "";

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

		$q(function(resolve) {
			if (vm.selfInfo.PMC) {
				pmcServices.getSelfPMC().then(function(data) { return resolve(data[0].prestige); });
			} else { return resolve(vm.selfInfo.playerPrestige); }
		}).then(function(prestige) {
			vm.currentPrestige = prestige;

			initializeFunctions();
			initializeVariables();
			initializePage();
			logVariables();
		});

		// =============================================

		function initializePage() {
			var defaultState = (function(state, defaultState) {
				var rUrl = ((state.split(".")[2]));
				return ((rUrl === "market") ? "main" : rUrl);
			})($state.current.name, vm.defaultPage);

			vm.currentCart = marketServices.getCart();
			vm.currentCartSize = marketServices.getCartSize();

			vm.changeView(defaultState);
		}

		function initializeVariables() {
			vm.viewData = {};

			vm.pageViews = {
				main: "main",
				buy: "buy",
				store: "store",
				checkout: "checkout"
			};

			vm.weekDays = apiServices.getWeekDaysDropdown();

			vm.queryValues = {
				page: 1, order: "ASC", sort: "prestige",
				qName: "", qTypes: [], qReqPrestige: { min: 1, max: vm.selfInfo.playerPrestige }
			};

			vm.filterValues = {
				prestige: {
					floor: 1, ceil: 5, step: 1, translate: function(v) { return ("<i class='icon ion-star'></i> " + v); }
				}
			};

			vm.viewController = {
				main: { init: apiServices.nullCbFunction },
				buy: { init: vm.subCtrl.buy },
				store: { init: vm.subCtrl.store },
				checkout: { init: vm.subCtrl.checkout }
			};

			vm.displayFilter = true;
			vm.displayStoreItems = true;
			vm.defaultPage = vm.pageViews.main;
		}

		function initializeFunctions() {
			vm.subCtrl = {};
			vm.subCtrl.buy = subCtrlBuyInit;
			vm.subCtrl.store = subCtrlStoreInit;
			vm.subCtrl.checkout = subCtrlCheckoutInit;

			vm.changeView = changeView;
			vm.loadStore = loadStore;
			vm.readObjectToArray = apiServices.readObjectToArray;
			vm.typeaheadFunction = typeaheadFunction;
			vm.typeaheadSelectFunction = typeaheadSelectFunction;
			vm.storeStoreItemData = storeStoreItemData;
			vm.addToCart = addToCart;
			vm.matchStoreObject = matchStoreObject;
			vm.calculatePrice = calculatePrice;
			vm.confirmBuyItems = confirmBuyItems;
			vm.updateStoreFilters = updateStoreFilters;
			vm.updateURL = updateURL;
			vm.filterQueryInputsStore = filterQueryInputsStore;
			vm.clearStoreItemFilters = clearStoreItemFilters;
			vm.removeFromCart = removeFromCart;
			vm.confirmClearCart = confirmClearCart;
			vm.calculateCartPrice = calculateCartPrice;
			vm.getStoreStatusStyle = getStoreStatusStyle;
			vm.getStoreStatusMessage = getStoreStatusMessage;
			vm.loadStoreView = loadStoreView;
			vm.storeCardClickEvent = storeCardClickEvent;
			vm.closeStoreCard = closeStoreCard;
			vm.validateStoreUpgrades = validateStoreUpgrades;
			vm.checkSingleUpgrade = checkSingleUpgrade;
			vm.displayUpgrade = displayUpgrade;
			vm.getStoreSingleUpgrade = getStoreSingleUpgrade;

			vm.askReportStore = marketServices.askReportStore;
			vm.askReRollStore = askResupplyStore;

			function changeView(view) {
				var cacheView = vm.currentView;
				if (vm.currentView !== view) {
					vm.currentView = "";
					vm.displayPage = false;

					vm.storeStoreItemData().then(function(success1) {
						apiServices.resolveFunction(vm.viewController[view].init).then(function(success) {
							if (success) {
								$timeout(350).then(function(){
									vm.currentView = view;
									$timeout(100).then(function(){vm.displayPage = true;});
								});
							}
						}, function(failed) { $state.go("app.public.market"); });
					});
				}
			}

			function subCtrlBuyInit(_cb) {

				vm.viewData.storeZoom = {};
				vm.viewData.showCard = false;
				vm.viewData.showOverlay = false;

				if ($stateParams.itemFilter) {
					vm.typeaheadSelectFunction({hashField: $stateParams.itemFilter}, true);
					return _cb(true);
				} else {
					vm.updateStoreFilters();

					generalServices.getStores(vm.queryValues).then(function(data) {
						if (data) {
							vm.viewData.storeData = data.data.data;

							vm.viewData.filterToItem = "";
							filterStoreTier();

							if (_cb) return _cb(true);
						} else { if (_cb) return _cb(false); }
					});
				}
			}

			function subCtrlCheckoutInit(_cb) {

				$rootScope.$on("checkoutCtrl:reloadItemsBar", reloadBars);
				function reloadBars() { $timeout(function() { $scope.$broadcast('checkoutCtrl:reloadItemsBar'); }, 1500); }
				reloadBars();

				vm.viewData.storesCost = [];
				vm.viewData.currentCost = 0;
				vm.viewData.displayFinalCost = false;
				vm.currentCart = marketServices.getCart();

				vm.cartFunctions = {
					matchStoreObject: vm.matchStoreObject,
					calculatePrice: vm.calculatePrice
				};

				if (vm.currentCart.length === 0) return _cb(false);

				fundsServices.getCurrentFunds().then(function(funds) {
					vm.viewData.currentFunds = funds;

					marketServices.getCartObjects().then(function(storeItems) {
						vm.currentCartObjects = storeItems;

						vm.viewData.currentCost = vm.calculateCartPrice(storeItems);

						return _cb(true);
					});
				});
			}

			function subCtrlStoreInit(_cb) {
				vm.hasRequiredPrestige = false;
				if (angular.isUndefinedOrNull(vm.viewData.currentStore)) vm.viewData.currentStore = {};

				generalServices.getStore($stateParams.storeHash).then(function(store) {
					if (store) {
						if (store.data.success) {
							vm.viewData.currentStore = store.data.data;
							vm.hasRequiredPrestige = (vm.currentPrestige >= vm.viewData.currentStore.prestigeRequired);
							vm.isAlive = (vm.viewData.currentStore.statusField === 0);

							var cStore = vm.viewData.currentStore;

							vm.viewData.storeHasUpgrades = ((cStore.blacklistedUpgrades.length > 0) || (cStore.requiredUpgrades.length > 0));

							vm.viewData.displayUpgrade = false;

							vm.viewData.ownedUpgradeStatus = getStoreSingleUpgrade(validateStoreUpgrades(vm.viewData.currentStore));

							// console.log("vm.viewData.storeHasUpgrades", vm.viewData.storeHasUpgrades);
							// console.log("vm.viewData.currentStore", vm.viewData.currentStore);
							// console.log("vm.viewData.ownedUpgradeStatus", vm.viewData.ownedUpgradeStatus.valid);

							refreshStoreStock(_cb);

							initializeWebsockets(cStore);

							uiServices.updateWindowTitle([cStore.nameField + " | Store"]);

						} else { return _cb(false); }
					} else { return _cb(false); }
				});

				function initializeWebsockets(store) {
					websocketsServices.initCtrlWS($scope, {
						StoreNewStock: {
							onMessage: function() {
								vm.displayStoreItems = false;
								vm.viewData.currentStore.storeStock = [];

								return refreshStoreStock(function() {
									vm.displayStoreItems = true;
									vm.currentCartSize = marketServices.getCartSize();
									$rootScope.$emit("navbar:refreshCurrentCart");
								});
							},
							filter: function() { return websocketsServices.joinFilter(["StoreNewStock", store.hashField]); }
						}
					});
				}

				function refreshStoreStock(_cb) {
					generalServices.getStoreStock(vm.viewData.currentStore.hashField).then(function(storeData) {
						if (storeData) {
							vm.viewData.currentStore.storeStock = storeData;
							return _cb((storeData !== undefined));
						} else { return _cb(false); }
					});
				}
			}

			function storeCardClickEvent(event) { if (event.target.id === "store-card-container") closeStoreCard(); }

			function checkSingleUpgrade(upgrade, mode) {
				var ownedUpgrades = vm.viewData.selfUpgrades, j, mUpgrade,
					checkFunction = ((mode === 1) ? _.lt : _.gte),
					neutralClass = "success",
					failedClass = ((mode === 1) ? "pulse-background-color-warning-fast" : "pulse-background-color-black-fast");

				for (j in ownedUpgrades)
					if (ownedUpgrades[j].hashField === upgrade.hashField) { mUpgrade = ownedUpgrades[j]; break; }

				if (mUpgrade) {
					var passedCheck = checkFunction(mUpgrade.owned_upgrades.rankField, upgrade.Rank);
					return {
						currentRank: mUpgrade.owned_upgrades.rankField,
						class: (passedCheck ? failedClass : neutralClass)
					};
				} else { return { currentRank: "-", class: ((mode === 1) ? failedClass : neutralClass) }; }
			}

			function checkOwnedUpgrade(upgrade, mode) {
				var ownedUpgrades = vm.viewData.selfUpgrades, i, j, mUpgrade, cUpgrade,
					checkFunction = ((mode === 1) ? _.lt : _.gte);

				if (upgrade.length > 0) {
					for (i in upgrade) {
						cUpgrade = upgrade[i];
						mUpgrade = null;

						for (j in ownedUpgrades) {
							if (ownedUpgrades[j].hashField === cUpgrade.hashField) { mUpgrade = ownedUpgrades[j]; break; }
						}

						if ((!mUpgrade) && (mode === 1)) return true;
						if (mUpgrade) {
							if (checkFunction(mUpgrade.owned_upgrades.rankField, cUpgrade.Rank)) return true;
						}
					}
					return false;
				}
			}

			function validateStoreUpgrades(store) {
				var ownedUpgrades = vm.viewData.selfUpgrades, i, j, mUpgrade, cUpgrade;

				if ((store.blacklistedUpgrades.length === 0) && (store.requiredUpgrades.length === 0)) return { status: 0 };
				if (ownedUpgrades === 0) return { status: 1 };

				if (store.blacklistedUpgrades.length > 0) if ((checkOwnedUpgrade(store.blacklistedUpgrades, 2))) return { status: 2 };
				if (store.requiredUpgrades.length > 0) if ((checkOwnedUpgrade(store.requiredUpgrades, 1))) return { status: 1 };

				return { status: 3 };
			}

			function displayUpgrade() { vm.viewData.displayUpgrade = !(vm.viewData.displayUpgrade); }

			function closeStoreCard() {
				vm.viewData.storeZoom = {};
				vm.viewData.showOverlay = false;
				vm.viewData.showCard = false;
			}

			function loadStoreView(store) {
				vm.viewData.storeZoom = store;
				vm.viewData.showOverlay = true;

				$timeout(600).then(function() { vm.viewData.showCard = true; });
			}

			function askResupplyStore(store) {
				marketServices.askReRollStore().then(function(choice) {
					if (choice) {
						vm.displayStoreItems = false;
						marketServices.doResupplyStore(store.hashField).then(function(data) {
							if (data) {
								generalServices.getStoreStock(vm.viewData.currentStore.hashField).then(function(storeData) {
									if (storeData) {
										vm.viewData.currentStore.storeStock = storeData;
									}
									$timeout(350).then(function(){ vm.displayStoreItems = true; });
								});
							}
						});
					}
				});
			}

			function getStoreSingleUpgrade(upgradeStatus) {
				var paramUpgradeStatus = (angular.isUndefinedOrNull(upgradeStatus) ? 0 : upgradeStatus.status);

				return {
					valid: ((paramUpgradeStatus === 0) || (paramUpgradeStatus === 3)),
					icon: {
						'ion-ios-bolt': (paramUpgradeStatus === 3),
						'ion-flash-off': (paramUpgradeStatus < 3)
					},
					text: ((paramUpgradeStatus === 1) ? "Missing Upgrades" : ((paramUpgradeStatus === 2) ? "Conflicting Upgrades" : "Related Upgrades")),
					button: {
						'no-upgrades': (paramUpgradeStatus === 0),
						'warning': (paramUpgradeStatus === 1),
						'black': (paramUpgradeStatus === 2),
						'success': (paramUpgradeStatus === 3),
						'flashing': (paramUpgradeStatus < 3)
					}
				};
			}

			function getStoreStatusStyle(currentStatus, upgradeStatus) {
				var paramCurrentStatus = (angular.isUndefinedOrNull(currentStatus) ? 0 : currentStatus),
					paramUpgradeStatus = (angular.isUndefinedOrNull(upgradeStatus) ? 0 : upgradeStatus.status);

				return {
					'has-status': (paramCurrentStatus > 0),
					'is-dead': (paramCurrentStatus === 1),
					'is-wounded': (paramCurrentStatus === 2),
					'is-missing': (paramCurrentStatus === 3),

					'has-upgrade': (paramUpgradeStatus > 0),
					'no-upgrades': (paramUpgradeStatus === 0),
					'pulse-border-left-warning-fast': (paramUpgradeStatus === 1),
					'pulse-border-left-black-slow': (paramUpgradeStatus === 2),
					'good-upgrades': (paramUpgradeStatus === 3)
				};
			}

			function getStoreStatusMessage(currentStatus) {
				return (function(v) {
					switch(v) {
						case 1: { return {text: "The owner of this Store has been killed in action. You may no longer purchase any items here.", icon: "ion-eye-disabled"}; } break;
						case 2: { return {text: "The owner of this Store is currently injured. Functioning will resume as normal upon their recovery.", icon: "ion-ios-medical"}; } break;
						case 3: { return {text: "The owner of this Store is currently missing. You may not purchase any items here until they are secured.", icon: "ion-help"}; } break;
						default: { return "Store unavailable."; } break;
					}
				})(currentStatus);
			}

			function filterQueryInputsStore() {
				$stateParams.qName = ((vm.queryValues.qName !== "") ? vm.queryValues.qName : null);
				$stateParams.qPrestigeMin = ((vm.queryValues.qReqPrestige.min !== 1) ? vm.queryValues.qReqPrestige.min : null);
				$stateParams.qPrestigeMax = ((vm.queryValues.qReqPrestige.max !== vm.selfInfo.playerPrestige) ? vm.queryValues.qReqPrestige.max : null);
				$stateParams.qTypes = ((vm.queryValues.qTypes.length > 0) ? vm.queryValues.qTypes.join() : null);
				$stateParams.itemFilter = (vm.viewData.filterToItem ? vm.viewData.filterToItem.hashField : null);

				vm.updateURL("qName", $stateParams.qName);
				vm.updateURL("qPrestigeMin", $stateParams.qPrestigeMin);
				vm.updateURL("qPrestigeMax", $stateParams.qPrestigeMax);
				vm.updateURL("qTypes", $stateParams.qTypes);

				// return vm.subCtrl.buy();
			}

			function updateStoreFilters() {
				if ($stateParams.qName) {
					vm.queryValues.qName = $stateParams.qName;
					vm.updateURL("qName", vm.queryValues.qName);
				}
				if ($stateParams.qPrestigeMin) {
					vm.queryValues.qReqPrestige.min = $stateParams.qPrestigeMin;
					vm.updateURL("qPrestigeMin", vm.queryValues.qReqPrestige.min);
				}
				if ($stateParams.qPrestigeMax) {
					vm.queryValues.qReqPrestige.max = $stateParams.qPrestigeMax;
					vm.updateURL("qPrestigeMax", vm.queryValues.qReqPrestige.max);
				}
				if ($stateParams.qTypes) {
					var nTypes = $stateParams.qTypes.split(',');
					for (var i in nTypes) { nTypes[i] = parseInt(nTypes[i]); }
					vm.queryValues.qTypes = nTypes;
					vm.updateURL("qTypes", $stateParams.qTypes);
				}
			}

			function clearStoreItemFilters() { vm.updateURL("itemFilter", null); }

			function confirmBuyItems() {
				var
					modalOptions = {
						header: { text: 'Confirm purchase', icon: "ion-ios-cart" },
						body: {	text: 'Are you use you want to confirm your purchase?' },
						choices: {
							yes: { text: 'Yes', icon: 'ion-checkmark' },
							no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
						},
						cost: vm.viewData.currentCost
					},newModal = uiServices.createModal('GenericYesNo', modalOptions);

				return newModal.result.then(function(choice) {
					if (choice) {
						vm.viewData.holdPurchaseButton = true;
						generalServices.buyItems({ cart: vm.currentCart }).then(function(data) {
							vm.viewData.holdPurchaseButton = false;
							if (data.valid) {
								marketServices.clearCart();
								alertsServices.addNewAlert("success", "Your purchase was completed successfully!");
								fundsServices.showChangedFunds(data.neededFunds, "subtract");
								$state.go('app.private.dashboard', { page: "inventory" });
							}
						});
					}
					else { return false; }
				});
			}

			function confirmClearCart() {
				var
					modalOptions = {
						header: { text: 'Clear your shopping cart?', icon: "ion-ios-cart-outline" },
						body: {	text: 'Are you use you want to remove all items in your shopping cart? This cannot be undone.' },
						choices: {
							yes: { text: 'Empty cart', icon: 'ion-close', class: "warning" },
							no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
						}
					},newModal = uiServices.createModal('GenericYesNo', modalOptions);
				return newModal.result.then(function(choice) {
					if (choice) {
						marketServices.clearCart();
						$state.go('app.public.buy');
						alertsServices.addNewAlert("warning", "Your shopping cart was cleared.");
					}
					else { return false; }
				});
			}

			function calculatePrice(item, amount, store) {
				var currentPrice = item.currentPrice,
					cDiscount = 0;

				for (var i in item.stores) {
					var cStore = item.stores[i];
					if (cStore.hashField === store) cDiscount = cStore.store_stock.discountField;
				}
				currentPrice = ((currentPrice -= (currentPrice * (cDiscount / 100))) * amount);
				// console.log("Calculating | ", "Original price:", item.currentPrice, "Discount:", cDiscount, "Current price:", currentPrice, "Combined cost:", vm.viewData.currentCost);

				return currentPrice;
			}

			function calculateCartPrice() {
				var i,j, cartSum = 0;

				for (i in vm.currentCart) {
					var storeItems = vm.currentCart[i],
						fStore = vm.matchStoreObject(storeItems.store, 'stores'),
						storeSum = 0;

					for (j in storeItems.items) {
						var cItem = storeItems.items[j],
							fItem = vm.matchStoreObject(cItem.item, 'items'),
							itemCost = vm.calculatePrice(fItem, cItem.amount, storeItems.store);
							storeSum += itemCost;
					}
					cartSum += storeSum;
					vm.viewData.storesCost.push(storeSum);
				}

				return cartSum;
			}

			function updateURL(property, value) {
				$stateParams[property] = value;
				$state.params[property] = value;
				$location.search(property, value);
			}

			function matchStoreObject(hash, mode) {
				for (var i in vm.currentCartObjects[mode]) {
					var cCart = vm.currentCartObjects[mode][i];
					if (cCart.hashField === hash) return cCart;
				}
			}

			function loadStore(store) {
				vm.viewData.currentStore = store;
				vm.changeView(vm.pageViews.store);
			}

			function filterStoreTier(_cb) {
				var i, storeI;
				vm.viewData.storeTiers = {};

				for (i in vm.viewData.storeData) {
					storeI = vm.viewData.storeData[i];
					vm.viewData.storeTiers[storeI.prestigeRequired] = [];
				}
				for (i in vm.viewData.storeData) {
					storeI = vm.viewData.storeData[i];
					vm.viewData.storeTiers[storeI.prestigeRequired].push(storeI);
				}
			}

			function typeaheadFunction(val) {
				return generalServices.getItemsTypeahead({ qName: val }).then(function(response) {
					if (response.data.success) return response.data.data.map(function(item) {

						item.contentField = vm.viewData.itemContent[item.contentField].text;
						item.classField = vm.viewData.itemsTypeClass.classField[item.classField].name;
						item.typeField = vm.viewData.itemsTypeClass.typeField[item.typeField].name;

						return item;
					});
				});
			}

			function typeaheadSelectFunction(item, forceQuery) {
				var
					noItemFromState = (!($stateParams.itemFilter)),
					chosenItemNotStateItem = (item.hashField !== $stateParams.itemFilter),
					loadingItemFromState = (item.hashField === $stateParams.itemFilter),
					waitFetch = 300, skipQuery = true;

				// console.log("noItemFromState:", noItemFromState, "chosenItemNotStateItem:", chosenItemNotStateItem);

				if (noItemFromState || chosenItemNotStateItem) {
					vm.viewData.filterToItem = null;
					vm.viewData.storeData = null;
					filterStoreTier();
					waitFetch = 1000;
					skipQuery = false;
				}

				if ((!skipQuery) || forceQuery) {
					generalServices.getStoreFromItem(item.hashField).then(function(itemT) {
						vm.viewData.filterToItem = itemT;
						vm.updateURL("itemFilter", item.hashField);

						$timeout(1000).then(function() {
							vm.viewData.storeData = vm.viewData.filterToItem.stores;
							vm.viewData.storeData = (vm.viewData.storeData ? vm.viewData.storeData : []);
							filterStoreTier();
						});
					});
				}

			}

			function addToCart(item, amount) {
				marketServices.addToCart(vm.viewData.currentStore.hashField, item, (amount || 1));
				vm.currentCartSize = marketServices.getCartSize();
			}

			function removeFromCart(store, item) {
				marketServices.removeFromCart(store.hashField, item.hashField);
				vm.currentCartSize = marketServices.getCartSize();
			}

			function storeStoreItemData() {
				return $q(function(resolve) {
					if (angular.isUndefinedOrNull(vm.viewData.storeSpecializations)) {
						generalServices.getStoreSpecializations().then(function(storespec) {
							generalServices.getItemsTypeClass().then(function(itemsClass) {
								generalServices.getStoreStatuses().then(function(statuses) {
									generalServices.getItemContent().then(function(content) {
										upgradesServices.getUpgradesSelf().then(function(selfUpgrades) {
											if (storespec && statuses) {
												vm.viewData.selfUpgrades = selfUpgrades;
												vm.viewData.storeSpecializations = storespec.typesField;
												vm.viewData.storeStatuses = statuses;
												vm.viewData.itemsTypeClass = itemsClass;
												vm.viewData.itemContent = content;

												vm.viewData.selfUpgrades = upgradesServices.resetOwnedUpgradesProperties(vm.viewData.selfUpgrades);

												return resolve(true);
											} else { return resolve(false); }
										});
									});
								});
							});
						});
					} else { return resolve(true); }
				});
			}
		}

		function logVariables() {
			// console.log("vm.currentPrestige", vm.currentPrestige);
			// console.log("vm.viewData.selfInfo", vm.viewData.selfInfo);
			// console.log("$state", $state);
		}
	}

	exports.function = MarketControllerFunction;
})();