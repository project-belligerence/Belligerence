(function() {
	'use strict';

	ObjectsControllerFunction.$inject = ["$scope", "$state", "$location", "$stateParams", "$q", "$timeout", "apiServices", "generalServices"];

	function ObjectsControllerFunction($scope, $state, $location, $stateParams, $q, $timeout, apiServices, generalServices) {
		var vm = this;

		initializeFunctions();
		initializePage();

		// ==============================================

		function initializePage() {
			vm.displayFilter = false;
			vm.reloadingPage = false;
			vm.viewData = {};
			vm.urlData = {};
			vm.displayPage = false;
			vm.viewData.allOption = [{text: "All", data: null}];
			vm.viewData.allOption2 = { "-1": {name: "All", data: null}};

			initializeVariables();
			vm.updateObjectFilters();

			vm.getExternalVariables(function() {
				vm.displayPage = true;
				vm.callQuery();

				$timeout(1000).then(function(){ vm.showPagination = true; });
			});
		}

		function initializeVariables() {

			vm.queryFunction = "getObjectives";

			vm.objectList = [];
			vm.queryValuesDetails = {};
			vm.objectListCount = 0;
			vm.displayObjects = false;

			vm.pageValues = {
				title: "Objectives",
				description: "The list of tasks that will be assigned as Missions."
			};

			vm.filterValues = {
				sortList: [
					{ text: "Name", value: "name" },
					{ text: "Time Limit (hours)", value: "hour_limit" },
					{ text: "Difficulty", value: "difficulty" },
					{ text: "Unit Limit", value: "unit_limit" },
					{ text: "Comission Chance", value: "chance" },
					{ text: "Base Reward", value: "base_reward" },
					{ text: "Territory Control", value: "capture" },
					{ text: "Adversarial", value: "adversarial" }
				],
				perPage: 5
			};

			vm.querySections = [
				{ name: "Basic Info", id: "basic" },
				{ name: "Filters", id: "filters" },
				{ name: "Values", id: "numbers" }
			];

			vm.queryValues = {
				qName: { name: "Name", model: "", type: "text", section: "basic" },
				qDescription: { name: "Description", model: "", type: "text", section: "basic" },

				qHourLimit: {
					name: "Time Limit (hours)", ref: "hour_limit", type: "slider", section: "numbers",
					options: { ceil: 6, step: 1, translate: function(v) {return("<i class='icon ion-clock'></i> "+v);}},
					model: { min: 0, max: 6 }
				},
				qDifficulty: {
					name: "Difficulty", ref: "difficulty", type: "slider", section: "numbers",
					options: { ceil: 5, step: 1, translate: function(v) {return("<i class='icon ion-thermometer'></i> "+v);}},
					model: { min: 0, max: 5 }
				},
				qUnitLimit: {
					name: "Unit Limit", ref: "unit_limit", type: "slider", section: "numbers",
					options: { ceil: 50, step: 5, translate: function(v) {return("<i class='icon ion-person-stalker'></i> "+v);}},
					model: { min: 5, max: 50 }
				},
				qChance: {
					name: "Comission Chance", ref: "chance", type: "slider", section: "numbers",
					options: { ceil: 100, step: 10, translate: function(v) {return(v+"%");}},
					model: { min: 1, max: 100 }
				},
				qBaseReward: {
					name: "Base Reward", ref: "base_reward", type: "slider", section: "numbers",
					options: { ceil: 10000, step: 100, translate: function(v) {return("<i class='icon ion-social-usd'></i> "+v);}},
					model: { min: 0, max: 10000 }
				},

				qDisabledMaps: {
					name: "Blacklisted Maps", model: [], type: "dropdownCheckbox",
					options: "mapData", section: "filters"
				},
				qLocationTypes: {
					name: "Locations", model: [], type: "dropdownCheckbox",
					options: "locationData", section: "filters"
				},
				qDoctrineTypes: {
					name: "Associated Doctrines", model: [], type: "dropdownCheckbox",
					options: "doctrinesData", section: "filters"
				},

				qCapture: new vm.BoolSliderObject({ name: "Control Location?", ref: "capture", section: "basic" }),
				qAdversarial: new vm.BoolSliderObject({ name: "Adversarial?", ref: "adversarial", section: "basic" })
			};

			vm.basicQuery = { page: 1, order: "ASC", sort: "", qActive: true };

			vm.qSortIndex = 0;
		}

		function initializeFunctions() {
			vm.changeFilterOrder = changeFilterOrder;
			vm.movePage = movePage;
			vm.resetFilters = resetFilters;
			vm.callQuery = callQuery;
			vm.reloadQueryState = reloadQueryState;
			vm.toggleDisplayFilter = toggleDisplayFilter;
			vm.updateObjectFilters = updateObjectFilters;
			vm.inputPageChange = inputPageChange;
			vm.getExternalVariables = getExternalVariables;
			vm.BoolSliderObject = BoolSliderObject;

			function getExternalVariables(callback) {
				generalServices.getLocationTypes().then(function(locations) {
					generalServices.getDoctrines().then(function(tactics) {
						generalServices.getMapList().then(function(map_data) {
							vm.filterValues.doctrinesData = tactics;
							vm.filterValues.mapData = map_data;
							vm.filterValues.locationData = locations;

							return callback();
						});
					});
				});
			}

			function updateObjectFilters() {
				var v, makeInt = function (x) { return parseInt(x, 10); };

				for (v in vm.queryValues) {
					if (vm.queryValues.hasOwnProperty(v)) {
						switch (vm.queryValues[v].type) {
							case "slider": {
								if ($stateParams[v+"Min"]) vm.queryValues[v].model.min = $stateParams[v+"Min"];
								if ($stateParams[v+"Max"]) vm.queryValues[v].model.max = $stateParams[v+"Max"];
							} break;
							case "bool-slider": {
								if (!(angular.isUndefinedOrNull($stateParams[v]))) vm.queryValues[v].model = (($stateParams[v] === "true") ? 0 : 2);
							} break;
							case "dropdownCheckbox": {
								if ($stateParams[v]) {
									var result = $stateParams[v].split(",").map(makeInt);
									vm.queryValues[v].model = result;
								}
							} break;
							default: { if ($stateParams[v]) vm.queryValues[v].model = $stateParams[v]; } break;
						}
					}
				}

				for (v in vm.basicQuery) {
					if (vm.basicQuery.hasOwnProperty(v) && $stateParams[v]) { vm.basicQuery[v] = $stateParams[v]; }
				}
				if ($stateParams.sort) vm.qSortIndex = $stateParams.sort;
			}

			function BoolSliderObject(params) {
				return {
					name: params.name, ref: params.ref, type: "bool-slider", section: params.section, model: 1,
					options: { floor: 0, ceil: 2, step: 1, translate: function(v) { return ["YES", "-", "NO"][v]; }},
					filter: function(v) { return [true, null, false][v]; }
				};
			}

			function reloadQueryState() {
				for (var v in vm.queryValues) {
					if (vm.queryValues.hasOwnProperty(v)) {
						var qM = vm.queryValues[v];

						switch (vm.queryValues[v].type) {
							case "slider": {
								updateURL((v + "Min"), (qM.model.min > 0) ? qM.model.min : null);
								updateURL((v + "Max"), (qM.model.max !== qM.options.ceil) ? qM.model.max : null);
							} break;
							case "bool-slider": {
								updateURL((v), (qM.model !== 1) ? (qM.model === 0 ? true : false) : null);
							} break;
							case "dropdownCheckbox": { updateURL(v, qM.model.join(',')); } break;
							default: { updateURL(v, qM.model); } break;
						}
					}
				}

				updateURL("sort", vm.qSortIndex);
				updateURL("order", vm.basicQuery.order);
				updateURL("page", vm.basicQuery.page);

				applyURL();
				callQuery();
			}

			function updateQueryValues() {
				var queryValues = {}, key, keyValue, objectValue,
					filteredQueries = {},
					filteredDetails = {};

				vm.basicQuery.sort = vm.filterValues.sortList[vm.qSortIndex].value;

				for (key in Object.keys(vm.queryValues)) {
					keyValue = Object.keys(vm.queryValues)[key];
					objectValue = vm.queryValues[Object.keys(vm.queryValues)[key]];
					if (!(angular.isUndefinedOrNull(objectValue.model)) && (objectValue.model !== "")) {
						filteredQueries[keyValue] = (objectValue.filter ? objectValue.filter(objectValue.model) : objectValue.model);
					}
				}

				queryValues = $.extend({}, queryValues, vm.basicQuery);
				queryValues = $.extend({}, queryValues, filteredQueries);
				queryValues = $.extend({}, queryValues, filteredDetails);

				return queryValues;
			}

			function resetFilters() {
				for (var v in vm.queryValues) {
					if (vm.queryValues.hasOwnProperty(v)) {
						var qM = vm.queryValues[v];

						switch (vm.queryValues[v].type) {
							case "slider": {
								updateURL((v + "Min"), null);
								updateURL((v + "Max"), null);
								vm.queryValues[v].model = { min: 0, max: qM.options.ceil };
							} break;
							case "bool-slider": {
								updateURL(v, null);
								vm.queryValues[v].model = 1;
							} break;
							case "dropdownCheckbox": {
								updateURL(v, null);
								vm.queryValues[v].model = [];
							} break;
							default: {
								updateURL(v, null);
								vm.queryValues[v].model = null;
							} break;
						}
					}
				}

				updateURL("sort", "");
				updateURL("order", "ASC");
				updateURL("page", 0);

				applyURL();
				callQuery();
			}

			function callQuery() {
				vm.objectData = [];
				generalServices[vm.queryFunction](updateQueryValues()).then(function(data) {
					var result = apiServices.handleRequestData(data);
					if (result.success) vm.objectData = result.data; vm.objectListCount = result.count;
					$timeout(350).then(function(){ vm.displayObjects = true; });
				});
			}
			function updateURL(property, value) {
				$stateParams[property] = value; $state.params[property] = value; vm.urlData[property] = value;
			}
			function applyURL() { $state.go($state.$current.self.name, vm.urlData, {notify: false}); }
			function changeFilterOrder() { vm.basicQuery.order = ((vm.basicQuery.order === "ASC") ? "DESC" : "ASC"); }
			function maxPage() { return Math.min(Math.ceil(vm.objectListCount / vm.filterValues.perPage), (parseInt(vm.basicQuery.page) + 1)); }
			function minPage() { return Math.max((vm.basicQuery.page - 1), 1); }
			function movePage(d) {
				var curPage = vm.basicQuery.page;
				switch (d) {
					case "n": { vm.basicQuery.page = maxPage(); } break;
					case "p": { vm.basicQuery.page = minPage(); } break;
				}
				if ((curPage !== vm.basicQuery.page) || (d == "a")) reloadQueryState();
			}
			function inputPageChange() { vm.basicQuery.page = Math.min(Math.max(parseInt(vm.basicQuery.page), 1), maxPage()); }
			function toggleDisplayFilter() {
				vm.displayFilter = !(vm.displayFilter);
				var overflowValue = (vm.displayFilter ? [350, "initial"] : [0, "hidden"]);
				$timeout(overflowValue[0]).then(function() {
					$(".bottom-filters").css({'overflow': overflowValue[1]});
				});
			}
		}
	}

	exports.function = ObjectsControllerFunction;
})();