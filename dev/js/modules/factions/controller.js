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

			vm.queryFunction = "getFactions";

			vm.objectList = [];
			vm.queryValuesDetails = {};
			vm.objectListCount = 0;
			vm.displayObjects = false;

			vm.pageValues = {
				title: "Factions",
				description: "The groups and armies engaged in perpetual warfare."
			};

			vm.filterValues = {
				sortList: [
					{ text: "Name", value: "name" },
					{ text: "Side", value: "side" },
					{ text: "Foreign Policy", value: "policy" },
					{ text: "Tactics", value: "tactics" },
					{ text: "Training", value: "training" },
					{ text: "Organization", value: "organization" },
					{ text: "Tech", value: "tech" },
					{ text: "ISR", value: "isr" },
					{ text: "Munificence", value: "munificence" }
				],
				perPage: 50
			};

			vm.querySections = [
				{ name: "Basic Info", id: "basic" },
				{ name: "Attributes", id: "modifiers" }
			];

			vm.queryValues = {
				qName: { name: "Name", model: "", type: "text", section: "basic" },
				qSide: { label: "Side", model: null, ref: "sidesData", type: "dropdown", section: "basic" },
				qAreasInterest: {
					name: "Areas of Interest", model: [], type: "dropdownCheckbox",
					options: "mapData", section: "basic"
				},
				qHome: { label: "Home", model: null, ref: "mapData", type: "dropdown", section: "basic" },
				qPolicies: { label: "Policy", model: null, ref: "policiesData", type: "dropdown", section: "basic" },
				qTactics: { label: "Tactics", model: null, ref: "tacticsData", type: "dropdown", section: "basic" },
				qAssets: {
					name: "Assets", ref: "assets", type: "slider", section: "modifiers",
					options: { ceil: 10000, step: 1000, translate: function(v) {return("<i class='icon ion-ios-box'></i> "+v);}},
					model: { min: 0, max: 10000 }
				},
				qTech: {
					name: "Tech Rating", ref: "tech", type: "slider", class: "short", section: "modifiers",
					options: { ceil: 10, step: 1, translate: function(v) {return("<i class='icon ion-monitor'></i> "+v);}},
					model: { min: 0, max: 10 }
				},
				qTraining: {
					name: "Training", ref: "training", type: "slider", class: "short", section: "modifiers",
					options: { ceil: 10, step: 1, translate: function(v) {return("<i class='icon ion-university'></i> "+v);}},
					model: { min: 0, max: 10 }
				},
				qMunificence: {
					name: "Munificence", ref: "munificence", type: "slider", class: "short", section: "modifiers",
					options: { ceil: 10, step: 1, translate: function(v) {return("<i class='icon ion-social-usd'></i> "+v);}},
					model: { min: 0, max: 10 }
				},
				qOrganization: {
					name: "Organization", ref: "organization", type: "slider", class: "short", section: "modifiers",
					options: { ceil: 10, step: 1, translate: function(v) {return("<i class='icon ion-android-sync'></i> "+v);}},
					model: { min: 0, max: 10 }
				},
				qIsr: {
					name: "ISR", ref: "isr", type: "slider", class: "short", section: "modifiers",
					options: { ceil: 10, step: 1, translate: function(v) {return("<i class='icon ion-camera'></i> "+v);}},
					model: { min: 0, max: 10 }
				}
			};

			vm.basicQuery = { page: 1, order: "ASC", sort: "", qActive: true };

			vm.qSortIndex = 0;
		}

		function initializeFunctions() {
			vm.getExternalVariables = getExternalVariables;
			vm.resetFilters = resetFilters;
			vm.changeFilterOrder = changeFilterOrder;
			vm.movePage = movePage;
			vm.callQuery = callQuery;
			vm.reloadQueryState = reloadQueryState;
			vm.toggleDisplayFilter = toggleDisplayFilter;
			vm.updateObjectFilters = updateObjectFilters;
			vm.inputPageChange = inputPageChange;

			function getExternalVariables(callback) {
				generalServices.getSides().then(function(sides) {
					generalServices.getPolicies().then(function(policies) {
						generalServices.getDoctrines().then(function(tactics) {
							generalServices.getMapList().then(function(map_data) {
								vm.filterValues.sidesData = sides;
								vm.filterValues.policiesData = policies;
								vm.filterValues.tacticsData = tactics;
								vm.filterValues.mapData = map_data;

								return callback();
							});
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

			function reloadQueryState() {
				for (var v in vm.queryValues) {
					if (vm.queryValues.hasOwnProperty(v)) {
						var qM = vm.queryValues[v];

						switch (vm.queryValues[v].type) {
							case "slider": {
								updateURL((v + "Min"), (qM.model.min > 0) ? qM.model.min : null);
								updateURL((v + "Max"), (qM.model.max !== qM.options.ceil) ? qM.model.max : null);
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
					if (!(angular.isUndefinedOrNull(objectValue.model)) && (objectValue.model !== "")) filteredQueries[keyValue] = objectValue.model;
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
							case "dropdownCheckbox": {
								vm.queryValues[v].onReset();
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