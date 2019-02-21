(function() {
	'use strict';

	ViewOutfitsControllerFunction.$inject = ["$scope", "$state", "$location", "$stateParams", "$timeout", "$anchorScroll", "apiServices", "generalServices", "pmcServices", "alertsServices", "uiServices", "unitsServices", "selfInfo"];

	function ViewOutfitsControllerFunction($scope, $state, $location, $stateParams, $timeout, $anchorScroll, apiServices, generalServices, pmcServices, alertsServices, uiServices, unitsServices, selfInfo) {
		var vm = this;

		initializeFunctions();
		initializePage();

		function inputPageChange() { vm.stateParams.page = Math.min(Math.max(parseInt(vm.stateParams.page), 1), maxPage());	}

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
			if ((curPage !== vm.stateParams.page) || (d == "a")) refreshOutfitList();
		}

		function doMasonry() {
			$timeout(function() {
				uiServices.uiMasonry("#units-page-outfits", {
					itemSelector: ".outfit-card-width", columnWidth: ".outfit-card-width", percentPosition: false
				});
			}, 500);
		}

		function refreshOutfitList() {
			updateQueries();

			var currentQuery = apiServices.generateQueryFromState(vm.stateParams, "q", ["order", "page", "limit", "sort"]);

			vm.currentOutfits = [];
			vm.loading = true;

			if (apiServices.isTablet()) $anchorScroll('units-page-filters');

			generalServices.getAllPMC(currentQuery).then(function(data) {
				if (apiServices.statusError(data)) {
					vm.loading = false;
					vm.currentOutfits = [];
					vm.currentCount = [];
					return false;
				}
				vm.currentOutfits = data.data.data;
				vm.currentCount = data.data.count;

				for (var i in vm.currentOutfits ) {
					var cPlayer = vm.currentOutfits[i];
					cPlayer.showActions = true;
				}

				vm.loading = false;
			});
		}

		function resetFilters() {
			var allParams = ["page", "order", "sort", "name", "location", "tags", "open", "prestige"];
			for (var param in allParams) { updateURL(allParams[param], null); }
			refreshOutfitList();
		}

		function setFilterInputs() {
			var regularFilters = ["name", "location", "open", "order"],
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
				Finputs.sortValues = _.indexOf(['createdAt', 'totalPlayers', 'totalComments', 'display_name', 'location', 'prestige', 'size'], vm.stateParams.sort);
			}

			if (!angular.isUndefinedOrNull(vm.stateParams.open)) { Finputs.open = (vm.stateParams.open === 1); }

			addTagsFromParams();
		}

		function updateFilters() {
			var	Finputs = vm.filterValues.inputs,
				Fdropdowns = vm.filterValues.dropdownValue,
				Fdefaults = vm.filterDefaults;

			var filtersToUpdate = [
				{ value: "name", type: "common" },
				{ value: "location", type: "common" },
				{ value: "open", type: "checkmark" },
				{ value: "players", type: "common" },
				{ value: "prestige", type: "range" },
				{ value: "sortValues", param: "sort", type: "dropdown" }
			];

			if (Finputs.order !== vm.stateParams.order) { updateURL("order", Finputs.order); }

			for (var filter in filtersToUpdate) {
				var filterObject = filtersToUpdate[filter],
					filterValue = filterObject.value,
					filterResult, filterParam;

				switch (filterObject.type) {
					case "common": {
						if (Finputs[filterValue] !== Fdefaults[filterValue]) {
							if (Finputs[filterValue] !== vm.stateParams[filterValue]) { updateURL(filterValue, Finputs[filterValue]);}
						} else { updateURL(filterValue, null); }
					} break;

					case "dropdown": {
						var filterHardValue = filterObject.value,
							filterInput = Fdropdowns[filterHardValue][Finputs[filterHardValue]].value;
							filterParam = filterObject.param;

						if (filterInput !== Fdefaults[filterHardValue]) {
							if (filterInput !== vm.stateParams[filterParam]) { updateURL(filterParam, filterInput);	}
						} else { updateURL(filterParam, null); } break;
					} break;

					case "checkmark": {
						filterResult = Finputs[filterValue];
						if (!angular.isUndefinedOrNull(filterResult) && (filterResult)) {
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

			if (vm.stateParams.open) vm.stateParams.open = apiServices.boolInteger(vm.stateParams.open);

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

		function generatePMCBG() { return "url('images/cardbg.png')"; }

		function fixPagination() {
			return uiServices.stickyPagination("#units-page-outfits", "#pagination-container", "fixed", 100, 190);
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
			$timeout(50).then(function() { vm.filterValues.display = !currentFilter;});
		}

		function isOpenApplications(outfitData) {
			return ((outfitData.open_applications === 1) && (outfitData.size > outfitData.totalPlayers));
		}

		function initializeFunctions() {
			vm.displayContract = apiServices.displayContract;
			vm.numberToArray = apiServices.numberToArray;
			vm.maxPage = maxPage;
			vm.minPage = minPage;
			vm.refreshOutfitList = refreshOutfitList;
			vm.movePage = movePage;
			vm.inputPageChange = inputPageChange;
			vm.submitPageChange = submitPageChange;
			vm.inArray = apiServices.inArray;
			vm.generatePMCBG = generatePMCBG;
			vm.doMasonry = doMasonry;
			vm.toggleFilter = toggleFilter;
			vm.changeDropdownValue = changeDropdownValue;
			vm.changeFilterOrder = changeFilterOrder;
			vm.suggestedTags = apiServices.suggestedOutfitTags;
			vm.addingTag = addingTag;
			vm.updateFilters = updateFilters;
			vm.resetFilters = resetFilters;
			vm.isOpenApplications = isOpenApplications;
			vm.setLocationFilter = setLocationFilter;
		}

		function initializePage() {
			vm.stateParams = apiServices.cloneValue($stateParams);

			vm.containerHeight = 0;

			vm.filterDefaults = {
				name: "",
				location: 0,
				open: false,
				prestige: {
					min: 1,
					max: 5
				},
				tags: [],
				order: "ASC"
			};

			vm.sliderOptions = {
				floor: vm.filterDefaults.prestige.min, ceil: vm.filterDefaults.prestige.max,
				step: 1, noSwitching: true,
				translate: function(v) { return ("<i class='icon ion-star'></i> " + v); }
			};

			var starObject = {stateOn: 'ion-star', stateOff: 'ion-ios-star-outline'};

			vm.filterValues = {
				display: false,
				inputs: {
					name: vm.filterDefaults.name,
					location: vm.filterDefaults.location,
					open: vm.filterDefaults.open,
					prestige: vm.filterDefaults.prestige,
					prestigeSettings: [starObject, starObject, starObject, starObject, starObject],
					tags: vm.filterDefaults.tags,
					tagsMax: 5,
					order: vm.filterDefaults.order
				},
				dropdownValue: {
					sortValues: [
						{ icon: "ion-ios-calendar-outline", name: "Creation date", value: "createdAt" },
						{ icon: "ion-ios-people", name: "Active units", value: "totalPlayers" },
						{ icon: "ion-chatbubble-working", name: "Comments", value: "totalComments" },
						{ icon: "ion-android-person", name: "Alphabetical", value: "display_name" },
						{ icon: "ion-android-globe", name: "Location", value: "location" },
						{ icon: "ion-star", name: "Prestige", value: "prestige" },
						{ icon: "ion-qr-scanner", name: "Capacity", value: "size" }
					]
				}
			};

			generalServices.getRegions().then(function(v) { vm.regionNames = v; });

			vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());

			if (vm.selfInfo.PMC) {
				pmcServices.getFriendsSelf().then(function(data) {
					vm.selfPMCFriends = data; vm.selfPMCFriendsHashes = [];
					for (var friend in data) { vm.selfPMCFriendsHashes.push(data[friend].friendHash); }
				});
			} else {
				vm.selfPMCFriends = [];
				vm.selfPMCFriendsHashes = [];
			}

			vm.currentOutfits = [];
			vm.selfPMCFriends = [];

			vm.currentCount = 0;
			vm.perPage = 8;
			vm.loading = true;

			$(window).off("scroll", fixPagination);
			$(window).scroll(fixPagination);
			$scope.$on('$destroy', function() { $(window).off("scroll", fixPagination); });

			$timeout(3000).then(function(){vm.showPagination = true;});
			$timeout(1000).then(refreshOutfitList);
		}
	}

	exports.function = ViewOutfitsControllerFunction;
})();