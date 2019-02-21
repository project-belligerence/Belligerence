(function() {
	'use strict';

	ItemsControllerFunction.$inject = ["$scope", "$state", "$location", "$stateParams", "$q", "$timeout", "apiServices", "generalServices"];

	function ItemsControllerFunction($scope, $state, $location, $stateParams, $q, $timeout, apiServices, generalServices) {
		var vm = this;

		initializeFunctions();
		initializePage();

		// ==============================================

		function initializePage() {
			vm.displayFilter = false;
			vm.reloadingPage = false;
			vm.viewData = {};
			vm.displayPage = false;
			vm.viewData.allOption = [{text: "All", data: null}];
			vm.viewData.allOption2 = { "-1": {name: "All", data: null}};

			vm.storeStoreItemData().then(function() {
				initializeVariables();

				vm.changeTypeDropDown(-1);
				vm.updateItemFilters();

				vm.displayPage = true;
				vm.callQuery();

				$timeout(1000).then(function(){ vm.showPagination = true; });
			});
		}

		function initializeVariables() {

			vm.itemList = [];
			vm.itemListCount = 0;
			vm.displayItems = false;

			vm.filterValues = {
				year: {	floor: 1900, ceil: 2035, step: 5 },
				value: { floor: 0, ceil: 150000, step: 1000 },
				content: vm.viewData.itemContent,
				types: vm.viewData.itemsTypeClass.typeField,
				class: vm.viewData.itemsTypeClass.classField,
				deployable: [{text: "---"}, {text: "Yes"}, {text: "No"}],
				sortInitial: [
					{ text: "Last added", value: "createdAt" },
					{ text: "Name", value: "name" },
					{ text: "Production Year", value: "production_year" },
					{ text: "Classname", value: "classname" },
					{ text: "Description", value: "description" },
					{ text: "Type", value: "type" },
					{ text: "Class", value: "class" },
					{ text: "Base value", value: "value" },
					{ text: "Deployable", value: "deployable" },
				],
				sortList: [],
				perPage: 21
			};

			vm.basicQuery = { page: 1, order: "ASC", sort: "" };

			vm.queryValues = {
				qName: { name: "Name", model: "", type: "text" },
				qYear: { name: "Production year", ref: "year", type: "slider", model: { min: 1900, max: 2035 } },
				qValue: { name: "Base value", ref: "value", type: "slider", model: { min: 0, max: 75000 } },
				qClassname: { name: "Classname", model: "", type: "text" },
				qDescription: { name: "Item description", model: "", type: "text" },
				qDeployable: { model: 0, label: "Deployable?", type: "dropdown", ref: "deployable", values: vm.filterValues.class }
			};

			vm.qSortIndex = 1;
			vm.qContent = { model: undefined, label: "Content: ", type: "dropdown", ref: "content", values: vm.filterValues.content };
			vm.qType = { model: undefined, type: "dropdown", ref: "types", values: vm.filterValues.types };
			vm.qClass = { model: undefined, type: "dropdown", ref: "class", values: vm.filterValues.class };

			vm.queryValuesDetails = {};
		}

		function initializeFunctions() {
			vm.storeStoreItemData = storeStoreItemData;
			vm.changeTypeDropDown = changeTypeDropDown;
			vm.updateQueryValues = updateQueryValues;
			vm.changeFilterOrder = changeFilterOrder;
			vm.movePage = movePage;
			vm.updateURL = updateURL;
			vm.updateItemFilters = updateItemFilters;
			vm.handleQueryClasses = handleQueryClasses;
			vm.callQuery = callQuery;
			vm.reloadQueryState = reloadQueryState;
			vm.toggleDisplayFilter = toggleDisplayFilter;

			function toggleDisplayFilter() {
				vm.displayFilter = !(vm.displayFilter);
				var overflowValue = (vm.displayFilter ? [500, "initial"] : [0, "hidden"]);
				$timeout(overflowValue[0]).then(function() {
					$(".bottom-filters").css({'overflow': overflowValue[1]});
				});
			}

			function updateItemFilters() {

				if ($stateParams.sort) vm.qSortIndex = $stateParams.sort;
				if ($stateParams.order) vm.basicQuery.order = $stateParams.order;

				if ($stateParams.page) vm.basicQuery.page = $stateParams.page;

				if ($stateParams.qName) vm.queryValues.qName.model = $stateParams.qName;
				if ($stateParams.qClassname) vm.queryValues.qClassname.model = $stateParams.qClassname;
				if ($stateParams.qContent) vm.qContent.model = $stateParams.qContent;

				if ($stateParams.qType) {
					vm.qType.model = parseInt($stateParams.qType);
					vm.handleQueryClasses(vm.qType.model);
				}
				if ($stateParams.qClass) {
					if (!$stateParams.qType) {
						vm.qType.model = parseInt($stateParams.qClass[0]);
						vm.handleQueryClasses(vm.qType.model);
						vm.qClass.model = $stateParams.qClass;
					} else { vm.qClass.model = $stateParams.qClass;	}
				}

				if ($stateParams.qDescription) vm.queryValues.qDescription.model = $stateParams.qDescription;
				if ($stateParams.qDeployable) vm.queryValues.qDeployable.model = parseInt($stateParams.qDeployable);

				if ($stateParams.qYearMin) vm.queryValues.qYear.model.min = $stateParams.qYearMin;
				if ($stateParams.qYearMax) vm.queryValues.qYear.model.max = $stateParams.qYearMax;

				if ($stateParams.qValueMin) vm.queryValues.qValue.model.min = $stateParams.qValueMin;
				if ($stateParams.qValueMax) vm.queryValues.qValue.model.max = $stateParams.qValueMax;

				if (($stateParams.qDetail1) || ($stateParams.qDetail2) || ($stateParams.qDetail3) || ($stateParams.qDetail4) || ($stateParams.qDetail5)) {
					vm.queryValuesDetails = { qDetail1: {}, qDetail2: {}, qDetail3: {}, qDetail4: {}, qDetail5: {} };
				}

				if ($stateParams.qDetail1) vm.queryValuesDetails.qDetail1.model = $stateParams.qDetail1;
				if ($stateParams.qDetail2) vm.queryValuesDetails.qDetail2.model = $stateParams.qDetail2;
				if ($stateParams.qDetail3) vm.queryValuesDetails.qDetail3.model = $stateParams.qDetail3;
				if ($stateParams.qDetail4) vm.queryValuesDetails.qDetail4.model = $stateParams.qDetail4;
				if ($stateParams.qDetail5) vm.queryValuesDetails.qDetail5.model = $stateParams.qDetail5;
			}

			function updateURL(property, value) {
				$stateParams[property] = value;
				$state.params[property] = value;
				$location.search(property, value);
			}

			function maxPage() { return Math.min(Math.ceil(vm.itemListCount / vm.filterValues.perPage), (parseInt(vm.basicQuery.page) + 1)); }
			function minPage() { return Math.max((vm.basicQuery.page - 1), 1); }

			function movePage(d) {
				var curPage = vm.basicQuery.page;
				switch (d) {
					case "n": { vm.basicQuery.page = maxPage(); } break;
					case "p": { vm.basicQuery.page = minPage(); } break;
				}
				if ((curPage !== vm.basicQuery.page) || (d == "a")) reloadQueryState();
			}

			function changeFilterOrder() {
				vm.basicQuery.order = ((vm.basicQuery.order === "ASC") ? "DESC" : "ASC");
			}

			function storeStoreItemData() {
				return $q(function(resolve) {
					if (angular.isUndefinedOrNull(vm.viewData.storeSpecializations)) {
						generalServices.getItemsTypeClass().then(function(itemsClass) {
							generalServices.getItemContent().then(function(content) {
								if (itemsClass && content) {
									vm.viewData.itemsTypeClass = itemsClass;
									vm.viewData.itemContent = content;
									return resolve(true);
								} else { return resolve(false); }
							});
						});
					} else { return resolve(true); }
				});
			}

			function changeTypeDropDown(index) {
				vm.qType.model = (index === -1 ? undefined : index);
				handleQueryClasses(index);
			}

			function handleQueryClasses(index) {
				var classList = vm.viewData.itemsTypeClass.classField,
					newClassList = {};

				vm.queryValuesDetails = {};
				vm.filterValues.sortList = apiServices.cloneValue(vm.filterValues.sortInitial);

				if (index >= 0) {
					for (var key in Object.keys(classList)) {
						var keyValue = Object.keys(classList)[key];
						if (parseInt(keyValue[0]) === index) newClassList[Object.keys(classList)[key]] = classList[Object.keys(classList)[key]];
					}
					vm.filterValues.class = newClassList;
					vm.qClass.model = newClassList[0];

					for (var i in vm.viewData.itemsTypeClass.typeField[vm.qType.model].details) {
						var cDetail = vm.viewData.itemsTypeClass.typeField[vm.qType.model].details[i],
							cVal = (parseInt(i) + 1),
							sortVal = ((_.size(vm.filterValues.sortList) - 1) + cVal),
							detailObject = {text: cDetail, value:"detail_" + cVal};
						vm.queryValuesDetails["qDetail" + cVal] = {name: cDetail, model: ""};
						vm.filterValues.sortList[sortVal] = detailObject;
					}
				} else {
					vm.filterValues.class = {};
					vm.qClass.model = undefined;
				}
			}

			function callQuery() {
				var queryValues = vm.updateQueryValues();
				generalServices.getItems(queryValues).then(function(data) {
					var result = apiServices.handleRequestData(data);
					if (result.success) vm.itemData = result.data; vm.itemListCount = result.count;
					$timeout(350).then(function(){ vm.displayItems = true; });
				});
			}

			function reloadQueryState() {
				var queryValues = ["qName", "qClassname", "qDescription"],
					singleValues = ["qContent", "qType", "qClass"];

				vm.updateURL("qDeployable", ((!(angular.isUndefinedOrNull(vm.queryValues.qDeployable.model)) && (vm.queryValues.qDeployable.model > 0)) ? vm.queryValues.qDeployable.model : null));
				queryValues.forEach(function(v) { vm.updateURL(v, ((!(angular.isUndefinedOrNull(vm.queryValues[v].model)) && (vm.queryValues[v].model !== "")) ? vm.queryValues[v].model : null)); });
				singleValues.forEach(function(v) { vm.updateURL(v, ((!(angular.isUndefinedOrNull(vm[v].model)) && (vm[v].model !== "")) ? vm[v].model : null)); });

				for (var key in Object.keys(vm.queryValuesDetails)) {
					var keyValue = Object.keys(vm.queryValuesDetails)[key];
					var objectValue = vm.queryValuesDetails[Object.keys(vm.queryValuesDetails)[key]];
					vm.updateURL(keyValue, ((!(angular.isUndefinedOrNull(objectValue.model))) && (objectValue.model !== "")) ? objectValue.model : null);
				}

				vm.updateURL("qYearMin", ((vm.queryValues.qYear.model.min !== vm.filterValues.year.floor) ? vm.queryValues.qYear.model.min : null));
				vm.updateURL("qYearMax", ((vm.queryValues.qYear.model.max !== vm.filterValues.year.ceil) ? vm.queryValues.qYear.model.max : null));

				vm.updateURL("qValueMin", ((vm.queryValues.qValue.model.min !== vm.filterValues.value.floor) ? vm.queryValues.qValue.model.min : null));
				vm.updateURL("qValueMax", ((vm.queryValues.qValue.model.max !== 75000) ? vm.queryValues.qValue.model.max : null));

				vm.updateURL("sort", vm.qSortIndex);
				vm.updateURL("order", vm.basicQuery.order);
				vm.updateURL("page", vm.basicQuery.page);
			}

			function updateQueryValues() {
				var queryValues = {}, key, keyValue, objectValue,
					filteredQueries = {},
					filteredDetails = {};

				vm.displayItems = false;

				vm.basicQuery.sort = vm.filterValues.sortList[vm.qSortIndex].value;

				for (key in Object.keys(vm.queryValues)) {
					keyValue = Object.keys(vm.queryValues)[key];
					objectValue = vm.queryValues[Object.keys(vm.queryValues)[key]];
					if (!(angular.isUndefinedOrNull(objectValue.model)) && (objectValue.model !== "")) filteredQueries[keyValue] = objectValue.model;
				}

				for (key in Object.keys(vm.queryValuesDetails)) {
					keyValue = Object.keys(vm.queryValuesDetails)[key];
					objectValue = vm.queryValuesDetails[Object.keys(vm.queryValuesDetails)[key]];
					if (!(angular.isUndefinedOrNull(objectValue.model)) && (objectValue.model !== "")) filteredDetails[keyValue] = objectValue.model;
				}

				filteredQueries.qDeployable = (function(v){
					switch(v) {
						case 0: { return undefined; } break;
						case 1: { return true; } break;
						case 2: { return false; } break;
					}
				})(filteredQueries.qDeployable);

				queryValues = $.extend({}, queryValues, vm.basicQuery);
				queryValues = $.extend({}, queryValues, filteredQueries);
				queryValues = $.extend({}, queryValues, filteredDetails);

				if (!(angular.isUndefinedOrNull(vm.qType.model))) queryValues.qType = vm.qType.model;
				if (!(angular.isUndefinedOrNull(vm.qContent.model))) queryValues.qContent = vm.qContent.model;
				if (!(angular.isUndefinedOrNull(vm.qClass.model))) queryValues.qClass = vm.qClass.model;

				return queryValues;
			}
		}
	}

	exports.function = ItemsControllerFunction;
})();