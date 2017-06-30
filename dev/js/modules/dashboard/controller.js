(function() {
	'use strict';

	DashboardControllerFunction.$inject = [
		"$scope", "$stateParams", "$state", "$location", "$timeout", "$rootScope", 'apiServices', 'playerServices', 'pmcServices', 'dashboardServices', 'alertsServices', 'uiServices', "playerInfo", 'unitsServices'
	];

	function DashboardControllerFunction($scope, $stateParams, $state, $location, $timeout, $rootScope, apiServices, playerServices, pmcServices, dashboardServices, alertsServices, uiServices, playerInfo, unitsServices) {
		var
			vm = this, i,
			menuItem = dashboardServices.menuItem,
			statsItem = dashboardServices.statsItem
		;

		vm.playerInfo = playerInfo; console.log("OPERATOR INFO: ", playerInfo);
		vm.pmcInfo = {};
		vm.unitsInfo = {};
		vm.friendsList = {};

		vm.activeView = '';
		vm.activeTab = '';
		vm.currentUnitsView = 0;

		vm.changeUnitsTab = changeUnitsTab;
		vm.changeActiveView = changeActiveView;
		vm.currentViewHTML = "";
		vm.displayView = false;
		vm.displayTab = false;
		vm.uploadAvatarView = 'view';
		vm.longAvatarView = false;

		vm.file = [];
		vm.filePMC = [];
		vm.croppedDataUrl = "";

		vm.editField = dashboardServices.editFieldPlayer;
		vm.editFieldPMC = dashboardServices.editFieldPMC;

		vm.uploadAvatar = uploadAvatar;
		vm.uploadAvatarPMC = uploadAvatarPMC;

		vm.viewAvatarUpload = viewAvatarUpload;
		vm.changeActiveTab = changeActiveTab;
		vm.changeValue = changeValue;
		vm.changeValuePMC = changeValuePMC;

		vm.displayContract = apiServices.displayContract;
		vm.suggestedTags = apiServices.suggestedTags;

		vm.addTag = addTag;

		// =============================================

		var
		sidebarFunctions = {
			// player: function(_cb) {
			// 	dashboardServices.callThemOut().then(function(v) {
			// 		vm.asyncValue = v;
			// 		return _cb(v);
			// 	});
			// },
			player: function(_cb) { return _cb(true); },
			pmc: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					pmcServices.getSelfPMC().then(function(v) {
						vm.pmcInfo = v[0];
						vm.optionValues.open_applications = (vm.pmcInfo.open_applications === 1);
						return _cb(true);
					});
				} else { return _cb(false); }
			},
			units: function(_cb) { return _cb(true); }
		},
		unitsMenuFunctions = {
			friends: function(_cb) {
				playerServices.getFriendsSelf().then(function(f) {
					vm.friendsList = f;
					return _cb(true);
				});
			},
			units: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					sidebarFunctions.pmc(function() {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							vm.unitsInfo = v;
							return _cb(true);
						});
					});
				} else { return _cb(false); }
			},
			outfits: function(_cb) {
				if (vm.playerInfo.PMCId !== null) {
					pmcServices.getFriendsSelf().then(function(p) {
						vm.friendsPMCList = p;
						return _cb(true);
					});
				} else { return _cb(false); }
			}
		};


		vm.optionValues = {
			value1: false,
			value2: true,
			open_applications: (vm.pmcInfo ? (vm.pmcInfo.open_applications) : false)
		};

		vm.sideBarItems = [
			new menuItem('operator', 'person', sidebarFunctions.player),
			new menuItem('outfit', 'star', sidebarFunctions.pmc),
			new menuItem('allies', 'person-stalker', sidebarFunctions.units),
			new menuItem('stats', 'stats-bars'),
			new menuItem('upgrades', 'flash'),
			new menuItem('inventory', 'briefcase'),
			new menuItem('settings', 'ios-settings-strong')
		];

		vm.statsItems = [
			new statsItem('Current Funds', 'card', 'currentFunds'),
			new statsItem('Successful Missions', 'trophy', 'missionsWonNum'),
			new statsItem('Failed Missions', 'close', 'missionsFailedNum')
		];

		vm.unitsRadialOptions = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: true,
			items: [
				{content: 'Kick', icon: 'ion-close', tooltip: 'Removes the Operator from the Outfit.',
				 condition: checkRank, function: kickUnitPlayer },
				{content: 'Promote', icon: 'ion-star', tooltip: 'Promotes the Operator to the next Rank.',
				 condition: checkPromote, function: promoteUnitPlayer },
				{content: 'Demote', icon: 'ion-ios-star-half', tooltip: 'Demotes the Operator to the previous Rank.',
				 condition: checkDemote, function: demoteUnitPlayer }
			]
		};

		vm.unitsRadialOptionsFriends = {
			isOpen: false,
			toggleOnClick: true,
			enableDefaults: true,
			items: [
				{content: 'Unfriend', icon: 'ion-minus', tooltip: 'Removes the Operator from your friends list.',
				 function: removeFriend }
			]
		};

		vm.unitsRadialOptionsPMCFriends = { isOpen: false, toggleOnClick: true,	enableDefaults: true, items: []	};

		// =============================================

		function doResize() { return uiServices.centerHexagon("#unit-avatar", "#dashboard-view"); }

		function removeFriend(args) {
			unitsServices.askRemoveFriend(args).then(function(data) {
				if (data) playerServices.getFriendsSelf().then(function(f) { $rootScope.$emit("unitsDirectiveReloadUnits", f); });
			});
		}

		function kickUnitPlayer(args) {
			unitsServices.askKickPlayer(args).then(function(data) {
				if (data) {
					pmcServices.getSelfPMCPlayers().then(function(v) {
						$rootScope.$emit("unitsDirectiveReloadUnits", v);
						alertsServices.addNewAlert("warning", data.data.message);
					});
				}
			});
		}

		function promoteUnitPlayer(args) {
			unitsServices.askPromotePlayer(args).then(function(data) {
				if (data) {
					if (data.data.success) {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							$rootScope.$emit("unitsDirectiveReloadUnits", v);
							alertsServices.addNewAlert("success", data.data.message);
						});
					}
				}
			});
		}

		function demoteUnitPlayer(args) {
			unitsServices.askDemotePlayer(args).then(function(data) {
				if (data) {
					if (data.data.success) {
						pmcServices.getSelfPMCPlayers().then(function(v) {
							$rootScope.$emit("unitsDirectiveReloadUnits", v);
							alertsServices.addNewAlert("warning", data.data.message);
						});
					}
				}
			});
		}

		vm.editPMCTierNames = function(i, v) {
			var surr = _.take(vm.pmcInfo.tier_names, vm.pmcInfo.tier_names.length);
			surr[i] = v;
			return dashboardServices.editPMCTierNames('tierNames', surr, i).then(function() {
				vm.pmcInfo.tier_names[i] = v;
			});
		};
		vm.addingTagPMC = function(q) {	return vm.addingTag(q, true); };
		vm.removingTagPMC = function(q) { return vm.removingTag(q, true); };
		vm.addTagPMC = function(q) { return vm.addTag(q, true); };
		vm.addingTag = function(q, pmc) {
			var func = pmc ? vm.editFieldPMC : vm.editField,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (tags.length >= 5) {
				alertsServices.addNewAlert("warning", "Max. number of " + 5 + " tags reached.");
				return false;
			} else {
				return func('add_tags', [q.text]);
			}
		};
		vm.removingTag = function(q, pmc) {
			var func = pmc ? vm.editFieldPMC : vm.editField,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (tags.length <= 1) {
				alertsServices.addNewAlert("warning", "Min. of " + 1 + " tag required.");
				return false;
			} else {
				return func('remove_tags', [q.text]);
			}
		};

		function addTag(v, pmc) {
			var func = pmc ? vm.addingTagPMC : vm.addingTag,
				tags = pmc ? vm.pmcInfo.tags : vm.playerInfo.tagsField;
			if (!(_.find(tags, { text: v }))) {
				if (func({text: v })) tags.push({text: v});
			}
		}

		function changeValue(v) {
			var obj = vm.optionValues, tick = function() {obj[v] = !(obj[v]);};
			tick();
			vm.editField(v, !(obj[v])).then(tick);
		}

		function changeValuePMC(v) {
			var obj = vm.optionValues, tick = function() {obj[v] = !(obj[v]);};
			tick();
			vm.editFieldPMC(v, !(obj[v])).then(tick);
		}

		function viewAvatarUpload(a) {
			vm.longAvatarView = (a === "edit");
			vm.uploadAvatarView = "";
			$timeout(function() { vm.uploadAvatarView = a; $timeout(doResize, 100); }, 500);
		}

		function uploadAvatar(d, n) {
			var infoCache = vm.playerInfo.hashField;
			vm.playerInfo.hashField = "null";
			dashboardServices.uploadAvatar(d, n, function(r) {
				viewAvatarUpload('view');
				vm.playerInfo.hashField = infoCache;
			});
		}

		function uploadAvatarPMC(d, n) {
			var infoCache = vm.pmcInfo.hashField;
			vm.pmcInfo.hashField = "null";
			dashboardServices.uploadPMCAvatar(d, n, function(r) {
				viewAvatarUpload('view');
				vm.pmcInfo.hashField = infoCache;
			});
		}

		function checkRank(a) { return unitsServices.checkRank(a, vm.playerInfo); }
		function checkPromote(a) { return unitsServices.checkPromote(a, vm.playerInfo); }
		function checkDemote(a) { return unitsServices.checkDemote(a, vm.playerInfo); }

		function findMenuIndexByName(name) {
			var rIndex = 0;
			for (var i in vm.sideBarItems) {
				if (vm.sideBarItems[i].text === name) rIndex = i;
			}
			return rIndex;
		}

		function changeUnitsTab(index) {
			if (vm.currentUnitsView !== index) {
				vm.currentUnitsView = -1;
				$timeout(function() { vm.currentUnitsView = index; }, 250);
			}
		}

		function changeActiveView(index) {
			var	view = vm.sideBarItems[index];

			if ((vm.activeView !== view.text)) {
				vm.displayView = false;

				apiServices.resolveFunction(view.f).then(function(val) {
					dashboardServices.loadNewView(view.text).then(function(html) {
						if (html) vm.currentViewHTML = html;

						vm.activeView = view.text;

						vm.uploadAvatarView = "view";
						vm.longAvatarView = false;

						$timeout(function() {
							vm.displayView = true;
							$rootScope.$broadcast("dashboardChange", vm.activeView);

							$timeout(doResize, 100);
						}, 500);
					});
				}, function(val) {
					vm.displayView = true;
					var message = ((function(view) {
						console.log(view);
						switch(view.text) {
							case "operator": { return "You are not registered...?"; } break;
							case "outfit": { return "You are not part of an Outfit."; } break;
							default: { return "Failed to load menu."; }
						}
					})(view));
					alertsServices.addNewAlert("warning", message);
					changeActiveView(0);
				});
			}
		}

		function changeActiveTab(tab) {
			if ((tab === "friends") || (tab === "units") || (tab === "outfits")) {
				if ((vm.activeTab !== tab)) {
					vm.displayTab = false;

					apiServices.resolveFunction(unitsMenuFunctions[tab]).then(function(val) {
						vm.activeTab = tab;

						$timeout(function() {
							vm.displayTab = true;
							$rootScope.$broadcast("dashboardTabChange", tab);
						}, 250);
					}, function(val) {
						vm.displayTab = true;
						var message = ((function(tab) {
							switch(tab) {
								case "friends": { return "An error has occured."; } break;
								case "units": { return "You are not part of an Outfit."; } break;
								case "outfits": { return "You are not part of an Outfit."; } break;
								default: { return "An error has occured."; }
							}
						})(tab));
						alertsServices.addNewAlert("warning", message);
						changeActiveTab("friends");
					});
				}
			} else { changeActiveTab("friends"); }
		}

		(function() {
			function writeNumber(n, i, o) {
				var jO = $(".number").toArray()[n];
				if (i > 0) {
					var rI = (Math.floor(Math.random() * 100));

					$timeout(function() {
						if (i % 2 === 0) { $(jO).addClass("animate"); } else { $(jO).removeClass("animate"); }
						vm.playerInfo[vm.statsItems[n].value] = (Math.floor(Math.random() * 100));
						var i2 = (i - 1);
						writeNumber(n, i2, o);
					}, ((300 / i) + rI));
				} else {
					$(jO).addClass("animate");
					$timeout(function() {
						vm.playerInfo[vm.statsItems[n].value] = o;
						$(jO).removeClass("animate");
					}, 150);
				}
			}

			$rootScope.$on("dashboardChange", function(a, b) {
				$stateParams.page = b;
				$state.params.page = b;
				$location.search('page', b);

				if (b === "stats") {
					for (i in vm.statsItems) {
						var val = vm.playerInfo[vm.statsItems[i].value],
							oriVal = vm.playerInfo[vm.statsItems[i].value];

						writeNumber(i, 5, oriVal);
					}
				}

				if (b === "allies") {
					changeActiveTab(($stateParams.tab || vm.activeTab || 'friends'));

					$stateParams.tab = ($stateParams.tab || vm.activeTab || 'friends');
					$state.params.tab = ($stateParams.tab || vm.activeTab || 'friends');
					$location.search('tab', ($stateParams.tab || vm.activeTab || 'friends'));
				} else {
					$stateParams.tab = undefined;
					$state.params.tab = undefined;
					$location.search('tab', undefined);
				}

				$rootScope.$broadcast("updatePageTitle", (b.charAt(0).toUpperCase() + b.slice(1)) + " | Dashboard");
			});

			$rootScope.$on("dashboardTabChange", function(a, b) {
				$stateParams.tab = b; $state.params.tab = b; $location.search('tab', b);
			});

		}());

		$(window).resize(doResize);
		$scope.$on('$destroy', function() {$(window).off("resize", doResize);});

		changeActiveView(findMenuIndexByName($stateParams.page ? $stateParams.page : 'allies'));
		$timeout(function() { $scope.$broadcast('rebuild');	}, 0);
	}

	exports.function = DashboardControllerFunction;
})();