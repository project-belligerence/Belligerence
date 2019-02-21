(function() {
	'use strict';

	ViewOperatorsControllerFunction.$inject = ["$scope", "$state", "$location", "$stateParams", "$timeout", "$anchorScroll", "apiServices", "generalServices", "alertsServices", "uiServices", "unitsServices", "selfInfo", "selfFriends"];

	function ViewOperatorsControllerFunction($scope, $state, $location, $stateParams, $timeout, $anchorScroll, apiServices, generalServices, alertsServices, uiServices, unitsServices, selfInfo, selfFriends) {
		var vm = this;

		initializeFunctions();
		initializePage();

		function inputPageChange() { vm.stateParams.page = Math.min(Math.max(parseInt(vm.stateParams.page), 1), maxPage()); }

		function submitPageChange() {
			if (vm.stateParams.page.length === 0) vm.stateParams.page = 1;
			$("#page-input").blur();
			movePage("a");
		}

		function maxPage() { return Math.min( Math.ceil(vm.currentCount / vm.perPage), (parseInt(vm.stateParams.page) + 1)); }
		function minPage() { return Math.max((vm.stateParams.page - 1), 1); }

		function movePage(d) {
			var curPage = vm.stateParams.page;
			switch (d) {
				case "n": { vm.stateParams.page = maxPage(); } break;
				case "p": { vm.stateParams.page = minPage(); } break;
			}
			if ((curPage !== vm.stateParams.page) || (d == "a")) refreshPlayerList();
		}

		function doMasonry() {
			$timeout(function() {
				uiServices.uiMasonry("#units-page-operators", {
					itemSelector: ".operator-card-width", columnWidth: ".operator-card-width", percentPosition: false
				});
			}, 500);
		}

		function refreshPlayerList() {
			updateQueries();

			var currentQuery = apiServices.generateQueryFromState(vm.stateParams, "q", ["order", "page", "limit", "sort"]),
				queryFunc = ((vm.stateParams.contract == 1) && (vm.stateParams.unemployedOnly == "true")) ? "getAllUnemployed" : "getAllPlayers";

			vm.currentPlayers = [];
			vm.loading = true;

			if (apiServices.isTablet()) $anchorScroll('units-page-filters');

			generalServices[queryFunc](currentQuery).then(function(data) {
				if (apiServices.statusError(data)) {
					vm.loading = false;
					vm.currentPlayers = [];
					vm.currentCount = [];
					return false;
				}

				vm.currentPlayers = data.data.data;
				vm.currentCount = data.data.count;

				for (var i in vm.currentPlayers ) {
					var cPlayer = vm.currentPlayers[i];
					cPlayer.showActions = true;
				}

				vm.loading = false;
			});
		}

		function resetFilters() {
			var allParams = ["page", "order", "sort", "alias", "description", "location", "contract", "prestige", "unemployedOnly", "tags", "email", "status"];
			for (var param in allParams) { updateURL(allParams[param], null); }
			refreshPlayerList();
		}

		function setFilterInputs() {
			var regularFilters = ["alias", "description", "location", "contract", "order"],
				sliderFilters = ["prestige"],
				Finputs = vm.filterValues.inputs,
				Fdropdowns = vm.filterValues.dropdownValue,
				Fdefaults = vm.filterDefaults,
				i, value;

			for (i in regularFilters) {
				value = regularFilters[i];
				if (!(angular.isUndefinedOrNull(vm.stateParams[value]))) { Finputs[value] = vm.stateParams[value]; }
			}

			for (i in sliderFilters) {
				value = sliderFilters[i];

				if (
					!(angular.isUndefinedOrNull(vm.stateParams[value + "Min"])) ||
					!(angular.isUndefinedOrNull(vm.stateParams[value + "Max"]))
				) {
					Finputs[value].min = (vm.stateParams[value + "Min"] || vm.filterDefaults[value].min);
					Finputs[value].max = (vm.stateParams[value + "Max"] || vm.filterDefaults[value].max);
				}
			}

			if (!angular.isUndefinedOrNull(vm.stateParams.sort)) {
				Finputs.sortValues = _.indexOf(["createdAt", "player_prestige", "alias", "player_location", "totalComments"], vm.stateParams.sort);
			}

			if (!angular.isUndefinedOrNull(vm.stateParams.unemployedOnly)) {
				Finputs.unemployedOnly = apiServices.boolString(vm.stateParams.unemployedOnly);
			}

			addTagsFromParams();
		}

		function updateFilters() {
			var	Finputs = vm.filterValues.inputs,
				Fdropdowns = vm.filterValues.dropdownValue,
				Fdefaults = vm.filterDefaults;

			var filtersToUpdate = [
				{ value: "alias", type: "common" },
				{ value: "description", type: "common" },
				{ value: "location", type: "common" },
				{ value: "prestige", type: "range" },
				{ value: "contract", type: "common" },
				{ value: "sortValues", param: "sort", type: "dropdown" },
				{ value: "unemployedOnly", type: "checkmark" }
			];

			if (Finputs.order !== vm.stateParams.order) { updateURL("order", Finputs.order); }

			for (var filter in filtersToUpdate) {
				var filterObject = filtersToUpdate[filter],
					filterValue = filterObject.value,
					filterResult;

				switch (filterObject.type) {
					case "common": {
						if (Finputs[filterValue] !== Fdefaults[filterValue]) {
							if (Finputs[filterValue] !== vm.stateParams[filterValue]) { updateURL(filterValue, Finputs[filterValue]);}
						} else { updateURL(filterValue, null); }
					} break;

					case "dropdown": {
						var filterHardValue = filterObject.value,
							filterParam = filterObject.param,
							filterInput = Fdropdowns[filterHardValue][Finputs[filterHardValue]].value;

						if (filterInput !== Fdefaults[filterHardValue]) {
							if (filterInput !== vm.stateParams[filterParam]) { updateURL(filterParam, filterInput);	}
						} else { updateURL(filterParam, null); } break;
					} break;

					case "checkmark": {
						filterResult = Finputs[filterValue];
						if (!angular.isUndefinedOrNull(filterResult) && (filterResult) && (Finputs.contract == 1)) {
							if (filterResult !== vm.stateParams[filterResult]) { updateURL(filterValue, "true"); }
						} else { updateURL(filterValue, null); } break;
					} break;

					case "range": {
						filterResult = Finputs[filterValue];
						if (!angular.isUndefinedOrNull(filterResult) && (filterResult)) {
							if (filterResult !== vm.stateParams[filterResult]) {
								updateURL(filterValue, filterResult.min, "min");
								updateURL(filterValue, filterResult.max, "max");
							}
						} else { updateURL(filterValue, null); } break;
					} break;
				}
			}

			if (Finputs.tags.length > 0) {
				var tagKeys = [];
				for (var key in Finputs.tags) { tagKeys.push(Finputs.tags[key].text); }
				tagKeys = tagKeys.join();
				if (Finputs.tags.length > 0) { if (tagKeys !== vm.stateParams.tags) { updateURL("tags", tagKeys); }}
			} else { updateURL("tags", null); }
		}

		function updateURL(property, value, subvalue) {
			if (subvalue) {
				if (angular.isUndefinedOrNull(vm.stateParams[property])) {
					vm.stateParams[property] = {};
					$stateParams[property] = {};
					$state.params[property] = {};
				}

				vm.stateParams[property][subvalue] = value;
				$stateParams[property][subvalue] = value;
				$state.params[property][subvalue] = value;

				$location.search(property + _.capitalize(subvalue), value);

			} else {
				vm.stateParams[property] = value;
				$stateParams[property] = value;
				$state.params[property] = value;
				$location.search(property, value);
			}
		}

		function updateQueries() {
			var defaultQueries = { page: 1, order: "DESC", sort: "createdAt" },
				Finputs = vm.filterValues.inputs;

			vm.stateParams.page = (vm.stateParams.page || defaultQueries.page); updateURL("page", vm.stateParams.page);
			vm.stateParams.order = (vm.stateParams.order || defaultQueries.order); updateURL("order", vm.stateParams.order);
			vm.stateParams.sort = (vm.stateParams.sort || defaultQueries.sort); updateURL("sort", vm.stateParams.sort);

			vm.stateParams.includeUpgrades = true;

			setFilterInputs();
		}

		function addTagsFromParams() {
			if (vm.stateParams.tags) {
				var surTags = vm.stateParams.tags.split(",");
				vm.filterValues.inputs.tags = _.take(surTags, vm.filterValues.inputs.tagsMax);

				if (surTags.length > vm.filterValues.inputs.tagsMax) {
					alertsServices.addNewAlert("warning", "Max. number of " + vm.filterValues.inputs.tagsMax + " tags reached.");
					updateURL("tags", vm.filterValues.inputs.tags.join());
				}
			}
		}

		function addToTags(value) { vm.filterValues.inputs.tags.push(value); vm.filterValues.display = true; }

		function changeDropdownValue(option, index) { vm.filterValues.inputs[option] = index; }

		function changeFilterOrder() {
			vm.filterValues.inputs.order = ((vm.filterValues.inputs.order === "ASC") ? "DESC" : "ASC");
		}

		function generatePMCBG(playerData) {
			if (playerData.PMC) {
				return "url('images/avatars/pmc/main_" + playerData.PMC.hashField + ".jpg')";
			} else { return "url('images/cardbg.png')"; }
		}

		function fixPagination() {
			return uiServices.stickyPagination("#units-page-operators", "#pagination-container", "fixed", 100, 190);
		}

		function addingTag(q, forced) {
			var maxTags = vm.filterValues.inputs.tagsMax,
				tags = vm.filterValues.inputs.tags;

			if (vm.filterValues.inputs.tags.length >= maxTags) {
				alertsServices.addNewAlert("warning", "Max. number of " + maxTags + " tags reached.");
				return false;
			} else {
				vm.filterValues.display = true;
				if (forced) { if (!(_.find(tags, {text: q.text}))) { tags.push(q); }}
			}
		}

		function setLocationFilter(locationValue) {
			vm.filterValues.inputs.location = locationValue;
			vm.filterValues.display = true;
		}

		function toggleFilter() {
			var currentFilter = vm.filterValues.display;
			vm.filterValues.display = undefined;
			setFilterInputs();
			$timeout(50).then(function() { vm.filterValues.display = !currentFilter;});
		}

		function initializeFunctions() {
			vm.displayContract = apiServices.displayContract;
			vm.numberToArray = apiServices.numberToArray;
			vm.maxPage = maxPage;
			vm.minPage = minPage;
			vm.refreshPlayerList = refreshPlayerList;
			vm.movePage = movePage;
			vm.inputPageChange = inputPageChange;
			vm.submitPageChange = submitPageChange;
			vm.inArray = apiServices.inArray;
			vm.generatePMCBG = generatePMCBG;
			vm.doMasonry = doMasonry;
			vm.toggleFilter = toggleFilter;
			vm.changeDropdownValue = changeDropdownValue;
			vm.changeFilterOrder = changeFilterOrder;
			vm.suggestedTags = apiServices.suggestedTags;
			vm.addingTag = addingTag;
			vm.updateFilters = updateFilters;
			vm.resetFilters = resetFilters;
			vm.setLocationFilter = setLocationFilter;
		}

		function initializePage() {
			vm.stateParams = apiServices.cloneValue($stateParams);
			vm.containerHeight = 0;

			vm.filterDefaults = {
				alias: "",
				description: "",
				location: 0,
				sortValues: 0,
				contract: 3,
				prestige: {
					min: 1,
					max: 5
				},
				tags: [],
				unemployedOnly: false,
				order: "ASC"
			};

			generalServices.getRegions().then(function(v) { vm.regionNames = v; });

			var starObject = {stateOn: 'ion-star', stateOff: 'ion-ios-star-outline'};

			vm.sliderOptions = {
				floor: vm.filterDefaults.prestige.min, ceil: vm.filterDefaults.prestige.max,
				step: 1, noSwitching: true,
				translate: function(v) { return ("<i class='icon ion-star'></i> " + v); }
			};

			vm.filterValues = {
				display: false,
				inputs: {
					alias: vm.filterDefaults.alias,
					description: vm.filterDefaults.description,
					location: vm.filterDefaults.location,
					sortValues: vm.filterDefaults.sortValues,
					contract: vm.filterDefaults.contract,
					prestige: vm.filterDefaults.prestige,
					tags: vm.filterDefaults.tags,
					tagsMax: 5,
					unemployedOnly: vm.filterDefaults.unemployedOnly,
					prestigeSettings: [starObject, starObject, starObject, starObject, starObject],
					order: vm.filterDefaults.order
				},
				dropdownValue: {
					contract: [
						{ icon: "ion-person", name: "Commanders", value: 0 },
						{ icon: "ion-person-stalker", name: "Soldiers", value: 1 },
						{ icon: "ion-ios-body", name: "Freelancers", value: 2 },
						{ icon: "ion-minus", name: "Any", value: 3 },
					],
					sortValues: [
						{ icon: "ion-ios-calendar-outline", name: "Join date", value: "createdAt" },
						{ icon: "ion-star", name: "Prestige", value: "player_prestige" },
						{ icon: "ion-android-person", name: "Alphabetical", value: "alias" },
						{ icon: "ion-android-globe", name: "Location", value: "player_location" },
						{ icon: "ion-chatbubble-working", name: "Comments", value: "totalComments" }
					]
				}
			};

			generalServices.getRegions().then(function(v) { vm.regionNames = v; });

			vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
			vm.selfFriends = (selfFriends || []);
			vm.selfFriendsHashes = [];
			vm.selfFriends.forEach(function(a){vm.selfFriendsHashes.push(a.friendHash);});

			vm.currentPlayers = [];

			vm.currentCount = 0;
			vm.perPage = 8;
			vm.loading = true;

			$(window).off("scroll", fixPagination);
			$(window).scroll(fixPagination);
			$scope.$on('$destroy', function() { $(window).off("scroll", fixPagination); });

			$timeout(3000).then(function(){vm.showPagination = true;});
			$timeout(1000).then(refreshPlayerList);
		}
	}

	exports.function = ViewOperatorsControllerFunction;
})();