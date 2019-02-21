(function() {
	'use strict';

	UpgradesServicesFunction.$inject = ["$rootScope", "$injector", "$timeout", "$cookies", "$q", "apiServices", "uiServices"];

	function UpgradesServicesFunction($rootScope, $injector, $timeout, $cookies, $q, apiServices, uiServices) {

		var methods = {
			getUpgrade: getUpgrade,
			getUpgrades: getUpgrades,
			getUpgradesData: getUpgradesData,
			resetOwnedUpgradesProperties: resetOwnedUpgradesProperties,
			getUpgradesSimple: getUpgradesSimple,
			getUpgradeTree: getUpgradeTree,
			openUpgradeImages: openUpgradeImages,
			getUpgradesSelf: getUpgradesSelf,
			getProminentUpgradesSelf: getProminentUpgradesSelf,
			checkUpgradeOwned: checkUpgradeOwned,
			checkUpgradesOwnedPre: checkUpgradesOwnedPre,
			upgradeScrnRndrZoom: upgradeScrnRndrZoom,
			initDraggingOnScreen: initDraggingOnScreen,
			createNewUpgradeIcon: createNewUpgradeIcon,
			checkOwnedUpgrade: checkOwnedUpgrade,
			validateUpgrades: validateUpgrades,
			validUpgradeType: validUpgradeType,
			confirmBuyUpgrade: confirmBuyUpgrade,
			saveScrollPosition: saveScrollPosition,
			styleUpgradeScreen: styleUpgradeScreen,
			confirmRespecTree: confirmRespecTree,
			respecTree: respecTree,
			centerOnUpgrade: centerOnUpgrade,
			moveZoomScreen: moveZoomScreen,
			setProminenceClass: setProminenceClass,
			getRankComplete: getRankComplete,
			resetAllVisibility: resetAllVisibility,
			toggleProminentVisible: toggleProminentVisible,
			getModalText: getModalText,
			askToggleStatus: askToggleStatus,
			invokeUpgradeModule: invokeUpgradeModule
		},
		screenProperties = { maxSize: 2, minSize: 0.5 },
		apiAnchor = "/api/generalactions/";

		function getUpgrade(hash) { return apiServices.getInfo(apiAnchor + "getUpgrade/" + (hash || "")); }

		function getUpgradesSelf(params) { return (apiServices.getToken() ? apiServices.getQuerySimple(apiAnchor + "getUpgradesSelf", params) : $q(function(a){a([]);})); }
		function getProminentUpgradesSelf(params) { return (apiServices.getToken() ? apiServices.getQuerySimple(apiAnchor + "getProminentUpgradesSelf", params) : $q(function(a){a([]);})); }

		function getUpgrades(qParams) { return apiServices.requestGET({url: apiAnchor + "getUpgrades/", params: (qParams || {})});}
		function getUpgradesSimple(qParams) { return apiServices.requestGET({url: apiAnchor + "getUpgradesSimple/", params: (qParams || {})});}
		function getUpgradeTree(qParams) { return apiServices.requestGET({url: apiAnchor + "getUpgradeTree/", params: (qParams || {}), cache: true});}
		function getUpgradesData(hash) { return apiServices.getInfo(apiAnchor + "getUpgradesData/", true); }

		function checkUpgradeOwned(hash, rank) { return apiServices.getInfo(apiAnchor + "checkUpgradeOwned/" + (hash || "") + "/" + (rank || "0")); }

		function checkUpgradesOwnedPre(upgrades, hash, rank) {
			var ownedStatus = { valid: false, rank: 0 };
			for (var i in upgrades)
				if (upgrades[i].hashField === hash) ownedStatus = { rank: upgrades[i].owned_upgrades.rankField, valid: (upgrades[i].owned_upgrades.rankField >= rank) };

			return ownedStatus;
		}

		function resetOwnedUpgradesProperties(ownedUpgrades) {
			var rV = [];
			for (var i = ownedUpgrades.length - 1; i >= 0; i--) {
				ownedUpgrades[i].owned_upgrades = ownedUpgrades[i].owned_upgrade;
				rV.push(ownedUpgrades[i]);
			}
			return rV;
		}

		function invokeUpgradeModule(slug) {
			var subCtrl = { module: "upgrades", folder: "subcontrollers", file: slug },
			upgradeSubCtrl = apiServices.loadSubModule(subCtrl);
		}

		function purchaseUpgrade(hash) {
			return apiServices.requestPOST({url: (apiAnchor + "buyUpgrade"), data: {upgrade: hash} }).then(function(data) {
				return apiServices.handleRequestData(data);
			});
		}

		function toggleProminentVisible(data, methods) {
			methods.rs();
			var request = { url: (apiAnchor + "toggleUpgradeProminence"), data: data };
			return apiServices.requestPOST(request).then(methods.rl);
		}

		function resetAllVisibility(methods) {
			methods.rs();
			var request = { url: (apiAnchor + "setUpgradesInvisibleAll") };
			return apiServices.requestPOST(request).then(methods.rl);
		}

		function askToggleStatus(modalParam) {
			var modalOptions = {
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				}, newModal = uiServices.createModal('GenericYesNo', _.merge(modalOptions, modalParam));
			return newModal.result.then(function(choice) {
				if (choice) { return true; }
				else { return false; }
			});
		}

		function getModalText(upgrade, mode) {
			switch(mode) {
				case 1: {
					var isVisible = (upgrade.owned_upgrade.visibleField);
					return {
						header: {
							text: ((isVisible ? "Disable" : "Enable") + " Upgrade Visibility"),
							icon: (isVisible ? "ion-eye-disabled" : "ion-eye-disabled")
						},
						body: { text: "Are you sure you want to toggle [" + upgrade.nameField + "]'s visibility?" }
					};
				} break;
				case 2: {
					var isProminent = (upgrade.owned_upgrade.prominentField),
						words = isProminent ? ["remove", "as"] : ["make", "into"];
					return {
						header: {
							text: ((isProminent ? "Un-Favorite" : "Favorite") + " Upgrade"),
							icon: (isProminent ? "ion-ios-star-outline" : "ion-ios-star")
						},
						body: { text: "Are you sure you want to " + words[0] + " [" + upgrade.nameField + "] " + words[1] + " your favorite Upgrade?" }
					};
				} break;
				case 3: {
					return {
						header: { text: "Reset visible Upgrades" , icon: "ion-eye-disabled" },
						body: { text: "Are you sure you want to reset all currently visible Upgrades?" },
						choices: { yes: { class: "warning" } }
					};
				}
			}
		}

		function getRankComplete(upgrade) { return { "complete": (upgrade.owned_upgrade.rankField >= upgrade.maxTier) }; }

		function setProminenceClass(upgrade, pClass) {
			var isProminent = (upgrade.owned_upgrade.prominentField),
				isVisible = (upgrade.owned_upgrade.visibleField);
			switch(pClass) {
				case 1: {
					return { "ion-eye-disabled": isVisible, "ion-eye": !(isVisible) };
				} break;
				case 2: {
					return { "ion-ios-star-outline": isProminent, "ion-ios-star": !(isProminent) };
				} break;
				default: { return { "prominent": isProminent, "visible": isVisible }; } break;
			}
		}

		function respecTree(hash) {
			return apiServices.requestPOST({url: (apiAnchor + "reSpecTree/" + (hash || ""))}).then(function(data) {
				return apiServices.handleRequestData(data);
			});
		}

		function styleUpgradeScreen() {
			return {
				start: function() {
					$("body").addClass("white-bg");
				},
				end: function() {
					$("body").removeClass("white-bg");
				}
			};
		}

		function saveScrollPosition() {
			var
			mainElement = $("#upgrades-translate-area"),
			zoomElement = $("#upgrades-zoom-area"),
			currentScale = (uiServices.getTransformScale(zoomElement.css("transform")).scale.x),
			currentPos = (uiServices.getTransformScale(mainElement.css("transform")).translate),
			savedPosition = { x: currentPos.x, y: currentPos.y, zoom: currentScale };

			$cookies.put("upgradeScreen:savedPosition", JSON.stringify(savedPosition));
		}

		function createNewUpgradeIcon(pOwnedUpgrades, totalItems, index, parent, upgrade, isMainParent) {
			var i, ownedRank = 0,
				newIcon = $("<div/>", {
					class: "single-upgrade " + upgrade.slugField,
					id: ("upgrade-icon-" + upgrade.hashField)
					/* href: ("upgrade/" + upgrade.hashField) */
				}),
				newImage = $("<div />", { class: "upgrade-icon" }),
				newText = $("<div />", { text: upgrade.nameField, class: "upgrade-text" }),
				newRankList = $("<ul />", { class: "rank-tier-container" }),
				spreadAngle = (isMainParent ? 360 : 120),
				halveAngle = (isMainParent ? 1 : 2);

			newImage.css({"background-image": "url('/images/modules/upgrades/main_" + upgrade.iconName + ".png')"});

			newImage.appendTo(newIcon);
			newText.appendTo(newIcon);
			newRankList.appendTo(newIcon);
			newIcon.appendTo(parent);

			for (i in pOwnedUpgrades)
				if (pOwnedUpgrades[i].hashField === upgrade.hashField) ownedRank = pOwnedUpgrades[i].owned_upgrades.rankField;

			for (i = 0; (i < upgrade.maxTier); i++) {
				var newRankItem = $("<li />", { class: "rank-tier-single" }),
					squareType = (((ownedRank - 1) < i) ? "ion-android-checkbox-outline-blank" : "ion-android-checkbox-blank"),
					rankSquares = $("<i />", { class: ("icon " + squareType) });
				rankSquares.appendTo(newRankItem);
				newRankItem.appendTo(newRankList);
			}

			var upgradeStatus = validateUpgrades(upgrade, pOwnedUpgrades).status,
				completedRank = (ownedRank >= upgrade.maxTier);

			switch (upgradeStatus) {
				case 1: { newIcon.addClass("bad-requirement"); } break;
				case 2: { newIcon.addClass("bad-blacklisted"); } break;
			}

			if (ownedRank > 0) newIcon.addClass(completedRank ? "good-rank" : "bad-rank");

			if (upgrade.parentUpgrade !== "") {
				var parentUpgradeObject = $("#upgrade-icon-" + upgrade.parentUpgrade),
					parentUpgradeIcon = parentUpgradeObject.find("img"),
					parentPosition = (parentUpgradeObject.position()),
					parentTop = parseInt(parentUpgradeObject.css("top")),
					parentLeft = parseInt(parentUpgradeObject.css("left")),
					parentIconPosition = (parentUpgradeIcon.position()),

					angleOffSet = getAngleOffset(totalItems),
					//angleOffSet = ((totalItems > 1) ? ((spreadAngle / totalItems) / totalItems) : 0),
					finalAngleOffset = ((parentUpgradeObject.data("entry-direction") - angleOffSet) || 270),

					angle = (((index * (spreadAngle / totalItems)) + finalAngleOffset)),
					distance = ((50 * totalItems) + 200),

					finalLeft = (distance * Math.cos(angle.toRad())),
					finalTop = (distance * Math.sin(angle.toRad())),

					ownsParent = false;

				for (i in pOwnedUpgrades)
					if (pOwnedUpgrades[i].hashField === upgrade.parentUpgrade) ownsParent = true;

				newIcon.data("entry-direction", angle);

				parentPosition.top = parentTop;
				parentPosition.left = parentLeft;

				// console.log("Angle:", angle, "toRad()", angle.toRad(), "finalLeft", finalLeft, "ParentLeft + Final Left", (parentPosition.left + finalLeft), "finalTop", finalTop, "ParentTop + Final Top", ((parentPosition.top) + finalTop));
				// console.log("Parent - Element:", parentUpgradeObject[0].className, "Parent image:", parentUpgradeIcon[0], "Position:", parentPosition, "Offset:", finalAngleOffset, "Entry direction:", parentUpgradeObject.data("entry-direction"));
				// console.log("Parent CSS Top:", parentTop, "Parent CSS Left:", parentLeft);

				var newIconPosition = newIcon.position();

				newIcon.css({"top": (parentPosition.top + finalTop), "left": (parentPosition.left + finalLeft)});

				var connectingLine = $("<div/>", {
					class: "connecting-line", id: ("connection-line-" + upgrade.hashField + "-" + upgrade.parentUpgrade)
				}).css({
					"height": "16px", "width": distance + "px",
					"top": ((parentPosition.top + 64)  + finalTop),
					"left": ((parentPosition.left + 64) + finalLeft),
					"transform": "rotate(" + (angle + 180) + "deg)"
				}).appendTo(parent);

				if (!ownsParent) { newIcon.addClass("locked"); connectingLine.addClass("locked"); }
				else { if (ownedRank > 0) connectingLine.addClass(completedRank ? "good-rank" : "bad-rank"); }
			}

			return newIcon;
		}

		function getAngleOffset(amount) {
			var rV = (function(v){
				switch(v) {
					case 0: { return 0; } break;
					case 1: { return 0; } break;
					case 2: { return 30; } break;
					case 3: { return 40; } break;
					case 4: { return 50; } break;
					case 5: { return 50; } break;
					default: { return 0; } break;
				}
			})(amount);
			return rV;
		}

		function getLastPosCookies() {
			return ($cookies.get("upgradeScreen:savedPosition") || "{}");
		}

		function initDraggingOnScreen(reset) {
			var isDragging = false, movementMultiplier = 2,
			lastMouseX, lastMouseY, deltaX, deltaY, currentTranslate,
			mainElementParent = $("#upgrades-main-page"),
			mainElement = $("#upgrades-translate-area"),
			zoomElement = $("#upgrades-zoom-area"),
			windowHalfWidth = (($(window).width() / 2) - 64),
			windowHalfHeight = ($(window).height() / 2.5),
			savedPosition = (JSON.parse(getLastPosCookies()) || {}),
			intialX = (reset ? windowHalfWidth : (savedPosition.x || windowHalfWidth)),
			intialY = (reset ? windowHalfHeight : (savedPosition.y || windowHalfHeight)),
			initialZoom = (reset ? 0.5 : (savedPosition.zoom || windowHalfWidth));

			mainElement.css({"transform": "translate(" + intialX + "px ," + intialY + "px)"});

			zoomElement.css({"transform-origin": windowHalfWidth + "px " + windowHalfHeight + "px"});
			zoomElement.css({"transform": "scale(" + initialZoom + "," + initialZoom + ")"});

			if (!reset) {
				mainElementParent
					.mousedown(function(e) {
						isDragging = true;
						lastMouseX = e.originalEvent.screenX;
						lastMouseY = e.originalEvent.screenY;
						movementMultiplier = (1 / uiServices.getTransformScale($("#upgrades-zoom-area").css("transform")).scale.x);
					})
					.mousemove(function(e) {
						if (isDragging) {
							mainElementParent.addClass("is-dragging");
							mainElement.removeClass("transition-class");

							deltaX = ((e.originalEvent.screenX - lastMouseX) * movementMultiplier);
							deltaY = ((e.originalEvent.screenY - lastMouseY) * movementMultiplier);

							currentTranslate = uiServices.getTransformScale(mainElement.css("transform")).translate;

							var	newTranslateX = (currentTranslate.x + deltaX),
								newTranslateY = (currentTranslate.y + deltaY);

							if (((deltaX > 1) || (deltaX < -1)) || ((deltaY > 1) || (deltaY < -1))) {
								// console.log("Delta X:", deltaX, "(", currentTranslate.x, ") -> (", newTranslateX, ") | Delta Y:", deltaY, "(", currentTranslate.y, ") -> (", newTranslateY, ") | Translate:", [newTranslateX, newTranslateY]);
								mainElement.css({"transform": "translate(" + newTranslateX + "px ," + newTranslateY + "px)"});

								lastMouseX = e.originalEvent.screenX;
								lastMouseY = e.originalEvent.screenY;
							}
						}
					})
					.mouseup(function(e) {
						isDragging = false;
						mainElementParent.removeClass("is-dragging");
						mainElement.addClass("transition-class");

						if (((deltaX > 2) || (deltaX < -2)) || ((deltaY > 2) || (deltaY < -2))) {
							var	newTranslateX = (currentTranslate.x + (deltaX * 15)),
								newTranslateY = (currentTranslate.y + (deltaY * 15));

							mainElement.css({"transform": "translate(" + (newTranslateX + deltaX) + "px ," + (newTranslateY + deltaY) + "px)"});
						}

						saveScrollPosition();
					});
			}
		}

		function centerOnUpgrade(upgrade) {
			var mainElement = $("#upgrades-translate-area"),
				targetIcon = $("#upgrade-icon-" + upgrade.hashField),
				windowHalfWidth = ($(window).width() / 2),
				windowHalfHeight = ($(window).height() / 2),
				targetTop = ((parseInt(targetIcon.css("top")) * -1) + windowHalfHeight),
				singleUpgradeBoxWidth = ($(".upgrade-main-body").outerWidth()),
				marginLeft = (apiServices.isPortrait() ? 0 : singleUpgradeBoxWidth),
				targetLeft = (((parseInt(targetIcon.css("left")) * -1) + windowHalfWidth) - (marginLeft));

			mainElement.addClass("transition-class");
			mainElement.css({"transform": "translate(" + targetLeft + "px ," + targetTop + "px)"});

			saveScrollPosition();
		}

		function moveZoomScreen(top, left, zoom) {
			var translateElement = $("#upgrades-translate-area"),
				zoomElement = $("#upgrades-zoom-area"),
				currentTranslate = uiServices.getTransformScale(translateElement.css("transform")).translate,
				currentScale = uiServices.getTransformScale(zoomElement.css("transform")).scale,
				moveSpeed = 150,

				finalLeft = currentTranslate.x + (moveSpeed * left),
				finalTop = currentTranslate.y + (moveSpeed * top);

			translateElement.addClass("transition-class");
			translateElement.css({"transform": "translate(" + finalLeft + "px ," + finalTop + "px)"});

			if (zoom) {
				var finalScaleSize = _.clamp((currentScale.x - (zoom / 2)), screenProperties.minSize, screenProperties.maxSize);
				zoomElement.css({"transform": "scale(" + finalScaleSize + "," + finalScaleSize + ")"});
			}
			saveScrollPosition();
		}

		function upgradeScrnRndrZoom(element, lastPos, scrollDir) {
			var screenElement = $("#" + element),
				currentScale = uiServices.getTransformScale(screenElement.css("transform")).scale,
				finalScaleSize = _.clamp((currentScale.x - (scrollDir / 2)), screenProperties.minSize, screenProperties.maxSize);

			screenElement.css({"transform": "scale(" + finalScaleSize + "," + finalScaleSize + ")"});
			saveScrollPosition();
		}

		function validUpgradeType(selfObj, upgrade) {
			var selfType = selfObj.contractType, upgradeType = upgrade.typeField;
			return ((upgradeType === 0) || ((selfType === 0) && (upgradeType === 1)) || (selfType === upgradeType));
		}

		function validateUpgrades(entity, pOwnedUpgrades) {
			var ownedUpgrades = (pOwnedUpgrades || []), i, j, mUpgrade, cUpgrade,
				blackList = (entity.blacklistedUpgrades || entity.blacklistedUpgradesField),
				requireList = (entity.requiredUpgrades || entity.requiredUpgradesField);

			if ((blackList.length === 0) && (requireList.length === 0)) return { status: 0 };
			if (ownedUpgrades === 0) return { status: 1 };

			if (blackList.length > 0) if ((checkOwnedUpgrade(pOwnedUpgrades, blackList, 2))) return { status: 2 };
			if (requireList.length > 0) if ((checkOwnedUpgrade(pOwnedUpgrades, requireList, 1))) return { status: 1 };

			return { status: 3 };
		}

		function checkOwnedUpgrade(pOwnedUpgrades, upgrade, mode) {
			var ownedUpgrades = (pOwnedUpgrades || []), i, j, mUpgrade, cUpgrade,
				checkFunction = ((mode === 1) ? _.lt : _.gte);

			if (upgrade.length > 0) {
				for (i in upgrade) {
					cUpgrade = upgrade[i];
					mUpgrade = null;

					var cUpgradeHash = (cUpgrade.hashField || cUpgrade[0]),
						cUpgradeRank = (cUpgrade.Rank || parseInt(cUpgrade[1]));

					for (j in ownedUpgrades)
						if (ownedUpgrades[j].hashField === cUpgradeHash) { mUpgrade = ownedUpgrades[j]; break; }

					if ((!mUpgrade) && (mode === 1)) return true;
					if (mUpgrade) if (checkFunction(mUpgrade.owned_upgrades.rankField, cUpgradeRank)) return true;
				}
				return false;
			}
		}

		function confirmBuyUpgrade(upgrade, calculatedCost) {
			var
				modalOptions = {
					header: { text: 'Upgrade?', icon: "ion-flash" },
					body: {	text: 'Are you use you want to increase the rank for [' + upgrade.nameField + ']?' },
					choices: {
						yes: { text: 'Yes', icon: 'ion-checkmark' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					},
					cost: calculatedCost
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return newModal.result.then(function(choice) {
				if (choice) { return purchaseUpgrade(upgrade.hashField); }
				else { return false; }
			});
		}

		function confirmRespecTree(upgrade) {
			var
				modalOptions = {
					header: { text: 'Respec Tree?', icon: "ion-refresh" },
					body: {	text: 'WARNING: You are about to reset this point of the tree. All deriving upgrades will be lost and you will receive 70% of the total spent funds. THIS CANNOT BE UNDONE.' },
					choices: {
						yes: { text: 'Respec', icon: 'ion-alert', class: 'danger' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
					}
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			return $q(function(resolve, reject) {
				newModal.result.then(function(choice) {
					if (choice) {
						var passwordModal = uiServices.createModal('ConfirmPassword');
						passwordModal.result.then(function(choice2) {
							if (choice2) return respecTree(upgrade.hashField).then(resolve);
						});
					} else { reject(); }
				});
			});
		}

		function openUpgradeImages(upgrade) {
			var
				modalOptions = {
					name: "Upgrades",
					type: "upgrade",
					description: "Pictures to be used by the Upgrades.",
					folder: "modules/upgrades",
					extension: "png",
					dimensions: { wMin: 300, wMax: 350, hMin: 300, hMax: 350 },
					filenameLimit: {min: 3, max: 14},
					filenameFilter: _.kebabCase,
					allowDeletion: true,
					allowRenaming: true,
					currentImage: upgrade.iconNameInput
				}, newModal = uiServices.createModal('ManageImages', modalOptions)
			;
			return newModal.result.then(function(image) { return image; });
		}

		return methods;
	}

	exports.function = UpgradesServicesFunction;
})();