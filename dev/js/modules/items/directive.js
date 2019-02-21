(function() {
	'use strict';

	ItemsDirectiveFunctions.$inject = ["$rootScope", "$scope", "$timeout", "apiServices", "generalServices", "marketServices", "loadoutsServices", "uiServices", "fundsServices", "upgradesServices", "alertsServices"];

	function ItemsDirectiveFunctions($rootScope, $scope, $timeout, apiServices, generalServices, marketServices, loadoutsServices, uiServices, fundsServices, upgradesServices, alertsServices) {
		var vm = this;

		vm.itemList = ($scope.itemList || []);
		vm.displayMode = $scope.displayMode;
		vm.onBuy = ($scope.onBuy || null);
		vm.allowInspect = (angular.isUndefinedOrNull($scope.allowInspect) ? true : $scope.allowInspect);
		vm.extraFunctions = $scope.extraFunctions;
		vm.currentStore = $scope.currentStore;
		vm.removeFromCart = removeFromCart;
		vm.enablePurchase = (angular.isUndefinedOrNull($scope.enablePurchase) ? true : $scope.enablePurchase);
		vm.displayFilters = (!(apiServices.inArray(vm.displayMode, ['checkout', 'query'])));
		vm.bodyOnly = ((apiServices.inArray(vm.displayMode, ['query'])));
		vm.setBGPicture = apiServices.setBGPicture;

		vm.checkoutInit = checkoutInit;
		vm.getThumbnailSize = getThumbnailSize;
		vm.itemInCart = itemInCart;
		vm.addToCart = addToCart;
		vm.deployItem = deployItem;
		vm.getDeploymentStatus = getDeploymentStatus;
		vm.typeFiltered = typeFiltered;
		vm.expandItemDetails = expandItemDetails;
		vm.getNoItemStatus = getNoItemStatus;
		vm.changeFilter = changeFilter;
		vm.canAirDrop = canAirDrop;
		vm.hasAirDropUpgrade = hasAirDropUpgrade;
		vm.canDeploy = canDeploy;
		vm.airDropItem = airDropItem;
		vm.displayLoadouts = displayLoadouts;
		vm.getItemGridSize = getItemGridSize;
		vm.cancelDeployment = cancelDeployment;
		vm.showNewLoadoutField = showNewLoadoutField;
		vm.getDeployedAmount = getDeployedAmount;
		vm.saveCurrentLoadout = saveCurrentLoadout;
		vm.askDeleteLoadout = askDeleteLoadout;
		vm.askLoadLoadout = askLoadLoadout;
		vm.askResetLoadout = askResetLoadout;
		vm.askSaveLoadout = askSaveLoadout;
		vm.assignLoadout = assignLoadout;
		vm.openItemMenu = openItemMenu;
		vm.resetAllDeployments = resetAllDeployments;
		vm.resetAllDeploymentsInterface = resetAllDeploymentsInterface;
		vm.checkForExistingLoadout = checkForExistingLoadout;
		vm.getSelfLoadouts = getSelfLoadouts;
		vm.bookmarkLoadout = bookmarkLoadout;
		vm.exportLoadout = exportLoadout;
		vm.importLoadout = importLoadout;
		vm.getTypeIcon = getTypeIcon;

		vm.currentCart = marketServices.getCart();
		vm.minMax = minMax;
		vm.doMax = doMax;

		vm.filterInput = {
			mainFilter: "",
			typeFilter: []
		};
		vm.filterValues = {
			types: [],
			classes: []
		};
		vm.newLoadoutModels = {
			nameField: "",
			descriptionField: "",
			updatingExistingLoadout: false
		};

		initDirective();

		function initDirective() {
			vm.displayItems = false;
			vm.onlyDeployed = false;
			vm.showLoadouts = false;
			vm.addNewLoadout = false;
			vm.loadoutList = [];

			if (vm.itemList.length > 0) {
				if (vm.itemList[0].name) remapItemProperties();
				initializeItemValues();
			}

			generalServices.getItemsTypeClass().then(function(itemsClass) {
				generalServices.getItemContent().then(function(content) {
						upgradesServices.getUpgradesSelf().then(function(upgrades) {
							generalServices.getStoreSpecializations().then(function(storespec) {
							vm.filterValues.classes  = itemsClass.classField;
							vm.filterValues.types = itemsClass.typeField;
							vm.ownedUpgrades = upgradesServices.resetOwnedUpgradesProperties(upgrades);
							vm.contentData = content;
							vm.contentData.storeSpecializations = storespec.typesField;

							$timeout(550).then(function() {
								vm.displayItems = true;
								doMasonry(350);
								vm.currentlyDeployedAmount = vm.getDeployedAmount();
							});
						});
					});
				});
			});

			vm.getSelfLoadouts();
		}

		function getSelfLoadouts() {
			if (vm.displayMode === "inventory") {
				loadoutsServices.getSelfLoadouts().then(function(loadouts) { vm.loadoutList = loadouts; });
			}
		}

		function checkForExistingLoadout() {
			vm.newLoadoutModels.updatingExistingLoadout = false;
			for (var i in vm.loadoutList) {
				if (vm.newLoadoutModels.nameField === vm.loadoutList[i].nameField) {
					vm.newLoadoutModels.updatingExistingLoadout = true;
					break;
				}
			}
		}

		function saveCurrentLoadout() {
			var i, savedItems = [];
			for (i in vm.itemList) {
				var cItem = vm.itemList[i];
				if (cItem.isDeployed) savedItems.push([cItem.hashField, cItem.deployedAmount]);
			}

			if (savedItems.length > 0) {
				var lM = vm.newLoadoutModels;
				loadoutsServices.addLoadout(lM.nameField, lM.descriptionField, savedItems).then(function(data) {
					if (data.success) {
						vm.newLoadoutModels.nameField = "";
						vm.newLoadoutModels.descriptionField = "";
						displayLoadouts();
					}
				});
			}
		}

		function getDeployedAmount() {
			var i, fCount = 0;
			for (i in vm.itemList) { if (vm.itemList[i].isDeployed) fCount++; }
			return fCount;
		}

		function showNewLoadoutField() {
			vm.addNewLoadout = !(vm.addNewLoadout);
			vm.showLoadouts = false;
			vm.currentlyDeployedAmount = vm.getDeployedAmount();
		}

		function bookmarkLoadout(item) {
			return loadoutsServices.toggleLoadoutBookmark(item.hashField).then(function() { item.bookmarkField = !(item.bookmarkField); });
		}

		function displayLoadouts() {
			vm.addNewLoadout = false;
			vm.showLoadouts = !(vm.showLoadouts);
			if (vm.showLoadouts) vm.getSelfLoadouts();
		}

		function doMasonry(timer) {
			if (vm.displayMode !== "checkout") {
				if (vm.itemList.length > 0) {
					$timeout(function() {
						uiServices.uiMasonry(".items-container", {
							itemSelector: ".item-container", columnWidth: 1, percentPosition: false
						});
						$timeout(function() { $scope.$broadcast('itemDirective:reloadDescriptionBar'); }, 1);
					}, (timer || 500));
				}
			}
		}

		function changeFilter() { doMasonry(); }

		function checkoutInit(item) {
			var rV = null;
			if (vm.displayMode === "checkout") rV = vm.extraFunctions.matchStoreObject(item, 'items');
			return rV;
		}

		function getTypeIcon(type) {
			var sT = vm.contentData.storeSpecializations;
			switch(type) {
				case "0": { return sT[0].icon; } break;
				case "1": { return "ion-ios-box"; } break;
				case "2": { return "ion-ios-cog"; } break;
				case "3": { return sT[1].icon; } break;
				case "4": { return sT[2].icon; } break;
				case "5": { return sT[3].icon; } break;
				case "6": { return sT[4].icon; } break;
				case "7": { return sT[5].icon; } break;
				case "8": { return sT[6].icon; } break;
				case "9": { return sT[6].icon; } break;
			}
		}

		function getItemGridSize(type, pclass) {
			switch(type) {
				default: {
					return ("type-" + type + " class-" + pclass);
				} break;
			}
		}

		function openItemMenu(item) {
			var SAFE_MARGIN = ((15 * 2) + 3),
				MENU_SIZE = 150,
				OVERSPACE_CLASS = "over-spaced",

				containerEl = $(".items-container.inventory"),
				containerWidth = containerEl.width(),
				containerLeft = containerEl.offset().left,
				realSpace = (containerWidth + SAFE_MARGIN),
				bodyDiv = containerEl.find((".body#item-" + item.itemId)),

				el = $(bodyDiv),
				parentObj = $($(el.parent(".item-container"))[0]),
				eWidth = parentObj.outerWidth(),
				eLeft = parentObj.position().left,
				finalSpace = ((eLeft + eWidth) + MENU_SIZE),
				isOverSpace = (finalSpace >= realSpace),
				hasClass = el.hasClass(OVERSPACE_CLASS),
				classFnc = (isOverSpace ? "addClass" : "removeClass"),
				actionTimer = ((isOverSpace || hasClass) ? 0 : 150);

			// $timeout(actionTimer).then(function(){ el[classFnc](OVERSPACE_CLASS); });

			el[classFnc](OVERSPACE_CLASS);

			$timeout(100).then(function(){ item.showItemBody = (!item.showItemBody); });

			// console.log("New Menu:");
			// console.log("	Container --- ", "Width:", containerWidth, "Left:", containerLeft);
			// console.log("	Body 	  --- ", "Width:", eWidth, "Left:", eLeft);
			// console.log("Real Space", realSpace, "Final Space", finalSpace, "TOO FAR", isOverSpace, "Excess:", (realSpace - finalSpace));
		}

		function expandItemDetails(item) {
			var modalOptions = {
				itemDetails: item,
				classes: vm.filterValues.classes,
				types: vm.filterValues.types,
				content: vm.contentData
			}, newModal = uiServices.createModal('DisplayItem', modalOptions);
		}

		function initializeItemValues() {
			for (var i in vm.itemList) {
				var cItem = vm.itemList[i];
				cItem.isToggled = false;
				cItem.hideItem = false;
				if (vm.displayMode === "inventory") {
					cItem.initialDeployed = cItem.deployedAmount;
					cItem.deployingMode = (cItem.deployedAmount > 0);
					cItem.isDeployed = (cItem.deployedAmount > 0);
				}
			}
		}

		function canDeploy(item) { return ((item.deployableField) && (item.typeField !== "4") && (item.typeField !== "5")); }
		function canAirDrop(item) { return ((item.deployableField === 0) && ((item.typeField === "4") || (item.typeField === "5"))); }

		function hasAirDropUpgrade() { return upgradesServices.checkUpgradesOwnedPre(vm.ownedUpgrades, "ff80e5f8cea5475b471b", 1); }

		function minMax(min, max, item, value) { item[value] = (apiServices.minMax(min, max, item[value]) || 1); }
		function doMax(max, item, value) { item[value] = (Math.min(item[value], max)); }

		function typeFiltered(type) { return ((_.indexOf(vm.filterInput.typeFilter, parseInt(type)) > -1) || (vm.filterInput.typeFilter.length === 0)); }

		function getDeploymentStatus(item, pClass) {
			var rV = {
				deployButtonClass: {
					"success": item.isDeployed,
					"muted": !(item.isDeployed)
				},
				deployButtonIcon: {
					'ion-archive': item.isDeployed,
					'ion-minus': !(item.isDeployed)
				},
				deployText: (item.isDeployed ? "Deployed" : "Deploy")
			};
			return rV[pClass];
		}

		function resetAllDeployments() {
			loadoutsServices.resetDeployedItems().then(function() {
				vm.resetAllDeploymentsInterface(true);
			});
		}

		function resetAllDeploymentsInterface(callMasonry) {
			for (var j in vm.itemList) {
				var lItem = vm.itemList[j];
				lItem.deployingMode = false;
				lItem.isDeployed = false;
				lItem.deployedAmount = 0;
			}
			vm.currentlyDeployedAmount = 0;
			vm.onlyDeployed = false;
			vm.newLoadoutModels.nameField = "";

			if (callMasonry) doMasonry();
		}

		function assignLoadout(loadout) {
			var cContent = loadout.contentField, i, j, lItem;

			loadoutsServices.deployLoadout(loadout.hashField).then(function(done) {
				if (done.success) {
					vm.resetAllDeploymentsInterface();

					for (i in cContent) {
						var lContent = cContent[i];

						for (j in vm.itemList) {
							lItem = vm.itemList[j];

							if (lContent[0] === lItem.hashField) {
								var finalAmount = Math.min(parseInt(lContent[1]), lItem.amountOwned);
								lItem.isDeployed = true;
								lItem.deployingMode = true;
								lItem.initialDeployed = finalAmount;
								lItem.deployedAmount = finalAmount;
								vm.currentlyDeployedAmount++;
							}
						}
					}
					vm.newLoadoutModels.nameField = loadout.nameField;
					vm.showLoadouts = false;
					vm.onlyDeployed = true;
					vm.checkForExistingLoadout();
					doMasonry();
				}
			});
		}

		vm.expandIcons = function(object) {
			// object.deployingViewMode = true;
			object.deployingMode = true;
		};

		function deployItem(item, amount) {
			if (amount > 0) {
				generalServices.deployItem(item.hashField, amount).then(function(data) {
					if (data) {
						var isDeployed = (data.data.data.deployedAmount > 0);
						item.isDeployed = isDeployed;
						item.initialDeployed = amount;
						vm.currentlyDeployedAmount++;
						openItemMenu(item);
						doMasonry();
					}
				});
			} else { item.deployingMode = false; }
		}

		function cancelDeployment(item) {
			if (item.isDeployed) {
				generalServices.deployItem(item.hashField, 0).then(function(data) {
					if (data) {
						var isDeployed = (data.data.data.deployedAmount > 0);
						item.isDeployed = isDeployed;
						item.deployingMode = false;
						item.initialDeployed = 0;
						vm.currentlyDeployedAmount--;
						openItemMenu(item);
						doMasonry();
					}
				});
			} else {
				item.deployingMode = false;
			}
		}

		function askDeleteLoadout(item) {
			var
				modalOptions = {
					item: item,
					header: { text: 'Delete loadout?', icon: "ion-android-archive" },
					body: {	text: 'Are you sure you want to delete the loadout [' + item.nameField + ']?' },
					choices: {
						yes: { text: 'Delete', icon: 'ion-trash-a', class: "warning" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					loadoutsServices.deleteLoadout(item.hashField).then(function(data) {
						if (data.success) alertsServices.addNewAlert("warning", "Loadout [" + item.nameField + "] has been deleted.");
						loadoutsServices.getSelfLoadouts().then(function(loadouts) { vm.loadoutList = loadouts; });
					});
				}
				else { return false; }
			});
		}

		function askSaveLoadout(overwrite) {
			var
				nameField = vm.newLoadoutModels.nameField,
				modalOptions = {
					header: {
						text: (overwrite ? 'Overwrite loadout?' : 'Create loadout'),
						icon: (overwrite ? "ion-android-archive" : 'ion-edit')
					},
					body: {
						text: (overwrite ?
							'Are you sure you want to overwrite the loadout [' + nameField + ']?' :
							'Are you sure you want to create a loadout named [' + nameField + ']?'
						)
					},
					choices: {
						yes: {
							text: (overwrite ? 'Overwrite' : 'Create'),
							icon: (overwrite ? 'ion-edit' : 'ion-plus'),
							class: (overwrite ? "warning" : 'success')
						},
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) vm.saveCurrentLoadout();
				else { return false; }
			});
		}

		function exportLoadout(loadout) {
			var simpleEncrypt = new SimpleCryptoJS.default("LOADOUTKEY"),
				savedObject = {
					nameField: loadout.nameField,
					descriptionField: loadout.descriptionField,
					contentField: loadout.contentField
				},
				modalOptions = {
					specialMode: "eximport-loadout",
					hashedLoadout: simpleEncrypt.encryptObject(savedObject),
					header: { text: 'Export Loadout', icon: "ion-share" },
					body: {	text: 'Share your custom Loadout as the code below:' },
					choices: {
						yes: { text: 'Done', icon: 'ion-checkmark', class: "success" }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {}
				else { return false; }
			});
		}

		function importLoadout() {
			var
				modalOptions = {
					specialMode: "eximport-loadout",
					header: { text: 'Import Loadout', icon: "ion-ios-download" },
					body: {	text: 'Paste the Loadout code you wish to import below:' },
					choices: {
						yes: { text: 'Import', icon: 'ion-checkmark', class: "success" }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					if (choice.data) {
						loadoutsServices.addLoadout(choice.data.nameField, choice.data.descriptionField, choice.data.contentField).then(function(data) {
							if (data.success) {
								vm.newLoadoutModels.nameField = "";
								vm.newLoadoutModels.descriptionField = "";
								displayLoadouts();
								alertsServices.addNewAlert("success", "Loadout [" + choice.data.nameField + "] imported successfully.");
							}
						});
					}
				}
				else { return false; }
			});
		}


		function askLoadLoadout(item) {
			var
				modalOptions = {
					item: item,
					header: { text: 'Assign Loadout?', icon: "ion-android-archive" },
					body: {	text: 'Are you sure you want to assign the loadout [' + item.nameField + ']?' },
					choices: {
						yes: { text: 'Assign', icon: 'ion-checkmark', class: "success" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) vm.assignLoadout(item);
				else { return false; }
			});
		}

		function askResetLoadout(item) {
			var
				modalOptions = {
					item: item,
					header: { text: 'Reset current loadout?', icon: "ion-ios-filing-outline" },
					body: {	text: 'Are you sure you want to reset your currently deployed items?' },
					choices: {
						yes: { text: 'Reset', icon: 'ion-checkmark', class: "warning" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					vm.resetAllDeployments(true);
					alertsServices.addNewAlert("warning", "All deployed items reset.");
				}
				else { return false; }
			});
		}

		function airDropItem(item) {
			var
				finalCost = (item.valueField / 4),
				modalOptions = {
					specialMode: "air-drop",
					item: item,
					header: { text: 'Airdrop Item', icon: "ion-ios-box" },
					body: {	text: '' },
					choices: {
						yes: { text: 'Deploy', icon: 'ion-plane', class: "success" },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
					cost: finalCost
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) {
					if (choice.result) {
						var combinedGrid = (choice.data.gridRef1 + "-" + choice.data.gridRef2);

						generalServices.requestAirdrop(item, combinedGrid, choice.data.smokeColor).then(function(result) {
							if (result) {
								fundsServices.showChangedFunds(result, "subtract");
								item.amountOwned--;
								if (item.amountOwned <= 0) item.hideItem = true;
								doMasonry();
								alertsServices.addNewAlert("success", item.nameField + " has been air-dropped to battlefield.");
							}
						});
					}
				}
				else { return false; }
			});
		}

		function getNoItemStatus() {
			var rVal = (function(mode) {
				switch(mode) {
					case "checkout": { return "You have no items in your cart."; } break;
					case "inventory": { return "Your inventory is empty."; } break;
					case "purchase": { return "This Store has no items."; } break;
					default: { return "No items to display."; }
				}
			})(vm.displayMode);

			return rVal;
		}

		function addToCart(doCall, item) {
			var itemProp = (function(mode) {
				switch(mode) {
					case "checkout": { return "amount"; } break;
					default: { return "currentBoughtAmount"; }
				}
			})(vm.displayMode);

			if (doCall) {
				vm.onBuy(item.hashField, item[itemProp]);
				$timeout(50).then(function() { vm.currentCart = marketServices.getCart(); });
			} else { item.isPurchased = true; }
		}

		function removeFromCart(store, item) {
			$scope.removeCart(store, item);
			$timeout(50).then(function() { item.isPurchased = false; });
		}

		function getThumbnailSize() {
			return (function(mode) {
				switch(mode) {
					default: { return 150; }
				}
			})(vm.displayMode);
		}

		function itemInCart(item) {
			var i, sIndex = -1, storeHash = vm.currentStore.hashField;
			for (i in vm.currentCart) { if (vm.currentCart[i].store === storeHash) sIndex = i; }
			if (sIndex > -1) for (i in vm.currentCart[sIndex].items) {
				if (vm.currentCart[sIndex].items[i].item === item.hashField) {
					return {found: true, amount: vm.currentCart[sIndex].items[i].amount};
				}
			}
			return {found: false};
		}

		function remapItemProperties() {
			var newItem = [];

			for (var i in vm.itemList) {
				var cItem = vm.itemList[i];
				newItem[i] = {};

				newItem[i].nameField = cItem.name;
				newItem[i].classnameField = cItem.classname;
				newItem[i].contentField = cItem.content;
				newItem[i].descriptionField = cItem.description;
				newItem[i].typeField = cItem.type;
				newItem[i].classField = cItem.class;
				newItem[i].currentPrice = cItem.current_price;
				newItem[i].deployableField = cItem.deployable;
				newItem[i].infoField = cItem.info;
				newItem[i].productionYear = cItem.production_year;
				newItem[i].detailField1 = cItem.detail_1;
				newItem[i].detailField2 = cItem.detail_2;
				newItem[i].detailField3 = cItem.detail_3;
				newItem[i].detailField4 = cItem.detail_4;
				newItem[i].detailField5 = cItem.detail_5;
				newItem[i].hashField = cItem.hashField;

				newItem[i].amountField = cItem.amount;
				newItem[i].availableField = cItem.available;
				newItem[i].storePrice = cItem.store_price;
				newItem[i].storeDiscount = cItem.store_discount;

				var inCart = vm.itemInCart(cItem);

				if (inCart) {
					if (vm.enablePurchase) {
						newItem[i].isPurchased = inCart.found;
						newItem[i].currentBoughtAmount = (inCart.found ? parseInt(inCart.amount) : 1);
					} else {
						vm.removeFromCart(vm.currentStore, newItem[i]);
					}
				}
			}
			vm.itemList = newItem;
		}
	}

	function ItemsDirectiveFunction() {
		return {
			scope: {
				itemList: "=",
				displayMode: "@",
				onBuy: "=",
				removeCart: "=",
				extraFunctions: "=",
				currentStore: "=",
				enablePurchase: "=",
				allowInspect: "="
			},
			restrict : "E",
			templateUrl: "directive/items.ejs",
			controller: ItemsDirectiveFunctions,
			controllerAs: "CtrlDirectiveItems"
		};
	}

	exports.function = ItemsDirectiveFunction;
})();