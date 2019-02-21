(function() {
	'use strict';

	ObjectsControllerFunction.$inject = ["$scope", "$state", "$location", "$stateParams", "$q", "$timeout", "apiServices", "generalServices", "websocketsServices"];

	function ObjectsControllerFunction($scope, $state, $location, $stateParams, $q, $timeout, apiServices, generalServices, websocketsServices) {
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

			vm.getExternalVariables(function() {
				vm.updateObjectFilters();
				vm.displayPage = true;
				vm.callQuery();

				$timeout(1000).then(function(){ vm.showPagination = true; });
			});
		}

		function initializeVariables() {

			vm.queryFunction = "getMissions";

			vm.objectList = [];
			vm.queryValuesDetails = {};
			vm.queryModels = {};
			vm.queryModelsData = {};
			vm.objectListCount = 0;
			vm.displayObjects = false;

			vm.pageValues = {
				title: "Missions",
				description: "All currently operations available for undertaking."
			};

			vm.filterValues = {
				sortList: [
					{ text: "Main Reward", value: "reward_a" },
					{ text: "Difficulty", value: "difficulty" },
					{ text: "Unit Limit", value: "unit_limit" },
					{ text: "Counter Reward", value: "reward_b" },
					{ text: "Map", value: "MapId" },
					{ text: "Location", value: "LocationId" },
					{ text: "Objective", value: "objective" },
					{ text: "Client", value: "FactionAId" },
					{ text: "Target", value: "FactionBId" },
					{ text: "Conflict", value: "ConflictId" }
				],
				perPage: 8
			};

			vm.querySections = [
				{ name: "Main Info", id: "basic" },
				{ name: "Factions", id: "factions" },
				{ name: "Objectives", id: "objective" },
				{ name: "Setting", id: "setting" }
			];

			vm.queryValues = {

				qName: { name: "Name", model: "", type: "text", section: "basic" },

				qFactionA: {
					name: "Client Faction", model: "", type: "typeahead", property: "FactionA", section: "factions", template: "factionsTypeAhead",
					input_icon: "ion-flag", icon: "factions", icon_prop: "hashField", icon_ext: "png", class: "flag",
					typeaheadFunction: function(val, prop) {
						return generalServices.getFactions((prop || {qName: val})).then(function(response) {
							if (response.data.success) return response.data.data.map(function(faction) {
								faction.sideField = vm.filterValues.sidesData[faction.sideField].text;
								return faction;
							});
						});
					},
					typeaheadSelectFunction: function(obj) { return vm.genericTypeaheadSelectFunction("FactionA", obj); }
				},

				qFactionASide: { label: "Client Side", model: null, ref: "sidesData", type: "dropdown", section: "factions" },

				qFactionB: {
					name: "Target Faction", model: "", type: "typeahead", property: "FactionB", section: "factions", template: "factionsTypeAhead",
					input_icon: "ion-flag", icon: "factions", icon_prop: "hashField", icon_ext: "png", class: "flag",
					typeaheadFunction: function(val, prop) {
						return generalServices.getFactions((prop || {qName: val})).then(function(response) {
							if (response.data.success) return response.data.data.map(function(faction) {
								faction.sideField = vm.filterValues.sidesData[faction.sideField].text;
								return faction;
							});
						});
					},
					typeaheadSelectFunction: function(obj) { return vm.genericTypeaheadSelectFunction("FactionB", obj); }
				},

				qFactionBSide: { label: "Target Side", model: null, ref: "sidesData", type: "dropdown", section: "factions" },

				qMap: {
					name: "Map", model: "", type: "typeahead", property: "Map", section: "setting", template: "mapsTypeahead",
					input_icon: "ion-map", icon: "maps", icon_prop: "nameField", icon_ext: "jpg",
					typeaheadFunction: function(val, prop) { return vm.genericTypeaheadFunction("getMaps", (prop || { qName: val }) ); },
					typeaheadSelectFunction: function(obj) { return vm.genericTypeaheadSelectFunction("Map", obj); }
				},

				qLocationTypes: { name: "Location Types", model: [], type: "dropdownCheckbox", options: "locationData", section: "setting" },

				qObjective: {
					name: "Objective", model: "", type: "typeahead", property: "Objective", section: "objective", template: "objectivesTypeahead",
					input_icon: "ion-pinpoint", icon: "objectives", icon_prop: "iconName", icon_ext: "png",
					typeaheadFunction: function(val, prop) { return vm.genericTypeaheadFunction("getObjectives", (prop || { qName: val }) ); },
					typeaheadSelectFunction: function(obj) { return vm.genericTypeaheadSelectFunction("Objective", obj); }
				},

				qConflict: {
					name: "Conflict", model: "", type: "typeahead", property: "Conflict", section: "basic", template: "conflictsTypeahead",
					input_icon: "ion-fireball", icon: null, icon_prop: "", icon_ext: "",
					typeaheadFunction: function(val, prop) { return vm.genericTypeaheadFunction("getConflicts", (prop || { qName: val }) ); },
					typeaheadSelectFunction: function(obj) { return vm.genericTypeaheadSelectFunction("Conflict", obj); }
				},

				qDifficulty: {
					name: "Difficulty", ref: "difficulty", type: "slider", section: "objective", class: "short",
					options: { ceil: 5, step: 1, translate: function(v) {return("<i class='icon ion-thermometer'></i> "+v);}},
					model: { min: 0, max: 5 }
				},

				qUnitLimit: {
					name: "Unit Limit", ref: "unit_limit", type: "slider", section: "objective", class: "short",
					options: { ceil: 50, step: 5, translate: function(v) {return("<i class='icon ion-person-stalker'></i> "+v);}},
					model: { min: 5, max: 50 }
				},

				qReward: {
					name: "Reward", ref: "reward", type: "slider", section: "basic",
					options: { ceil: 100000, step: 100, translate: function(v) {return("<i class='icon ion-social-usd'></i> "+v);}},
					model: { min: 0, max: 100000 }
				},

				qCapture: new vm.BoolSliderObject({ name: "Control Location?", ref: "capture", section: "objective" }),

				qAdversarial: new vm.BoolSliderObject({ name: "Adversarial?", ref: "adversarial", section: "objective" })
			};

			vm.basicQuery = { page: 1, order: "DESC", sort: "", qActive: true };

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
			vm.genericTypeaheadFunction = genericTypeaheadFunction;
			vm.genericTypeaheadSelectFunction = genericTypeaheadSelectFunction;
			vm.resetQueryModel = resetQueryModel;

			initializeWebsockets();

			function initializeWebsockets() {
				websocketsServices.initCtrlWS($scope, {
					NewUpgrade: {
						onMessage: reloadQueryState,
						filter: function() { return websocketsServices.joinFilter(["RefreshMissions"]); }
					}
				});
			}

			function getExternalVariables(callback) {
				generalServices.getLocationTypes().then(function(locations) {
					generalServices.getDoctrines().then(function(tactics) {
						generalServices.getMapList().then(function(map_data) {
							generalServices.getSides().then(function(sides_data) {
								vm.filterValues.doctrinesData = tactics;
								vm.filterValues.mapData = map_data;
								vm.filterValues.locationData = locations;
								vm.filterValues.sidesData = sides_data;

								return callback();
							});
						});
					});
				});
			}

			function resetQueryModel(property) {
				vm.queryModels[property] = null;
				vm.queryModelsData["q" + property + "Id"] = null;
				updateURL("q" + property, null);
				applyURL();
			}

			function genericTypeaheadFunction(get_function, queryObj) {
				return generalServices[get_function](queryObj).then(function(response) {
					if (response.data.success) return response.data.data.map(function(result_object) { return result_object; });
				});
			}

			function genericTypeaheadSelectFunction(property, obj) {
				vm.queryModels[property] = null;
				$timeout(100).then(function() {
					vm.queryModels[property] = obj;
					updateURL("q" + property, obj.id);
					applyURL();
				});
			}

			function updateObjectFilters() {
				var v, makeInt = function (x) { return parseInt(x, 10); };

				for (v in vm.queryValues) {
					if (vm.queryValues.hasOwnProperty(v)) {
						var stateParam = parseInt($stateParams[v], 10);

						switch (vm.queryValues[v].type) {
							case "slider": {
								if ($stateParams[v+"Min"]) vm.queryValues[v].model.min = $stateParams[v+"Min"];
								if ($stateParams[v+"Max"]) vm.queryValues[v].model.max = $stateParams[v+"Max"];
							} break;
							case "bool-slider": {
								if (!(angular.isUndefinedOrNull($stateParams[v]))) vm.queryValues[v].model = (($stateParams[v] === "true") ? 0 : 2);
							} break;
							case "dropdownCheckbox": {
								if (!(angular.isUndefinedOrNull($stateParams[v]))) {
									var result = $stateParams[v].split(",").map(makeInt);
									vm.queryValues[v].model = result;
								}
							} break;
							case "typeahead": {
								if (!(angular.isUndefinedOrNull($stateParams[v]))) typeaheadQueryReload(stateParam, v);
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

			function typeaheadQueryReload(stateParam, v) {
				vm.queryModelsData[(v + "Id")] = stateParam;
				vm.queryValues[v].typeaheadFunction(0, { qId: stateParam }).then(function(data) {
					vm.genericTypeaheadSelectFunction(vm.queryValues[v].property, data[0]);
				});
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
							case "typeahead": {
								if (vm.queryModels[qM.property]) {
									var nId = (vm.queryModels[qM.property].id);
									vm.queryModelsData[(v+"Id")] = nId;
									updateURL(v, nId);
								}
							} break;
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
				queryValues = $.extend({}, queryValues, vm.queryModelsData);

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
								vm.queryValues[v].onReset();
								updateURL(v, null);
								vm.queryValues[v].model = [];
							} break;
							case "typeahead": {
								updateURL(v, null);
								vm.queryModels[qM.property] = null;
								vm.queryModelsData[("q" + qM.property + "Id")] = null;
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