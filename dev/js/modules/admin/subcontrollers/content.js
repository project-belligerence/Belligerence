(function(){
	'use strict';

	module.exports = function(vm, services) {

		function contentSubController(_cb) {
			vm.contentSubController = {};

			vm.contentSubController.pageState = "main";
			vm.contentSubController.contentState = "all";
			vm.contentSubController.objectCtrl = "";

			vm.contentSubController.contentData = {};
			vm.contentSubController.objectData = {};
			vm.contentSubController.objectModel = {};

			vm.contentSubController.changeContentState = changeContentState;
			vm.contentSubController.changeObjectState = changeObjectState;
			vm.contentSubController.getDisplayedFields = getDisplayedFields;
			vm.contentSubController.getEditableFields = getEditableFields;
			vm.contentSubController.getQueryableFields = getQueryableFields;
			vm.contentSubController.getSingle = getSingle;
			vm.contentSubController.createNew = createNew;
			vm.contentSubController.askDeleteContent = askDeleteContent;
			vm.contentSubController.askDuplicateContent = askDuplicateContent;
			vm.contentSubController.changeDropdownValue = changeDropdownValue;
			vm.contentSubController.changeQueryDropdownValue = changeQueryDropdownValue;
			vm.contentSubController.uploadModulePicture = uploadModulePicture;
			vm.contentSubController.editContent = editContent;
			vm.contentSubController.movePage = movePage;
			vm.contentSubController.setObjectValue = setObjectValue;
			vm.contentSubController.changeSortByField = changeSortByField;
			vm.contentSubController.numberToArray = services.apiServices.numberToArray;
			vm.contentSubController.findIndexInObject = services.apiServices.findIndexInObject;

			vm.contentSubController.queryMethods = {
				switchOrder: function() {
					vm.contentSubController.queryValues.order = ((vm.contentSubController.queryValues.order === "ASC") ? "DESC" : "ASC");
				}
			};

			vm.contentSubController.contentList = {
				"item": {
					id: "item", id_key: "hashField",
					name: "Item", name_plural: "Items", url: "items", icon: "ion-cube",
					upload_picture: "upload", picture_property: "hashField", picture_extension: "jpg",
					queryInfo: { perPage: 10 }, single_url: "item/",
					description: "Objects that can be acquired by Operators to be used during combat.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Class Name", property: "classnameField",	type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qClassname", queryType: "text", order: "classname"
						},
						{
							name: "Content", property: "contentField", type: "integer", input: "dropdown", default: 0,
							options: [], onInit: function(v) { vm.contentSubController.contentList.item.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent; },
							onQueryChange: function(v) { vm.contentSubController.contentList.item.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent; },
							display: true, editable: true, queryable: true, query: "qContent", queryType: "dropdown", order: "content"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 512} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						},
						{
							name: "Type", property: "typeField", type: "string", input: "dropdown", default: "0",
							options: [], onChange: ITEM_handleClass, onQueryChange: ITEM_handleClass,
							display: true, editable: true,
							filter: function(v) { return vm.contentSubController.itemsCtrl.itemsTypeClass.typeField[v].name; },
							queryable: true, query: "qType", queryType: "dropdown",
							queryFilter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass[v.property][vm.contentSubController.queryValues[v.query]]; },
							order: "type"
						},
						{
							name: "Class", property: "classField", type: "string", input: "dropdown", default: "01",
							options: [], onInit: ITEM_handleClass,
							display: true, editable: true,
							filter: function(v) { return vm.contentSubController.itemsCtrl.itemsTypeClass.classField[v].name; },
							queryable: true, query: "qClass", queryType: "dropdown",
							queryFilter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass[v.property][vm.contentSubController.queryValues[v.query]]; },
							order: "class"
						},
						{
							name: "Cost", property: "valueField", type: "integer", input: "text", default: 100,
							display: true, editable: true, queryable: true, query: "qValue", queryType: "range", order: "value",
							queryDetails: { min: 0, max: 500000, options: { floor: 0, ceil: 1000000, step: 1000, noSwitching: true } }
						},
						{
							name: "Deployable", property: "deployableField", type: "bool", input: "checkbox", default: true,
							display: false, editable: true, queryable: true, query: "qDeployable", queryType: "checkbox", order: "deployable"
						},
						{
							name: "Information", property: "infoField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: true, query: "qInfo", queryType: "text", order: "info"
						},
						{
							name: "Production Year", property: "productionYear", type: "integer", input: "text", default: 1990,
							display: false, editable: true, queryable: true, query: "qYear", queryType: "range", order: "production_year",
							queryDetails: { min: 1900, max: 2040, options: { floor: 1900, ceil: 2040, step: 1, noSwitching: true } }
						},
						{
							name: "Detail 1", property: "detailField1", type: "string", input: "text", default: "",
							filterName: ITEM_renderDetails,
							display: false, editable: true, queryable: true, query: "qDetail1", queryType: "text", order: "detail_1"
						},
						{
							name: "Detail 2", property: "detailField2", type: "string", input: "text", default: "",
							filterName: ITEM_renderDetails,
							display: false, editable: true, queryable: true, query: "qDetail2", queryType: "text", order: "detail_2"
						},
						{
							name: "Detail 3", property: "detailField3",	type: "string", input: "text", default: "",
							filterName: ITEM_renderDetails,
							display: false, editable: true, queryable: true, query: "qDetail3", queryType: "text", order: "detail_3"
						},
						{
							name: "Detail 4", property: "detailField4", type: "string", input: "text", default: "",
							filterName: ITEM_renderDetails,
							display: false, editable: true, queryable: true, query: "qDetail4", queryType: "text", order: "detail_4"
						},
						{
							name: "Detail 5", property: "detailField5", type: "string", input: "text", default: "",
							filterName: ITEM_renderDetails,
							display: false, editable: true, queryable: true, query: "qDetail5", queryType: "text", order: "detail_5"
						}
					],
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "itemsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						services.generalServices.getItemsTypeClass().then(function(data) {
							services.generalServices.getItemContent().then(function(content) {
								vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass = data;
								vm.contentSubController[vm.contentSubController.objectCtrl].itemContent = content;
								vm.contentSubController[vm.contentSubController.objectCtrl].inputs = {};

								assignDropDownOptions();

								return _cb(true);

								function assignDropDownOptions() {
									var ItemObject = vm.contentSubController.contentList.item;

									for (var field in ItemObject.fields) {
										var currentField = ItemObject.fields[field];

										if (currentField.input === "dropdown") {
											var dropDownOptions = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass[currentField.property];

											vm.contentSubController[vm.contentSubController.objectCtrl].inputs[currentField.property] = "0";

											for (var dIndex in dropDownOptions) {
												var currentOption = dropDownOptions[dIndex];
												currentField.options.push({data: dIndex, text: currentOption.name});
											}
										}
									}
								}
							});
						});
					},
					crud: {
						post: services.adminServices.postItem,
						update: services.adminServices.editItem,
						getAll: services.generalServices.getItems,
						getSingle: services.generalServices.getItem,
						delete: services.adminServices.deleteItem,
						duplicate: services.adminServices.duplicateItem
					}
				},
				"store": {
					id: "store", id_key: "hashField",
					name: "Store", name_plural: "Stores", url: "stores", icon: "ion-ios-cart",
					upload_picture: "upload", picture_property: "hashField", picture_extension: "jpg",
					queryInfo: { perPage: 10 }, single_url: "market/store/",
					description: "Stores where players can purchase items.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Tagline", property: "subTitleField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 128} } ],
							display: false, editable: true, queryable: true, query: "qInfo", queryType: "text", order: "subtitle"
						},
						{
							name: "Specializations", property: "typesField", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) { return services.apiServices.readObjectToArray(vm.contentSubController[vm.contentSubController.objectCtrl].storeTypes, v, "name"); },
							options: [], onInit: function(v) { vm.contentSubController.contentList.store.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].storeTypes; },
							onQueryChange: function(v) { vm.contentSubController.contentList.store.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].storeTypes; },
							display: true, editable: true, queryable: true, query: "qTypes", queryType: "dropdownCheckbox"
						},
						{
							name: "Required Prestige", property: "prestigeRequired", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 5, step: 1, translate: function(v) { return ("<i class='icon ion-star'></i> " + v); }}},
							display: true, editable: true, queryable: true, query: "qReqPrestige", queryType: "range", order: "prestige",
							queryDetails: { min: 1, max: 5, options: { floor: 1, ceil: 5, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-star'></i> " + v); }}}
						},
						{
							name: "Status", property: "statusField", type: "integer", input: "dropdown", default: 0,
							options: [], onInit: function(v) { vm.contentSubController.contentList.store.fields[5].options = vm.contentSubController[vm.contentSubController.objectCtrl].storeStatus; },
							onQueryChange: function(v) { vm.contentSubController.contentList.store.fields[5].options = vm.contentSubController[vm.contentSubController.objectCtrl].storeStatus; },
							display: true, editable: true, queryable: true, query: "qStatus", queryType: "dropdown", order: "status"
						},
						{
							name: "Resupply Days", property: "resupplyDay", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) { return services.apiServices.readObjectToArray(services.apiServices.getWeekDaysDropdown(), v, "text"); },
							options: services.apiServices.getWeekDaysDropdown(), display: true, editable: true, queryable: true,
							query: "qResupply", queryType: "dropdownCheckbox"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						}
					],
					create: function(_cb) {
						vm.contentSubController.objectModel.requiredUpgrades = [];
						vm.contentSubController.objectModel.blacklistedUpgrades = [];
						return _cb(true);
					},
					special_fields: {
						"store_stock": {
							name: "Store Inventory", input: "typeahead", property: "storeStock", template: "itemStoreTypeAhead",
							getFunction: services.adminServices.getStoreStock, selectFunction: "",
							typeaheadFunction: function(val) {
								return services.generalServices.getItems({ qName: val }).then(function(response) {
									if (response.data.success) return response.data.data.map(function(item) {

										item.contentField = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent[item.contentField].text;
										item.classField = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.classField[item.classField].name;
										item.typeField = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.typeField[item.typeField].name;

										return item;
									});
								});
							},
							typeaheadSelectFunction: function(item) {
								services.adminServices.addStoreStock(vm.contentSubController.currentObjectHash, {item: item.hashField}).then(function(data) {
									if (data) {
										if (data.data.success) {
											services.alertsServices.addNewAlert("success", item.nameField + " has been added to the store.");

											var cState = vm.contentSubController.contentList[vm.contentSubController.pageState];
											cState.special_fields.store_stock.getFunction(vm.contentSubController.currentObjectHash).then(function(storeItems) {
												for (var i in storeItems) {
													var cStock = storeItems[i];
													cStock.available = ((cStock.available) ? true : false);
													cStock.content = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent[cStock.content].text;
													cStock.class = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.classField[cStock.class].name;
													cStock.type = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.typeField[cStock.type].name;
												}
												vm.contentSubController.objectModel.storeStock = storeItems;
											});
										}
									}
								});
							},
							saveFunction: function() {
								var currentHash = vm.contentSubController.currentObjectHash,
									savedObject = {
										items: [], amounts: [], discount_deviations: [],
										discounts: [], availables: [], supply_amounts: [], min_supply_percents: [],
									}, i;

								for (i in vm.contentSubController.objectModel.storeStock) {
									var cStock = vm.contentSubController.objectModel.storeStock[i];

									savedObject.items.push([cStock.hashField]);
									savedObject.amounts.push([parseInt(cStock.amount)]);
									savedObject.discounts.push([parseInt(cStock.store_discount)]);
									savedObject.supply_amounts.push([parseInt(cStock.supply_amount)]);
									savedObject.min_supply_percents.push([parseInt(cStock.min_supply_percent)]);
									savedObject.discount_deviations.push([parseInt(cStock.discount_deviation)]);
									savedObject.availables.push([cStock.available]);
								}

								services.adminServices.updateStoreStockRecursive(currentHash, {parameters: savedObject}).then(function() {
									var cState = vm.contentSubController.contentList[vm.contentSubController.pageState];

									cState.special_fields.store_stock.getFunction(vm.contentSubController.currentObjectHash).then(function(storeItems) {
										for (var i in storeItems) {
											var cStock = storeItems[i];
											cStock.available = ((cStock.available) ? true : false);
											cStock.content = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent[cStock.content].text;
											cStock.class = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.classField[cStock.class].name;
											cStock.type = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.typeField[cStock.type].name;
										}
										vm.contentSubController.objectModel.storeStock = storeItems;
									});
								});
							},
							deleteItem: function(hash) {
								var	modalOptions = {
										header: { text: 'Remove from store?', icon: 'ion-trash-a' },
										body: {	text: 'Are you sure you want to remove this item from the store inventory?' },
										choices: {
											yes: { text: 'Delete', icon: 'ion-trash-a', class: 'warning' },
											no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
										}
								}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

								newModal.result.then(function(choice) {
									if (choice) {
										services.adminServices.removeStoreStock(vm.contentSubController.currentObjectHash, {item: hash}).then(function() {
											var cState = vm.contentSubController.contentList[vm.contentSubController.pageState];
											cState.special_fields.store_stock.getFunction(vm.contentSubController.currentObjectHash).then(function(storeItems) {
												var i;
												for (i in storeItems) { storeItems[i].available = ((storeItems[i].available) ? true : false); }
												for (i in storeItems) {
													var cStock = storeItems[i];
													cStock.available = ((cStock.available) ? true : false);
													cStock.content = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent[cStock.content].text;
													cStock.class = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.classField[cStock.class].name;
													cStock.type = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.typeField[cStock.type].name;
												}
												vm.contentSubController.objectModel.storeStock = storeItems;

												services.alertsServices.addNewAlert("warning", "The item has been removed from the store inventory.");
											});
										});
									}
								});
							}
						},
						"required_upgrades": {
							name: "Required Upgrades", input: "typeahead", property: "requiredUpgrades", template: "upgradesTypeahead",
							getFunction: services.adminServices.getStoreStock, selectFunction: "",
							sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.requiredUpgrades.push(newRequired);
								vm.contentSubController.objectModel.requiredUpgrades = _.uniqBy(vm.contentSubController.objectModel.requiredUpgrades, 'hashField');
							}
						},
						"blacklisted_upgrades": {
							name: "Blacklisted Upgrades", input: "typeahead", property: "blacklistedUpgrades", template: "upgradesTypeahead",
							getFunction: services.adminServices.getStoreStock, selectFunction: "",
							sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.blacklistedUpgrades.push(newRequired);
								vm.contentSubController.objectModel.blacklistedUpgrades = _.uniqBy(vm.contentSubController.objectModel.blacklistedUpgrades, 'hashField');
							}
						}
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "storesCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						services.generalServices.getStoreSpecializations().then(function(data) {
							services.generalServices.getItemsTypeClass().then(function(items) {
								services.generalServices.getStoreStatuses().then(function(statuses) {
									services.generalServices.getItemContent().then(function(content) {
										services.upgradesServices.getUpgradesData().then(function(upgrades) {
											vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData = upgrades.upgradesData;
											vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass = items;
											vm.contentSubController[vm.contentSubController.objectCtrl].storeTypes = data.typesField;
											vm.contentSubController[vm.contentSubController.objectCtrl].storeStatus = statuses;
											vm.contentSubController[vm.contentSubController.objectCtrl].itemContent = content;
											return _cb(true);
										});
									});
								});
							});
						});
					},
					crud: {
						post: services.adminServices.postStore,
						update: services.adminServices.editStore,
						getAll: services.generalServices.getStores,
						getSingle: function(hash) {
							return services.$q(function(resolve) {
								services.generalServices.getStore(hash).then(function(data) {
									var cState = vm.contentSubController.contentList[vm.contentSubController.pageState];

									cState.special_fields.store_stock.getFunction(hash).then(function(storeItems) {
										for (var i in storeItems) {
											var cStock = storeItems[i];
											cStock.available = ((cStock.available) ? true : false);
											cStock.content = vm.contentSubController[vm.contentSubController.objectCtrl].itemContent[cStock.content].text;
											cStock.class = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.classField[cStock.class].name;
											cStock.type = vm.contentSubController[vm.contentSubController.objectCtrl].itemsTypeClass.typeField[cStock.type].name;
										}

										if (data) {
											if (data.data.success) {
												vm.contentSubController.objectModel.requiredUpgrades = data.data.data.requiredUpgrades;
												vm.contentSubController.objectModel.blacklistedUpgrades = data.data.data.blacklistedUpgrades;
											}
										}
										vm.contentSubController.objectModel.storeStock = storeItems;

										return resolve(data);
									});
								});
							});
						},
						delete: services.adminServices.deleteItem,
						resupply: function(hash) {
							services.marketServices.askReRollStore().then(function(choice) {
								if (choice) {
									services.marketServices.doResupplyStore(hash).then(function(data) {
										if (data) services.alertsServices.addNewAlert("success", "Stock resupplied.");
									});
								}
							});
						}
					}
				},
				"upgrade": {
					id: "upgrade", id_key: "hashField",
					name: "Upgrade", name_plural: "Upgrades", url: "upgrades", icon: "ion-university",
					upload_picture: "gallery", picture_property: "iconName", picture_extension: "png",
					queryInfo: { perPage: 10 }, single_url: "upgrade/",
					description: "Purchaseables that add extra functionality for Outfits and Freelancers.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Icon", property: "iconName", type: "string",
							input: "gallery", default: "generic",
							openFunction: function(object) {
								return services.upgradesServices.openUpgradeImages(object).then(function(v) {
									vm.contentSubController.objectModel.iconNameInput = v;
								});
							},
							display: false, editable: true, queryable: false
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Slug", property: "slugField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qSlug", queryType: "text"
						},
						{
							name: "Owner", property: "typeField", type: "integer", input: "dropdown", default: 0,
							options: [], onInit: function(v) { vm.contentSubController.contentList.upgrade.fields[4].options = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesOwner; },
							onQueryChange: function(v) { vm.contentSubController.contentList.upgrade.fields[4].options = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesOwner; },
							display: true, editable: true, queryable: true,	query: "qType", queryType: "dropdown", order: "type"
						},
						{
							name: "Kind", property: "kindField", type: "integer", input: "dropdown", default: 0,
							options: [], onInit: function(v) { vm.contentSubController.contentList.upgrade.fields[5].options = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesTypes; },
							onQueryChange: function(v) { vm.contentSubController.contentList.upgrade.fields[5].options = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesTypes; },
							display: true, editable: true, queryable: true, query: "qKind", queryType: "dropdown", order: "kind"
						},
						{
							name: "Usable UI", property: "hasUIField", type: "bool", input: "checkbox", default: false, display: false, editable: true,
							queryable: true, query: "qHasUI", queryType: "checkbox", defaultQuery: null, order: "has_ui"
						},
						{
							name: "In-game Variable", property: "ingameVariable", type: "string", input: "text", default: "none",
							validation: [ { library: validator, func: 'isLength', params: { min: 0, max: 128} } ],
							display: false, editable: true, queryable: true, query: "qIngame", queryType: "text"
						},
						{
							name: "Description", property: "flavortextField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qText", queryType: "flavor_text", order: "description"
						},
						{
							name: "Max. Tier", property: "maxTier", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 5, step: 1, translate: function(v) { return ("<i class='icon ion-ios-bolt'></i> " + v); }}},
							display: true, editable: true, queryable: true, query: "qMaxTier", queryType: "range", order: "max_tier",
							queryDetails: { min: 1, max: 5, options: { floor: 1, ceil: 5, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-ios-bolt'></i> " + v); }}}
						},
						{
							name: "Base Cost", property: "baseCost", type: "integer", input: "text", default: 1000,
							display: true, editable: true, queryable: true, query: "qCost", queryType: "range", order: "base_cost",
							queryDetails: { min: 500, max: 100000, options: { floor: 500, ceil: 100000, step: 500, noSwitching: true } }
						},
						{
							name: "Cost Multiplier", property: "costMultiplier", type: "integer", input: "text", default: 2,
							display: true, editable: true, queryable: false
						},
					],
					special_fields: {
						"flavor_text_upgrades": {
							name: "Tier Effect Description", input: "textarea", property: "flavortextUpgradesField"
						},
						"parent_upgrade": {
							name: "Parent Upgrade", input: "typeahead", property: "parentUpgrade", template: "upgradesTypeahead",
							selectFunction: "",	typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								vm.contentSubController.objectModel.parentUpgrade = upgrade;
							}
						},
						"required_upgrades": {
							name: "Required Upgrades", input: "typeahead", property: "requiredUpgrades", template: "upgradesTypeahead",
							sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.requiredUpgrades.push(newRequired);
								vm.contentSubController.objectModel.requiredUpgrades = _.uniqBy(vm.contentSubController.objectModel.requiredUpgrades, 'hashField');
							}
						},
						"blacklisted_upgrades": {
							name: "Blacklisted Upgrades", input: "typeahead", property: "blacklistedUpgrades", template: "upgradesTypeahead",
							sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.blacklistedUpgrades.push(newRequired);
								vm.contentSubController.objectModel.blacklistedUpgrades = _.uniqBy(vm.contentSubController.objectModel.blacklistedUpgrades, 'hashField');
							}
						}
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "upgradesCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						services.upgradesServices.getUpgradesData().then(function(data) {
							vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData = data.upgradesData;
							return _cb(true);
						});
					},
					create: function(_cb) {
						vm.contentSubController.objectModel.parentUpgrade = -1;
						vm.contentSubController.objectModel.requiredUpgrades = [];
						vm.contentSubController.objectModel.blacklistedUpgrades = [];
						return _cb(true);
					},
					crud: {
						post: services.adminServices.addUpgrade,
						update: services.adminServices.editUpgrade,
						getAll: services.upgradesServices.getUpgrades,
						getSingle: function(hash) {
							return services.$q(function(resolve) {
								services.upgradesServices.getUpgrade(hash).then(function(data) {
									vm.contentSubController.objectModel.parentUpgrade = data.parentUpgrade;
									vm.contentSubController.objectModel.requiredUpgrades = data.requiredUpgrades;
									vm.contentSubController.objectModel.blacklistedUpgrades = data.blacklistedUpgrades;
									vm.contentSubController.objectModel.flavortextUpgradesField = data.flavortextUpgradesField;
									return resolve(data);
								});
							});
						},
						delete: services.adminServices.deleteUpgrade,
					}
				},
				"map": {
					id: "map", id_key: "classnameField",
					name: "Map", name_plural: "Maps", url: 'maps', icon: "ion-map",
					upload_picture: "upload", picture_property: "classnameField", picture_extension: "jpg",
					queryInfo: { perPage: 10 }, single_url: "map/",
					description: "Maps in which the Conflicts will take place.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Demonym", property: "demonymField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: false, query: "qDemonym", queryType: "text", order: "demonym"
						},
						{
							name: "Classname", property: "classnameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: false, editable: true, queryable: true, query: "qClassname", queryType: "text"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						},
						{
							name: "Square KM", property: "squarekmField", type: "integer", input: "text", default: 20,
							display: true, editable: true, queryable: true, query: "qSquareKM", defaultQuery: 300, queryType: "range", order: "square_km",
							queryDetails: { min: 10, max: 500, options: { floor: 10, ceil: 500, step: 5, noSwitching: true } }
						},
						{
							name: "Climate", property: "climateField", type: "integer", input: "dropdown", default: 0,
							options: [], onInit: function(v) { vm.contentSubController.contentList.map.fields[6].options = vm.contentSubController[vm.contentSubController.objectCtrl].climateData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.map.fields[6].options = vm.contentSubController[vm.contentSubController.objectCtrl].climateData; },
							display: true, editable: true, queryable: true, query: "qClimate", queryType: "dropdown", order: "climate"
						},
						{
							name: "Latitude", property: "latitudeField", type: "integer", input: "text", default: 1000,
							display: false, editable: true, queryable: false, query: "qYear", queryType: "range", order: "latitude"
						},
						{
							name: "Longitude", property: "longitudeField", type: "integer", input: "text", default: 1000,
							display: false, editable: true, queryable: false, query: "qYear", queryType: "range", order: "longitude"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: false, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					special_fields: { },
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "mapsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						services.generalServices.getClimates().then(function(data) {
							vm.contentSubController[vm.contentSubController.objectCtrl].climateData = data;
							return _cb(true);
						});
					},
					create: function(_cb) { return _cb(true); },
					crud: {
						post: services.adminServices.addMap,
						update: services.adminServices.editMap,
						getAll: services.generalServices.getMaps,
						getSingle: services.generalServices.getMap,
						delete: services.adminServices.deleteMap,
					}
				},
				"location": {
					id: "location", id_key: "classnameField",
					name: "Location", name_plural: "Locations", url: 'locations', icon: "ion-location",
					upload_picture: "none", picture_property: "hashField", picture_extension: "jpg",
					queryInfo: { perPage: 10 }, single_url: "location/",
					description: "Locations where Missions will be specifically located at.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Map", property: "MapId", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].mapList[services.apiServices.findIndexInObject(vm.contentSubController[vm.contentSubController.objectCtrl].mapList, "data", v)].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.location.fields[2].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapList; },
							onQueryChange: function(v) { vm.contentSubController.contentList.location.fields[2].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapList; },
							display: true, editable: false, queryable: true, query: "qMap", queryType: "dropdown", order: "MapId"
						},
						{
							name: "Type", property: "typeField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].locationTypes[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.location.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].locationTypes; },
							onQueryChange: function(v) { vm.contentSubController.contentList.location.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].locationTypes; },
							display: true, editable: true, queryable: true, query: "qType", queryType: "dropdown", order: "type"
						},
						{
							name: "Classname", property: "classnameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: false, editable: true, queryable: true, query: "qClassname", queryType: "text"
						},
						{
							name: "Grid Ref.", property: "gridRef", type: "string", input: "text", default: "",
							display: true, editable: true, queryable: false, query: "qGridRef", queryType: "text", order: "grid_ref"
						},
						{
							name: "Position", property: "positionField", type: "string", input: "text", default: "",
							display: false, editable: true, queryable: false, query: "qPosition", queryType: "text", order: "position"
						},
						{
							name: "Square M", property: "sizeField", type: "integer", input: "text", default: 20,
							display: true, editable: true, queryable: true, query: "qSize", defaultQuery: 300, queryType: "range", order: "size",
							queryDetails: { min: 10, max: 2000, options: { floor: 10, ceil: 2000, step: 10, noSwitching: true } }
						},
						{
							name: "Elevation", property: "elevationField", type: "integer", input: "text", default: 20,
							display: true, editable: true, queryable: true, query: "qElevation", defaultQuery: 100, queryType: "range", order: "elevation",
							queryDetails: { min: -100, max: 5000, options: { floor: -100, ceil: 5000, step: 10, noSwitching: true } }
						},
						{
							name: "Importance", property: "importanceField", type: "integer", input: "text", default: 20,
							display: true, editable: true, queryable: true, query: "qImportance", defaultQuery: 10, queryType: "range", order: "importance",
							queryDetails: { min: 0, max: 20, options: { floor: 0, ceil: 20, step: 1, noSwitching: true } }
						},
						{
							name: "Tenability", property: "tenabilityField", type: "integer", input: "text", default: 20,
							display: true, editable: true, queryable: true, query: "qTenability", defaultQuery: 0, queryType: "range", order: "tenability",
							queryDetails: { min: 0, max: 100, options: { floor: 0, ceil: 100, step: 10, noSwitching: true } }
						},
						{
							name: "Insertable", property: "insertableField", type: "bool", input: "checkbox", default: false, display: true, editable: true,
							queryable: true, query: "qInsertable", queryType: "checkbox", defaultQuery: null, order: "insertable"
						},
						{
							name: "Extractable", property: "extractableField", type: "bool", input: "checkbox", default: false, display: true, editable: true,
							queryable: true, query: "qExtractable", queryType: "checkbox", defaultQuery: null, order: "extractable"
						},
						{
							name: "Controlling Side", property: "ownerField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.location.fields[13].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.location.fields[13].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							display: true, editable: true, queryable: true, query: "qOwner", queryType: "dropdown", order: "owner"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: true, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					special_fields: { },
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "locationsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};

						services.generalServices.getSides().then(function(sides_data) {
							services.generalServices.getMapList().then(function(map_data) {
								services.generalServices.getLocationTypes().then(function(location_data) {
									vm.contentSubController[vm.contentSubController.objectCtrl].sidesData = sides_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].mapList = map_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].locationTypes = location_data;
									return _cb(true);
								});
							});
						});
					},
					create: function(_cb) { return _cb(true); },
					crud: {
						post: services.adminServices.addLocation,
						update: services.adminServices.editLocation,
						getAll: services.generalServices.getLocations,
						getSingle: services.generalServices.getLocation,
						delete: services.adminServices.deleteLocation,
					}
				},
				"faction": {
					id: "faction", id_key: "hashField",
					name: "Faction", name_plural: "Factions", url: "factions", icon: "ion-flag",
					upload_picture: "upload", picture_property: "hashField", picture_extension: "png", hide_crop: true,
					queryInfo: { perPage: 10 }, single_url: "faction/",
					description: "Factions who will engage each other in Conflict.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Demonym", property: "demonymField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: false, query: "qDemonym", queryType: "text", order: "demonym"
						},
						{
							name: "Side", property: "sideField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.faction.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.faction.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							display: true, editable: true, queryable: true, query: "qSide", queryType: "dropdown", order: "side"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						},
						{
							name: "Loadout", property: "loadoutField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: true, query: "qLoadout", queryType: "text", order: "loadout"
						},
						{
							name: "Max. Assets", property: "assetsField", type: "integer", input: "slider", default: 1000,
							inputDetails: { start: 100, options: { floor: 100, ceil: 10000, step: 100, translate: function(v) { return ("<i class='icon ion-ios-box'></i> " + v); }}},
							display: true, editable: true, queryable: true, query: "qAssets", queryType: "range", order: "assets",
							queryDetails: { min: 100, max: 10000, options: { floor: 100, ceil: 10000, step: 100, noSwitching: true, translate: function(v) { return ("<i class='icon ion-ios-box'></i> " + v); }}}
						},
						{
							name: "Current Assets", property: "currentAssetsField", type: "integer", input: "slider", default: 1000,
							inputDetails: { start: 0, options: { floor: 0, ceil: 10000, step: 100, translate: function(v) { return ("<i class='icon ion-ios-pulse-strong'></i> " + v); }}},
							display: true, editable: true, queryable: true, query: "qCurrentAssets", queryType: "range", order: "current_assets",
							queryDetails: { min: 0, max: 10000, options: { floor: 0, ceil: 10000, step: 100, noSwitching: true, translate: function(v) { return ("<i class='icon ion-ios-pulse-strong'></i> " + v); }}}
						},
						{
							name: "Tech Rating", property: "techField", query: "qTech", order: "tech", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-monitor'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-monitor'></i> " + v); }}}
						},
						{
							name: "Training", property: "trainingField", query: "qTraining", order: "training", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-university'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-university'></i> " + v); }}}
						},
						{
							name: "Munificence", property: "munificenceField", query: "qMunificence", order: "munificence", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}}
						},
						{
							name: "Organization", property: "organizationField", query: "qOrganization", order: "organization", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-android-sync'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-android-sync'></i> " + v); }}}
						},
						{
							name: "ISR", property: "isrField", query: "qIsr", order: "isr", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-camera'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-camera'></i> " + v); }}}
						},
						{
							name: "Tactics", property: "tacticsField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].tacticsData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.faction.fields[13].options = vm.contentSubController[vm.contentSubController.objectCtrl].tacticsData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.faction.fields[13].options = vm.contentSubController[vm.contentSubController.objectCtrl].tacticsData; },
							display: true, editable: true, queryable: true, query: "qTactics", queryType: "dropdown", order: "tactics"
						},
						{
							name: "Policy", property: "policyField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].policiesData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.faction.fields[14].options = vm.contentSubController[vm.contentSubController.objectCtrl].policiesData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.faction.fields[14].options = vm.contentSubController[vm.contentSubController.objectCtrl].policiesData; },
							display: true, editable: true, queryable: true, query: "qPolicy", queryType: "dropdown", order: "policy"
						},
						{
							name: "Areas of Interest", property: "areasOfInterest", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) {
								var indexes = [], mapData = vm.contentSubController[vm.contentSubController.objectCtrl].mapData;
								for (var i = 0; i < v.length; i++) { indexes.push(services.apiServices.findIndexInObject(mapData, 'data', v[i])); }
								return services.apiServices.readObjectToArray(mapData, indexes, "text");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.faction.fields[15].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.faction.fields[15].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							display: true, editable: true, queryable: true, query: "qAreasInterest", queryType: "dropdownCheckbox"
						},
						{
							name: "Homeland", property: "MapId", type: "integer", input: "dropdown", default: null,
							filter: function(v) {
								var sIndex = (v ? (((typeof v) === "object") ? v[0] : v) : 0), mapData = vm.contentSubController[vm.contentSubController.objectCtrl].mapData;
								return ((sIndex > 0) ? mapData[services.apiServices.findIndexInObject(mapData, 'data', sIndex)].text : "None");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.faction.fields[16].options = _.union([{text: "None", data: -1}], vm.contentSubController[vm.contentSubController.objectCtrl].mapData); },
							onQueryChange: function(v) { vm.contentSubController.contentList.faction.fields[16].options = _.union([{text: "None", data: -1}], vm.contentSubController[vm.contentSubController.objectCtrl].mapData); },
							display: true, editable: true, queryable: true, query: "qHome", queryType: "dropdown", order: "home"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: true, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					create: function(_cb) {
						vm.contentSubController.objectModel.requiredUpgrades = [];
						vm.contentSubController.objectModel.blacklistedUpgrades = [];
						return _cb(true);
					},
					special_fields: {
						"required_upgrades": {
							name: "Required Upgrades", input: "typeahead", property: "requiredUpgrades", template: "upgradesTypeahead",
							selectFunction: "", sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.requiredUpgrades.push(newRequired);
								vm.contentSubController.objectModel.requiredUpgrades = _.uniqBy(vm.contentSubController.objectModel.requiredUpgrades, 'hashField');
							}
						},
						"blacklisted_upgrades": {
							name: "Blacklisted Upgrades", input: "typeahead", property: "blacklistedUpgrades", template: "upgradesTypeahead",
							selectFunction: "", sliderOptions: function(limit) { return { floor: 1, ceil: limit, step: 1, }; },
							typeaheadFunction: UPGRADE_typeaheadFunction,
							typeaheadSelectFunction: function(upgrade) {
								var newRequired = new UPGRADE_requiredObject(upgrade);
								vm.contentSubController.objectModel.blacklistedUpgrades.push(newRequired);
								vm.contentSubController.objectModel.blacklistedUpgrades = _.uniqBy(vm.contentSubController.objectModel.blacklistedUpgrades, 'hashField');
							}
						}
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "factionsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						vm.contentSubController.objectModel.requiredUpgrades = [];
						vm.contentSubController.objectModel.blacklistedUpgrades = [];

						services.generalServices.getSides().then(function(sides) {
							services.generalServices.getPolicies().then(function(policies) {
								services.generalServices.getDoctrines().then(function(tactics) {
									services.generalServices.getMapList().then(function(map_data) {
										services.upgradesServices.getUpgradesData().then(function(upgrades) {

											vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData = upgrades.upgradesData;
											vm.contentSubController[vm.contentSubController.objectCtrl].sidesData = sides;
											vm.contentSubController[vm.contentSubController.objectCtrl].policiesData = policies;
											vm.contentSubController[vm.contentSubController.objectCtrl].tacticsData = tactics;
											vm.contentSubController[vm.contentSubController.objectCtrl].mapData = map_data;

											return _cb(true);
										});
									});
								});
							});
						});
					},
					crud: {
						post: services.adminServices.addFaction,
						update: services.adminServices.editFaction,
						getAll: services.generalServices.getFactions,
						getSingle: function(hash) {
							return services.$q(function(resolve) {
								services.generalServices.getFaction(hash).then(function(data) {
									if (data) {
										vm.contentSubController.objectModel.requiredUpgrades = data.requiredUpgrades;
										vm.contentSubController.objectModel.blacklistedUpgrades = data.blacklistedUpgrades;
									}
									return resolve(data);
								});
							});
						},
						delete: services.adminServices.deleteFaction,
						duplicate: services.adminServices.duplicateFaction
					}
				},
				"conflict": {
					id: "conflict", id_key: "hashField",
					name: "Conflict", name_plural: "Conflicts", url: "conflicts", icon: "ion-fireball",
					upload_picture: "upload", picture_property: "hashField", picture_extension: "jpg", hide_crop: true,
					queryInfo: { perPage: 10 }, single_url: "conflict/",
					description: "Factions warring against each other, which will generate contracts.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 128} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Location", property: "MapId", type: "integer", input: "dropdown", default: null,
							filter: function(v) {
								var sIndex = (v ? (((typeof v) === "object") ? v[0] : v) : 0), mapData = vm.contentSubController[vm.contentSubController.objectCtrl].mapData;
								return ((sIndex > 0) ? mapData[services.apiServices.findIndexInObject(mapData, 'data', sIndex)].text : "None");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.conflict.fields[2].options = _.union([{text: "None", data: -1}], vm.contentSubController[vm.contentSubController.objectCtrl].mapData); },
							onQueryChange: function(v) { vm.contentSubController.contentList.conflict.fields[2].options = _.union([{text: "None", data: -1}], vm.contentSubController[vm.contentSubController.objectCtrl].mapData); },
							display: true, editable: true, queryable: true, query: "qLocation", queryType: "dropdown", order: "location"
						},
						{
							name: "Winner Side", property: "victorField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.conflict.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.conflict.fields[3].options = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData; },
							display: true, editable: true, queryable: true, query: "qVictor", queryType: "dropdown", order: "victor"
						},
						{
							name: "Status", property: "statusField", type: "integer", input: "dropdown", default: 0,
							filter: function(v) { return vm.contentSubController[vm.contentSubController.objectCtrl].statusData[v].text; },
							options: [], onInit: function(v) { vm.contentSubController.contentList.conflict.fields[4].options = vm.contentSubController[vm.contentSubController.objectCtrl].statusData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.conflict.fields[4].options = vm.contentSubController[vm.contentSubController.objectCtrl].statusData; },
							display: true, editable: true, queryable: true, query: "qStatus", queryType: "dropdown", order: "status"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: true, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					special_fields: {
						"participants": {
							name: "Belligerent Factions", input: "typeahead", property: "factionsField", template: "factionsTypeAhead",
							autoassign: true, selectFunction: "",
							onModelAssign: function(model, data) {
								for (var i = model.factionsField.length - 1; i >= 0; i--) {
									model.factionsField[i].participant_table.initialDeployedAssetsField = model.factionsField[i].participant_table.deployedAssetsField;
								}
							},
							sliderOptions: {
								resolution: { floor: -10, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-flash'></i> " + v); } },
								modifiers: { floor: -10, ceil: 10, step: 1, translate: function(v) { return ((v > 0) ? ("+" + v) : v); } }
							},
							methods: {
								getAssetsSlider: function(faction) {
									return { floor: 0, ceil: faction.assetsField, step: 100, translate: function(v) { return ("<i class='icon ion-ios-box'></i> " + v); } };
								},
								returnInterest: function(faction) {
									var isHome = (vm.contentSubController.objectModel.MapIdInput === faction.MapId),
										isInterested = services.apiServices.inArray(vm.contentSubController.objectModel.MapIdInput, faction.areasOfInterest),
										interestObject = {
											display: (isHome || isInterested),
											icon: (isHome ? "ion-home" : "ion-flag"),
											tooltip: (isHome ? "This Faction is fighting in its Home territory." : "This Faction has a strategic interest in this Map.")
										};
									return interestObject;
								}
							},
							typeaheadFunction: function(val) {
								return services.generalServices.getFactions({qName: val}).then(function(response) {
									if (response.data.success) return response.data.data.map(function(faction) {
										faction.sideField = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[faction.sideField].text;
										return faction;
									});
								});
							},
							typeaheadSelectFunction: function(faction) {
								var	modalOptions = {
										header: { text: 'Add ' + faction.nameField + ' into the Conflict?', icon: 'ion-log-in' },
										body: {	text: 'Are you sure you want to include ' + faction.nameField + ' as a belligerent in this Conflict?' },
										choices: {
											yes: { text: 'Confirm', icon: 'ion-log-in', class: 'warning' },
											no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
										}
								}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

								newModal.result.then(function(choice) {
									if (choice) {
										services.adminServices.addBelligerent(vm.contentSubController.currentObjectHash, faction.hashField).then(function(data) {
											if (services.apiServices.responseOK(data)) {
												services.generalServices.getBelligerents(vm.contentSubController.currentObjectHash).then(function(factions) {
													if (factions) {
														for (var i = factions.length - 1; i >= 0; i--) { factions[i].participant_table.initialDeployedAssetsField = factions[i].participant_table.deployedAssetsField; }
														vm.contentSubController.objectModel.factionsField = [];

														services.$timeout(1).then(function() {
															vm.contentSubController.objectModel.factionsField = factions;
															services.alertsServices.addNewAlert("success", faction.nameField + " has been added to the Conflict.");
														});
													}
												});
											}
										});
									}
								});
							},
							editItem: function(faction, index) {
								var	modalOptions = {
										header: { text: 'Save changes for ' + faction.nameField + '?', icon: 'ion-edit' },
										body: {	text: 'Are you sure you want to edit ' + faction.nameField + ' values in Conflict?' },
										choices: {
											yes: { text: 'Confirm', icon: 'ion-edit', class: 'warning' },
											no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
										}
								}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

								var initialDeployed = faction.participant_table.initialDeployedAssetsField;
								faction.participant_table.deployedAssetsField = Math.max(Math.min((faction.currentAssetsField + initialDeployed), faction.participant_table.deployedAssetsField), 100);

								newModal.result.then(function(choice) {
									if (choice) {
										services.adminServices.editBelligerent(vm.contentSubController.currentObjectHash, faction).then(function(participant) {
											if (services.apiServices.responseOK(participant)) {
												var participantData = participant.data.data;

												participantData.participant_table.initialDeployedAssetsField = participantData.participant_table.deployedAssetsField;
												vm.contentSubController.objectModel.factionsField[index] = participantData;

												services.alertsServices.addNewAlert("warning", faction.nameField + "'s values in the Conflict have been edited.");
											}
										});
									}
								});
							},
							deleteItem: function(faction, index) {
								var	modalOptions = {
										header: { text: 'Remove ' + faction.nameField + ' from the Conflict?', icon: 'ion-log-out' },
										body: {	text: 'Are you sure you want to remove ' + faction.nameField + ' as a belligerent from this Conflict?' },
										choices: {
											yes: { text: 'Confirm', icon: 'ion-log-out', class: 'warning' },
											no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
										}
								}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

								newModal.result.then(function(choice) {
									if (choice) {
										services.adminServices.removeBelligerent(vm.contentSubController.currentObjectHash, faction.hashField).then(function() {
											services.generalServices.getBelligerents(vm.contentSubController.currentObjectHash).then(function(factions) {
												if (factions) {
													for (var i = factions.length - 1; i >= 0; i--) { factions[i].participant_table.initialDeployedAssetsField = factions[i].participant_table.deployedAssetsField; }
													vm.contentSubController.objectModel.factionsField = [];

													services.$timeout(1).then(function() {
														vm.contentSubController.objectModel.factionsField = factions;
														services.alertsServices.addNewAlert("danger", faction.nameField + " has been removed from the Conflict.");
													});
												}
											});
										});
									}
								});
							}
						},
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "conflictsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
						vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

						services.generalServices.getSides().then(function(sides_data) {
							services.generalServices.getConflictStatus().then(function(status_data) {
								services.generalServices.getMapList().then(function(map_data) {

									vm.contentSubController[vm.contentSubController.objectCtrl].sidesData = sides_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].statusData = status_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].mapData = map_data;

									return _cb(true);
								});
							});
						});
					},
					create: function(_cb) { return _cb(true); },
					crud: {
						post: services.adminServices.addConflict,
						update: services.adminServices.editConflict,
						getAll: services.generalServices.getConflicts,
						getSingle: services.generalServices.getConflict,
						delete: services.adminServices.deleteConflict,
					}
				},
				"objective": {
					id: "objective", id_key: "hashField",
					name: "Objective", name_plural: "Objectives", url: 'objectives', icon: "ion-pinpoint",
					upload_picture: "gallery", picture_property: "iconName", picture_extension: "png",
					queryInfo: { perPage: 10 }, single_url: "objective/",
					description: "Tasks that will be requested as part of Missions.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Icon", property: "iconName", type: "string",
							input: "gallery", default: "generic",
							openFunction: function(object) {
								return services.generalServices.openObjectiveImages(object).then(function(v) {
									vm.contentSubController.objectModel.iconNameInput = v;
								});
							},
							display: false, editable: true, queryable: false
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Task icon", property: "taskIconField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: true, editable: true, queryable: true, query: "qTaskIcon", queryType: "text", order: "task_icon"
						},
						{
							name: "Classname", property: "classnameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: true, query: "qClassname", queryType: "text"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						},
						{
							name: "Success Desc.", property: "successDescField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qSuccessDesc", queryType: "text", order: "success_desc"
						},
						{
							name: "Failed Desc.", property: "failureDescField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qFailedDesc", queryType: "text", order: "failure_desc"
						},
						{
							name: "Time Limit (hours)", property: "hourLimitField", query: "qHourLimit", order: "hour_limit", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 6, step: 1, translate: function(v) { return ("<i class='icon ion-clock'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 6, options: { floor: 1, ceil: 6, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-clock'></i> " + v); }}}
						},
						{
							name: "Difficulty", property: "difficultyField", query: "qDifficulty", order: "difficulty", type: "integer", input: "slider", default: 1,
							inputDetails: { start: 1, options: { floor: 1, ceil: 5, step: 1, translate: function(v) { return ("<i class='icon ion-thermometer'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 5, options: { floor: 1, ceil: 5, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-thermometer'></i> " + v); }}}
						},
						{
							name: "Unit Limit", property: "unitLimit", query: "qUnitLimit", order: "unit_limit", type: "integer", input: "slider", default: 10,
							inputDetails: { start: 10, options: { floor: 5, ceil: 50, step: 5, translate: function(v) { return ("<i class='icon ion-person-stalker'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 5, max: 50, options: { floor: 5, ceil: 50, step: 5, noSwitching: true, translate: function(v) { return ("<i class='icon ion-person-stalker'></i> " + v); }}}
						},
						{
							name: "Gen. Chance", property: "chanceField", query: "qChance", order: "chance", type: "integer", input: "slider", default: 100,
							inputDetails: { start: 1, options: { floor: 1, ceil: 100, step: 1, translate: function(v) { return (v + "%"); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 100, options: { floor: 1, ceil: 100, step: 1, noSwitching: true, translate: function(v) { return (v + "%"); }}}
						},
						{
							name: "Asset Cost", property: "assetCostField", query: "qAssetCost", order: "asset_cost", type: "integer", input: "slider", default: 100,
							inputDetails: { start: 100, options: { floor: 0, ceil: 3000, step: 50, translate: function(v) { return ("<i class='icon ion-ios-box'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 0, max: 3000, options: { floor: 0, ceil: 3000, step: 50, noSwitching: true, translate: function(v) { return ("<i class='icon ion-ios-box'></i> " + v); }}}
						},
						{
							name: "Asset Damage", property: "assetDamageField", query: "qAssetDamage", order: "asset_damage", type: "integer", input: "slider", default: 100,
							inputDetails: { start: 100, options: { floor: 0, ceil: 3000, step: 50, translate: function(v) { return ("<i class='icon ion-ios-box-outline'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 0, max: 3000, options: { floor: 0, ceil: 3000, step: 50, noSwitching: true, translate: function(v) { return ("<i class='icon ion-ios-box-outline'></i> " + v); }}}
						},
						{
							name: "Base Reward", property: "baseRewardField", type: "integer", input: "text", default: 1000,
							display: true, editable: true, queryable: true, query: "qBaseReward", defaultQuery: 1000, queryType: "range", order: "base_reward",
							queryDetails: { min: 100, max: 10000, options: { floor: 100, ceil: 10000, step: 100, noSwitching: true, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}}
						},
						{
							name: "Associated Doctrines", property: "doctrineTypes", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) {
								var indexes = [], doctrinesData = vm.contentSubController[vm.contentSubController.objectCtrl].doctrinesData;
								for (var i = 0; i < v.length; i++) { indexes.push(services.apiServices.findIndexInObject(doctrinesData, 'data', v[i])); }
								return services.apiServices.readObjectToArray(doctrinesData, indexes, "text");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.objective.fields[15].options = vm.contentSubController[vm.contentSubController.objectCtrl].doctrinesData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.objective.fields[15].options = vm.contentSubController[vm.contentSubController.objectCtrl].doctrinesData; },
							display: true, editable: true, queryable: true, query: "qDoctrineTypes", queryType: "dropdownCheckbox"
						},
						{
							name: "Blacklisted Maps", property: "disabledMaps", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) {
								var indexes = [], mapData = vm.contentSubController[vm.contentSubController.objectCtrl].mapData;
								for (var i = 0; i < v.length; i++) { indexes.push(services.apiServices.findIndexInObject(mapData, 'data', v[i])); }
								return services.apiServices.readObjectToArray(mapData, indexes, "text");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.objective.fields[16].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.objective.fields[16].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							display: true, editable: true, queryable: true, query: "qDisabledMaps", queryType: "dropdownCheckbox"
						},
						{
							name: "Locations", property: "locationTypes", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) {
								var indexes = [], locationsTypeData = vm.contentSubController[vm.contentSubController.objectCtrl].locationsTypeData;
								for (var i = 0; i < v.length; i++) { indexes.push(services.apiServices.findIndexInObject(locationsTypeData, 'data', v[i])); }
								return services.apiServices.readObjectToArray(locationsTypeData, indexes, "text");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.objective.fields[17].options = vm.contentSubController[vm.contentSubController.objectCtrl].locationsTypeData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.objective.fields[17].options = vm.contentSubController[vm.contentSubController.objectCtrl].locationsTypeData; },
							display: true, editable: true, queryable: true, query: "qLocationTypes", queryType: "dropdownCheckbox"
						},
						{
							name: "Control Location", property: "captureField", type: "bool", input: "checkbox", default: false, display: true, editable: true,
							queryable: true, query: "qCapture", queryType: "checkbox", defaultQuery: false, order: "capture"
						},
						{
							name: "Adversarial", property: "adversarialField", type: "bool", input: "checkbox", default: false, display: true, editable: true,
							queryable: true, query: "qAdversarial", queryType: "checkbox", defaultQuery: false, order: "adversarial"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: true, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					special_fields: { },
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "objectivesCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};

						services.generalServices.getDoctrines().then(function(doctrines_data) {
							services.generalServices.getLocationTypes().then(function(locations_data) {
								services.generalServices.getMapList().then(function(map_data) {
									vm.contentSubController[vm.contentSubController.objectCtrl].doctrinesData = doctrines_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].locationsTypeData = locations_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].mapData = map_data;

									return _cb(true);
								});
							});
						});
					},
					create: function(_cb) { return _cb(true); },
					crud: {
						post: services.adminServices.addObjective,
						update: services.adminServices.editObjective,
						getAll: services.generalServices.getObjectives,
						getSingle: services.generalServices.getObjective,
						delete: services.adminServices.deleteObjective,
						duplicate: services.adminServices.duplicateObjective
					}
				},
				"advisory": {
					id: "advisory", id_key: "hashField",
					name: "Advisory", name_plural: "Advisories", url: 'advisories', icon: "ion-alert-circled",
					upload_picture: "gallery", picture_property: "iconName", picture_extension: "png",
					queryInfo: { perPage: 10 }, single_url: "advisorie/",
					description: "Situation modifiers that can make a Mission easier or harder.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Icon", property: "iconName", type: "string",
							input: "gallery", default: "generic",
							openFunction: function(object) {
								return services.generalServices.openAdvisoryImages(object).then(function(v) {
									vm.contentSubController.objectModel.iconNameInput = v;
								});
							},
							display: false, editable: true, queryable: false
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: true, editable: true, queryable: true, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Classname", property: "classnameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
							display: false, editable: true, queryable: true, query: "qClassname", queryType: "text"
						},
						{
							name: "Description", property: "descriptionField", type: "string", input: "textarea", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 256} } ],
							display: false, editable: true, queryable: true, query: "qDescription", queryType: "text", order: "description"
						},
						{
							name: "Value", property: "valueField", query: "qValue", order: "value", type: "integer", input: "slider", default: 0,
							inputDetails: { start: 0, options: { floor: -10, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-alert'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: -10, max: 10, options: { floor: -10, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-alert'></i> " + v); }}}
						},
						{
							name: "Blacklisted Maps", property: "disabledMaps", type: "string", input: "dropdownCheckbox", default: [],
							filter: function(v) {
								var indexes = [], mapData = vm.contentSubController[vm.contentSubController.objectCtrl].mapData;
								for (var i = 0; i < v.length; i++) { indexes.push(services.apiServices.findIndexInObject(mapData, 'data', v[i])); }
								return services.apiServices.readObjectToArray(mapData, indexes, "text");
							},
							options: [], onInit: function(v) { vm.contentSubController.contentList.advisory.fields[6].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							onQueryChange: function(v) { vm.contentSubController.contentList.advisory.fields[6].options = vm.contentSubController[vm.contentSubController.objectCtrl].mapData; },
							display: true, editable: true, queryable: true, query: "qDisabledMaps", queryType: "dropdownCheckbox"
						},
						{
							name: "Global Effect", property: "globalField", type: "bool", input: "checkbox", default: false, display: true, editable: true,
							queryable: true, query: "qGlobal", queryType: "checkbox", defaultQuery: null, order: "global"
						},
						{
							name: "Active", property: "activeField", type: "bool", input: "checkbox", default: true, display: true, editable: true,
							queryable: true, query: "qActive", queryType: "checkbox", defaultQuery: true, order: "active"
						}
					],
					special_fields: {
						"objectives": {
							name: "Blacklisted Objectives", input: "typeahead", property: "blacklistedObjectives", template: "objectivesTypeahead",
							selectFunction: "", input_icon: "ion-pinpoint", icon: "objectives", icon_prop: "iconName", icon_ext: "png",
							typeaheadFunction: function(val) { return GENERIC_typeaheadFunction("getObjectives", { qName: val }); },
							typeaheadSelectFunction: function(obj) {

								var i, fI = -1, blkObj = vm.contentSubController.objectModel.blacklistedObjectives;
								for (i = blkObj.length - 1; i >= 0; i--) { if (blkObj[i].id === obj.id) { fI = i; }}
								if (fI === -1)  {
									vm.contentSubController.objectModel.blacklistedObjectives.push(obj);

									vm.contentSubController.objectModel.disabledObjectivesInput = [];
									for (i = blkObj.length - 1; i >= 0; i--) { vm.contentSubController.objectModel.disabledObjectivesInput.push(blkObj[i].id); }
									vm.contentSubController.objectModel.disabledObjectivesInput = _.sortedUniq(vm.contentSubController.objectModel.disabledObjectivesInput);
								}
							},
							removeObject: function(index) {
								vm.contentSubController.objectModel.blacklistedObjectives.splice(index, 1);

								var i, blkObj = vm.contentSubController.objectModel.blacklistedObjectives;

								vm.contentSubController.objectModel.disabledObjectivesInput = [];
								for (i = blkObj.length - 1; i >= 0; i--) { vm.contentSubController.objectModel.disabledObjectivesInput.push(blkObj[i].id); }
								vm.contentSubController.objectModel.disabledObjectivesInput = _.sortedUniq(vm.contentSubController.objectModel.disabledObjectivesInput);
							}
						}
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "advisoriesCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};

						services.generalServices.getObjectivesList().then(function(objectives_data) {
							services.generalServices.getMapList().then(function(map_data) {
								vm.contentSubController[vm.contentSubController.objectCtrl].objectivesData = objectives_data;
								vm.contentSubController[vm.contentSubController.objectCtrl].mapData = map_data;

								return _cb(true);
							});
						});
					},
					create: function(_cb) {
						vm.contentSubController.objectModel.blacklistedObjectives = [];
						vm.contentSubController.objectModel.disabledObjectivesInput = [];

						return _cb(true);
					},
					crud: {
						post: services.adminServices.addAdvisory,
						update: services.adminServices.editAdvisory,
						getAll: services.generalServices.getAdvisories,
						getSingle: function(hash) {
							return services.$q(function(resolve) {
								services.generalServices.getAdvisory(hash).then(function(data) {
									if (data) {
										vm.contentSubController.objectModel.blacklistedObjectives = [];
										vm.contentSubController.objectModel.disabledObjectivesInput = [];

										services.generalServices.getObjectivesSimple({ list: data.disabledObjectives }).then(function(data_objectives) {
											var objectives = data_objectives.data.data;
											vm.contentSubController.objectModel.blacklistedObjectives = _.concat(vm.contentSubController.objectModel.blacklistedObjectives, objectives);
											return resolve(data);
										});
									}
								});
							});
						},
						delete: services.adminServices.deleteAdvisory,
						duplicate: services.adminServices.duplicateAdvisory
					}
				},
				"mission": {
					id: "mission", id_key: "hashField",
					name: "Mission", name_plural: "Missions", url: 'missions', icon: "ion-document-text",
					upload_picture: "none", picture_property: "iconName", picture_extension: "png",
					queryInfo: { perPage: 10 }, single_url: "mission/",
					description: "Missions which may be signed under Contracts.",
					fields: [
						{
							name: "Unique Hash", property: "hashField",	type: "string", input: "text", default: "123",
							display: false, editable: false, queryable: false, order: "name"
						},
						{
							name: "Name", property: "nameField", type: "string", input: "text", default: "",
							validation: [ { library: validator, func: 'isLength', params: { min: 1, max: 64} } ],
							display: true, editable: true, queryable: false, query: "qName", queryType: "text", order: "name"
						},
						{
							name: "Difficulty", property: "difficultyField", query: "qDifficulty", order: "difficulty", type: "integer", input: "slider", default: 5,
							inputDetails: { start: 1, options: { floor: 1, ceil: 10, step: 1, translate: function(v) { return ("<i class='icon ion-alert'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1, max: 10, options: { floor: 1, ceil: 10, step: 1, noSwitching: true, translate: function(v) { return ("<i class='icon ion-alert'></i> " + v); }}}
						},
						{
							name: "Reward A (Client)", property: "rewardAField", query: "qRewardA", order: "reward_a", type: "integer", input: "slider", default: 1000,
							inputDetails: { start: 1000, options: { floor: 1000, ceil: 100000, step: 1000, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1000, max: 100000, options: { floor: 1000, ceil: 100000, step: 1000, noSwitching: true, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}}
						},
						{
							name: "Reward B (Target)", property: "rewardBField", query: "qRewardB", order: "reward_b", type: "integer", input: "slider", default: 1000,
							inputDetails: { start: 1000, options: { floor: 1000, ceil: 100000, step: 1000, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}},
							display: true, editable: true, queryable: true, queryType: "range",
							queryDetails: { min: 1000, max: 100000, options: { floor: 1000, ceil: 100000, step: 1000, noSwitching: true, translate: function(v) { return ("<i class='icon ion-social-usd'></i> " + v); }}}
						},
						{
							name: "Expired", property: "expiredField", type: "bool", input: "checkbox", default: false, display: true, editable: false,
							queryable: true, query: "qExpired", queryType: "checkbox", defaultQuery: false, order: "expired"
						}
					],
					special_fields: {
						"maps": {
							name: "Map", input: "typeahead", property: "Map", template: "mapsTypeahead",
							selectFunction: "", input_icon: "ion-map", icon: "maps", icon_prop: "nameField", icon_ext: "jpg",
							typeaheadFunction: function(val) { return GENERIC_typeaheadFunction("getMaps", { qName: val }); },
							typeaheadSelectFunction: function(obj) {
								if (!(angular.isUndefinedOrNull(vm.contentSubController.objectModel.Map))) {
									if (obj.id === (vm.contentSubController.objectModel.Map.id || null)) return 0;
								}
								vm.contentSubController.objectModel.Map = null;
								services.$timeout(1).then(function() {
									vm.contentSubController.objectModel.Map = obj;
									vm.contentSubController.objectModel.MapId = obj.id;
									vm.contentSubController.objectModel.Location = null;
									vm.contentSubController.objectModel.LocationId = null;
								});
							}
						},
						"locations": {
							name: "Location", input: "typeahead", property: "Location", template: "locationsTypeahead",
							selectFunction: "", input_icon: "ion-location", icon: null, icon_prop: "", icon_ext: "",
							typeaheadFunction: function(val) {
								return services.generalServices.getLocations({ qName: val, qMap: vm.contentSubController.objectModel.Map.id }).then(function(response) {
									if (response.data.success) return response.data.data.map(function(location) {
										location.typeField = vm.contentSubController[vm.contentSubController.objectCtrl].locationsData[location.typeField].text;
										return location;
									});
								});
							},
							typeaheadSelectFunction: function(obj) { return GENERIC_typeaheadSelectFunction("Location", obj); }
						},
						"objectives": {
							name: "Objective", input: "typeahead", property: "Objective", template: "objectivesTypeahead",
							selectFunction: "", input_icon: "ion-pinpoint", icon: "objectives", icon_prop: "iconName", icon_ext: "png",
							typeaheadFunction: function(val) { return GENERIC_typeaheadFunction("getObjectives", { qName: val }); },
							typeaheadSelectFunction: function(obj) { return GENERIC_typeaheadSelectFunction("Objective", obj); }
						},
						"conflicts": {
							name: "Conflict", input: "typeahead", property: "Conflict", template: "conflictsTypeahead",
							selectFunction: "", input_icon: "ion-fireball", icon: null, icon_prop: "", icon_ext: "",
							typeaheadFunction: function(val) { return GENERIC_typeaheadFunction("getConflicts", { qName: val }); },
							typeaheadSelectFunction: function(obj) { return GENERIC_typeaheadSelectFunction("Conflict", obj); }
						},
						"factionA": {
							name: "Client", input: "typeahead", property: "FactionA", template: "factionsTypeAhead",
							selectFunction: "", input_icon: "ion-flag", icon: "factions", icon_prop: "hashField", icon_ext: "png",
							typeaheadFunction: function(val) {
								return services.generalServices.getFactions({qName: val}).then(function(response) {
									if (response.data.success) return response.data.data.map(function(faction) {
										faction.sideField = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[faction.sideField].text;
										return faction;
									});
								});
							},
							typeaheadSelectFunction: function(obj) { return GENERIC_typeaheadSelectFunction("FactionA", obj); }
						},
						"factionB": {
							name: "Target", input: "typeahead", property: "FactionB", template: "factionsTypeAhead",
							selectFunction: "", input_icon: "ion-flag", icon: "factions", icon_prop: "hashField", icon_ext: "png",
							typeaheadFunction: function(val) {
								return services.generalServices.getFactions({qName: val}).then(function(response) {
									if (response.data.success) return response.data.data.map(function(faction) {
										faction.sideField = vm.contentSubController[vm.contentSubController.objectCtrl].sidesData[faction.sideField].text;
										return faction;
									});
								});
							},
							typeaheadSelectFunction: function(obj) { return GENERIC_typeaheadSelectFunction("FactionB", obj); }
						},
						"advisories": {
							name: "Active Advisories", input: "typeahead", property: "advisoriesDisplayField", template: "advisoriesTypeahead",
							selectFunction: "", input_icon: "ion-alert-circled", icon: "advisories", icon_prop: "iconName", icon_ext: "png",
							typeaheadFunction: function(val) { return GENERIC_typeaheadFunction("getAdvisories", { qName: val }); },
							typeaheadSelectFunction: function(obj) {

								var i, fI = -1, advObj = vm.contentSubController.objectModel.advisoriesDisplayField;
								for (i = advObj.length - 1; i >= 0; i--) { if (advObj[i].id === obj.id) { fI = i; }}
								if (fI === -1) {
									vm.contentSubController.objectModel.advisoriesDisplayField.push(obj);
									vm.contentSubController.objectModel.advisoriesDisplayField = _.sortedUniq(vm.contentSubController.objectModel.advisoriesDisplayField);
								}
							},
							removeObject: function(index) { vm.contentSubController.objectModel.advisoriesDisplayField.splice(index, 1); }
						}
					},
					controller: function(_cb) {
						vm.contentSubController.objectCtrl = "missionsCtrl";
						vm.contentSubController[vm.contentSubController.objectCtrl] = {};

						services.generalServices.getSides().then(function(sides_data) {
							services.generalServices.getConflictStatus().then(function(status_data) {
								services.generalServices.getLocationTypes().then(function(locations_data) {
									vm.contentSubController[vm.contentSubController.objectCtrl].sidesData = sides_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].statusData = status_data;
									vm.contentSubController[vm.contentSubController.objectCtrl].locationsData = locations_data;

									return _cb(true);
								});
							});
						});
					},
					create: function(_cb) {
						var idProperties = ["Objective", "Conflict", "FactionA", "FactionB", "Location", "Map"], i;
						for (i = idProperties.length - 1; i >= 0; i--) {
							vm.contentSubController.objectModel[idProperties[i] + "Id"] = null;
							vm.contentSubController.objectModel[idProperties[i]] = null;
						}
						vm.contentSubController.objectModel.advisoriesDisplayField = [];
						return _cb(true);
					},
					crud: {
						post: function(hash) {
							return services.$q(function(resolve) {
								var idProperties = ["Objective", "Conflict", "FactionA", "FactionB", "Location", "Map"], i, check = true;
								for (i = idProperties.length - 1; i >= 0; i--) {
									if (!vm.contentSubController.objectModel[idProperties[i]]) { check = false; break; }
								}

								if (check) {
									var advisories = [], objAdv = vm.contentSubController.objectModel.advisoriesDisplayField;
									for (i = objAdv.length - 1; i >= 0; i--) { advisories.push(objAdv[i].id); }

									vm.contentSubController.objectModel.advisoriesField = _.sortedUniq(advisories);

									vm.contentSubController.objectModel.ObjectiveId = vm.contentSubController.objectModel.Objective.id;
									vm.contentSubController.objectModel.ConflictId = vm.contentSubController.objectModel.Conflict.id;
									vm.contentSubController.objectModel.FactionAId = vm.contentSubController.objectModel.FactionA.id;
									vm.contentSubController.objectModel.FactionBId = vm.contentSubController.objectModel.FactionB.id;
									vm.contentSubController.objectModel.LocationId = vm.contentSubController.objectModel.Location.id;
									vm.contentSubController.objectModel.MapId = vm.contentSubController.objectModel.Map.id;

									vm.contentSubController.objectModel.nameField = vm.contentSubController.objectModel.nameFieldInput;
									vm.contentSubController.objectModel.difficultyField = vm.contentSubController.objectModel.difficultyFieldInput;
									vm.contentSubController.objectModel.rewardAField = vm.contentSubController.objectModel.rewardAFieldInput;
									vm.contentSubController.objectModel.rewardBField = vm.contentSubController.objectModel.rewardBFieldInput;

									var savedModel = _.pick(vm.contentSubController.objectModel, [
										"nameField", "difficultyField", "rewardAField", "rewardBField",
										"advisoriesField", "ObjectiveId", "ConflictId", "FactionAId",
										"FactionBId", "LocationId", "MapId"
									]);

									services.adminServices.addMission("", savedModel).then(function(data) { return resolve(data); });
								} else { services.alertsServices.addNewAlert("danger", "Please input all fields.");	}
							});
						},
						update: function(hash) {
							return services.$q(function(resolve) {
								var i, advisories = [], objAdv = vm.contentSubController.objectModel.advisoriesDisplayField;
								for (i = objAdv.length - 1; i >= 0; i--) { advisories.push(objAdv[i].id); }

								vm.contentSubController.objectModel.advisoriesField = _.sortedUniq(advisories);

								vm.contentSubController.objectModel.ObjectiveId = vm.contentSubController.objectModel.Objective.id;
								vm.contentSubController.objectModel.ConflictId = vm.contentSubController.objectModel.Conflict.id;
								vm.contentSubController.objectModel.FactionAId = vm.contentSubController.objectModel.FactionA.id;
								vm.contentSubController.objectModel.FactionBId = vm.contentSubController.objectModel.FactionB.id;
								vm.contentSubController.objectModel.LocationId = vm.contentSubController.objectModel.Location.id;
								vm.contentSubController.objectModel.MapId = vm.contentSubController.objectModel.Map.id;

								vm.contentSubController.objectModel.nameField = vm.contentSubController.objectModel.nameFieldInput;
								vm.contentSubController.objectModel.difficultyField = vm.contentSubController.objectModel.difficultyFieldInput;
								vm.contentSubController.objectModel.rewardAField = vm.contentSubController.objectModel.rewardAFieldInput;
								vm.contentSubController.objectModel.rewardBField = vm.contentSubController.objectModel.rewardBFieldInput;

								var savedModel = _.pick(vm.contentSubController.objectModel, [
									"nameField", "difficultyField", "rewardAField", "rewardBField",
									"advisoriesField", "ObjectiveId", "ConflictId", "FactionAId",
									"FactionBId", "LocationId", "MapId"
								]);

								services.adminServices.editMission(vm.contentSubController.currentObjectHash, savedModel).then(function(data) { return resolve(data); });
							});
						},
						getAll: services.generalServices.getMissions,
						getSingle: function(hash) {
							return services.$q(function(resolve) {
								services.generalServices.getMission(hash).then(function(data) {
									if (data) {
										services.generalServices.getAdvisoriesSimple({ list: data.advisoriesField }).then(function(data_advisories) {
											var advisories = data_advisories.data.data;

											vm.contentSubController.objectModel.advisoriesDisplayField = advisories;

											vm.contentSubController.objectModel.Objective = data.Objective;
											vm.contentSubController.objectModel.Conflict = data.Conflict;
											vm.contentSubController.objectModel.FactionA = data.FactionA;
											vm.contentSubController.objectModel.FactionB = data.FactionB;
											vm.contentSubController.objectModel.Location = data.Location;
											vm.contentSubController.objectModel.Map = data.Map;

											return resolve(data);
										});
									}
								});
							});
						},
						delete: services.adminServices.deleteMission,
					}
				}
			};

			changeContentState((services.$state.params.section || "main"));

			function changeContentState(state) {
				vm.contentSubController.pageState = "null";
				vm.contentSubController.contentData = [];
				vm.contentSubController.queryForm = {};
				vm.contentSubController.showPagination = false;

				services.$timeout(350).then(function() {
					if (state !== "main") {
						services.apiServices.resolveFunction(vm.contentSubController.contentList[state].controller).then(function() {
							var editState = services.$state.params.editHash;

							vm.updateURL("section", state);

							vm.refreshContent(state, true, function() {
								initializeQueryValues(vm.contentSubController.initialData);

								if (!(angular.isUndefinedOrNull(vm.contentSubController.queryValues))) {
									vm.contentSubController.queryParams.totalItems = vm.contentSubController.initialData.data.count;
								}
								if (editState) vm.contentSubController.getSingle(editState);
							});
						});
					} else { services.$timeout(250).then(function() { vm.contentSubController.pageState = state; vm.updateURL("section", null); }); }
				});
			}

			function setObjectValue(property, value, index) {
				if (index) {
					vm.contentSubController.objectModel[property][index] = value;
				} else {
					vm.contentSubController.objectModel[property] = value;
				}
			}

			function maxPage() { return Math.min( Math.ceil(vm.contentSubController.queryParams.totalItems / vm.contentSubController.queryParams.perPage), (parseInt(vm.contentSubController.queryValues.page) + 1)); }
			function minPage() { return Math.max((vm.contentSubController.queryValues.page - 1), 1); }

			function movePage(d) {
				var curPage = vm.contentSubController.queryValues.page;
				switch (d) {
					case "n": { vm.contentSubController.queryValues.page = maxPage(); } break;
					case "p": { vm.contentSubController.queryValues.page = minPage(); } break;
				}
				if ((curPage !== vm.contentSubController.queryValues.page) || (d == "a")) vm.refreshContent();
			}

			function GENERIC_typeaheadFunction(get_function, queryObj) {
				return services.generalServices[get_function](queryObj).then(function(response) {
					if (response.data.success) return response.data.data.map(function(result_object) { return result_object; });
				});
			}

			function GENERIC_typeaheadSelectFunction(property, obj) {
				if (!(angular.isUndefinedOrNull(vm.contentSubController.objectModel[property]))) {
					if (obj.id === (vm.contentSubController.objectModel[property].id || null)) return 0;

					if (property === "FactionA") {
						if (!(angular.isUndefinedOrNull(vm.contentSubController.objectModel.FactionB))) {
							if (obj.id === (vm.contentSubController.objectModel.FactionB.id || null)) return 0;
						}
					}

					if (property === "FactionB") {
						if (!(angular.isUndefinedOrNull(vm.contentSubController.objectModel.FactionA))) {
							if (obj.id === (vm.contentSubController.objectModel.FactionA.id || null)) return 0;
						}
					}
				}

				vm.contentSubController.objectModel[property] = null;
				services.$timeout(1).then(function() {
					vm.contentSubController.objectModel[property] = obj;
					vm.contentSubController.objectModel[property + "Id"] = obj.id;
				});
			}

			function UPGRADE_requiredObject(upgrade) {
				return { hashField: upgrade.hashField, nameField: upgrade.nameField, iconName: upgrade.iconName, maxTier: upgrade.maxTier, Rank: 1 };
			}

			function UPGRADE_typeaheadFunction(val) {
				var upgradeFilter = {},
					currentHash = vm.contentSubController.currentObjectHash,
					typeFilters = vm.contentSubController.objectData.typeField;

				upgradeFilter.qName = val;
				if (currentHash) upgradeFilter.qExcludeHash = currentHash;
				if (typeFilters) upgradeFilter.qFilterTypes = typeFilters;

				return services.upgradesServices.getUpgradesSimple(upgradeFilter).then(function(response) {
					if (response.data.success) return response.data.data.map(function(upgrade) {
						upgrade.typeField = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesOwner[upgrade.typeField].text;
						upgrade.kindField = vm.contentSubController[vm.contentSubController.objectCtrl].upgradesData.upgradesTypes[upgrade.kindField].text;
						return upgrade;
					});
				});
			}

			function ITEM_handleClass(paramProperty) {
				var ItemObject = vm.contentSubController.contentList.item;

				for (var field in ItemObject.fields) {
					var currentField = ItemObject.fields[field],
					dIndex, tField;

					if (currentField.property === "classField") {
						currentField.options = [];

						tField = vm.contentSubController.itemsCtrl.itemsTypeClass.classField;

						for (dIndex in tField) {
							var currentTypeField = (((paramProperty === "typeField") || (paramProperty === "classField")) ? vm.contentSubController.objectModel.typeFieldInput : vm.contentSubController.queryValues.qType);
							if ((dIndex[0] === currentTypeField)) currentField.options.push({data: dIndex, text: tField[dIndex].name});
						}
					}

					if (currentField.property === "typeField") {
						currentField.options = [];

						tField = vm.contentSubController.itemsCtrl.itemsTypeClass.typeField;
						for (dIndex in tField) { currentField.options.push({data: dIndex, text: tField[dIndex].name}); }
					}
				}

				switch (paramProperty) {
					case "typeField": { vm.contentSubController.objectModel.classFieldInput = vm.contentSubController.objectModel.typeFieldInput + "1"; } break;
					case "qType": { vm.contentSubController.queryValues.qClass = null; } break;
				}
			}

			function ITEM_renderDetails(n) {
				var singleMode = (vm.contentSubController.contentState === 'single'),
				propObject = (singleMode ? vm.contentSubController.objectModel : vm.contentSubController.queryValues),
				typeProp = (singleMode ? "typeFieldInput" : "qType"),
				detailIndex = (parseInt(n.split(" ")[1]) - 1),
				rProp = null;

				if (vm.contentSubController.itemsCtrl.itemsTypeClass.typeField[propObject[typeProp]]) {
					rProp = vm.contentSubController.itemsCtrl.itemsTypeClass.typeField[propObject[typeProp]].details[detailIndex];
				}
				return (rProp || n);
			}

			function getSingleAndPicture(getSingle, hash) {
				return services.$q(function(resolve) {
					getSingle(hash).then(function(data) {
						services.apiServices.loadXHR("/images/modules/" + vm.contentSubController.contentList[vm.contentSubController.pageState].url + "/main_" + hash + ".jpg").then(function(blob) {
				  			vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = blob;
				  			resolve(data);
						});
					});
				});
			}

			function changeObjectState(state) {
				vm.contentSubController.contentState = "null";

				services.$timeout(350).then(function() {
					if (state !== "all") { vm.refreshContent(); }
					else { vm.contentSubController.contentState = state; vm.refreshContent(); }
				});
			}

			function getDisplayedFields() {
				var displayedFields = {};
				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
					if (currentField.display) displayedFields[currentField.property] = currentField;
				}
				return displayedFields;
			}

			function initializeQueryValues(data) {
				var perPageLimit = vm.contentSubController.contentList[vm.contentSubController.pageState].queryInfo.perPage;

				vm.contentSubController.queryValues = {	page: 1, order: "DESC", sort: "createdAt", limit: perPageLimit };
				vm.contentSubController.queryForm.sort = { "createdAt": { name: "Creation date", value: "createdAt" }};
				vm.contentSubController.queryParams = {	totalItems: 0, perPage: perPageLimit };
				vm.contentSubController.queryParams.totalItems = data.data.count;

				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];

					if (currentField.order) vm.contentSubController.queryForm.sort[currentField.order] = {
						name: currentField.name, value: currentField.order, filter: currentField.filterName
					};

					if (currentField.queryable) {
						vm.contentSubController.queryValues[currentField.query] = (currentField.defaultQuery || null);

						if (currentField.queryType === "dropdownCheckbox") vm.contentSubController.queryValues[currentField.query] = [];
						if (currentField.queryType === "slider") vm.contentSubController.queryValues[currentField.query] = currentField.queryDetails.start;
						if (currentField.queryType === "range") {
							vm.contentSubController.queryValues[currentField.query] = {
								min: currentField.queryDetails.min,
								max: currentField.queryDetails.max
							};
						}
						var onChangeFunc = currentField.onQueryChange;
						if (onChangeFunc) onChangeFunc(currentField.query);
					}
				}
			}

			function getQueryableFields() {
				var displayedFields = {};
				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
					if (currentField.queryable) displayedFields[currentField.property] = currentField;
				}
				return displayedFields;
			}

			function getEditableFields() {
				var editableFields = {};
				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
					if (currentField.editable) editableFields[currentField.property] = currentField;
				}
				return editableFields;
			}

			function assignModel() {
				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
					if (currentField.editable) {

						switch (currentField.queryType) {

							case "checkbox": {
								vm.contentSubController.objectModel[currentField.property + "Input"] = (vm.contentSubController.objectData[currentField.property] === true);
							} break;

							case "slider": {
								vm.contentSubController.objectModel[currentField.property + "Input"] = currentField.initDetails.start;
							} break;

							default: {
								vm.contentSubController.objectModel[currentField.property + "Input"] = (vm.contentSubController.objectData[currentField.property] || currentField.default);
							}
						}

						if (currentField.onInit) currentField.onInit(currentField.property);
					}
				}

				for (var specField in vm.contentSubController.contentList[vm.contentSubController.pageState].special_fields) {
					var currentSpecialField = vm.contentSubController.contentList[vm.contentSubController.pageState].special_fields[specField];
					if (currentSpecialField.autoassign) vm.contentSubController.objectModel[currentSpecialField.property] = (vm.contentSubController.objectData[currentSpecialField.property]);
					if (currentSpecialField.onModelAssign) currentSpecialField.onModelAssign(vm.contentSubController.objectModel, vm.contentSubController.objectData);
				}

				vm.contentSubController.currentObjectHash = vm.contentSubController.objectData[vm.contentSubController.contentList[vm.contentSubController.pageState].id_key];
			}

			function changeDropdownValue(model, value) {
				vm.contentSubController.objectModel[model + "Input"] = value;

				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];

					if (currentField.property === model) {
						var onChangeFunc = currentField.onChange;
						if (onChangeFunc) onChangeFunc(currentField.property);
					}
				}
			}

			function changeQueryDropdownValue(model, query, value) {
				vm.contentSubController.queryValues[query] = value;

				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];

					if (currentField.property === model) {
						var onChangeFunc = currentField.onQueryChange;
						if (onChangeFunc) onChangeFunc(currentField.query);
					}
				}
				if (model === "sort") vm.contentSubController.queryValues.sort = value.value;
			}

			function changeSortByField(field) {
				var order = vm.contentSubController.queryValues.order;
				if (vm.contentSubController.queryValues.sort === field) {
					vm.contentSubController.queryValues.order = ((order === "ASC") ? "DESC" : "ASC");
				}
				vm.contentSubController.queryValues.sort = field;
				vm.refreshContent();
			}

			function editContent() {
				var i, savedModel = {},
					specialFields = [],
					proccessFunc = ((vm.contentSubController.currentObjectHash.length > 0) ? "update" : "post"),
					func = vm.contentSubController.contentList[vm.contentSubController.pageState].crud[proccessFunc];

				for (i in vm.contentSubController.contentList[vm.contentSubController.pageState].special_fields) {
					specialFields.push(vm.contentSubController.contentList[vm.contentSubController.pageState].special_fields[i].property);
				}

				for (var model in vm.contentSubController.objectModel) {
					if (!(services.apiServices.inArray(model, specialFields))) {
						var splicedModel = model.slice(0, (model.length - 5));
						savedModel[splicedModel] = vm.contentSubController.objectModel[model];
					} else { savedModel[model] = vm.contentSubController.objectModel[model]; }
				}

				validateContentForms(function(success) {
					if (success) {
						services.$q(function(resolve) {
							func(vm.contentSubController.currentObjectHash, savedModel).then(function(data) {
								var avatarSelected = !(angular.isUndefinedOrNull(vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar.type)),
									dataSuccess = data.data.success;

								if (!dataSuccess) return resolve(false);

								if ((proccessFunc === "post") && (avatarSelected)) {
									vm.contentSubController.currentObjectHash = data.data.data[vm.contentSubController.contentList[vm.contentSubController.pageState].id_key];
									uploadModulePicture(true).then(function() {	return resolve(true); });
								} else { return resolve(true); }
							});
						}).then(function(success) {
							if (success) {
								var currentObject = vm.contentSubController.contentList[vm.contentSubController.pageState];
								services.alertsServices.addNewAlert("success", currentObject.name + " saved successfully.");
								changeObjectState("all");
								vm.updateURL("editHash", null);
							}
						});
					}
				});
			}

			function validateContentForms(_cb) {
				var validateFields = 0, goodFields = 0;
				for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
					var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
					if (currentField.validation) {
						validateFields++;
						var goodCheck = services.apiServices.validateParams(vm.contentSubController.objectModel[currentField.property + "Input"], currentField.validation, currentField.name);
						if (goodCheck) goodFields++;
					}
				}
				return _cb(goodFields === validateFields);
			}

			function uploadModulePicture(suppress) {
				var currentObject = vm.contentSubController.contentList[vm.contentSubController.pageState],
					objectId = currentObject.id,
					currentUploadedAvatar = vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar,
					hideCrop = vm.contentSubController.contentList[vm.contentSubController.pageState].hide_crop,
					croppedDataUrl = vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl,
					resolveFunction = function(data) {
						var dMessage = ["success", "Object picture uploaded."];
						if (!data.data.success) dMessage = ["warning", data.data.message];
						if (!suppress) services.alertsServices.addNewAlert(dMessage[0], dMessage[1]);
					};

				if (hideCrop) { return services.adminServices.uploadModulePicture(objectId, vm.contentSubController.currentObjectHash, currentUploadedAvatar).then(resolveFunction); }
				else { return services.adminServices.uploadModulePicture(objectId, vm.contentSubController.currentObjectHash, croppedDataUrl, currentUploadedAvatar).then(resolveFunction); }
			}

			function createNew() {
				vm.contentSubController.contentState = "null";
				vm.contentSubController.currentObjectHash = "";

				services.$timeout(350).then(function() {
					vm.contentSubController[vm.contentSubController.objectCtrl].currentUploadedAvatar = {};
					vm.contentSubController[vm.contentSubController.objectCtrl].croppedDataUrl = "";

					for (var field in vm.contentSubController.contentList[vm.contentSubController.pageState].fields) {
						var currentField = vm.contentSubController.contentList[vm.contentSubController.pageState].fields[field];
						if (currentField.editable) {
							vm.contentSubController.objectModel[currentField.property + "Input"] = (angular.isUndefinedOrNull(currentField.default) ? "" : currentField.default);
							if (currentField.onInit) currentField.onInit(currentField.property);
						}
					}

					var initFunction = vm.contentSubController.contentList[vm.contentSubController.pageState].create ? vm.contentSubController.contentList[vm.contentSubController.pageState].create : services.apiServices.nullCbFunction;
					initFunction(function() { vm.contentSubController.contentState = "single"; });
				});
			}

			function getSingle(hash) {
				vm.contentSubController.contentState = "null";
				var getSingleFunc = vm.contentSubController.contentList[vm.contentSubController.pageState].crud.getSingle;

				services.$timeout(350).then(function() {

					vm.contentSubController.objectModel = {};

					getSingleAndPicture(getSingleFunc, hash).then(function(data) {
						var curMode = vm.contentSubController.pageState;

						vm.updateURL("editHash", hash);

						if ((curMode === "store") ? data.data.success : data) {
							vm.contentSubController.objectData = ((curMode === "store") ? data.data.data : data);
							vm.contentSubController.contentState = "single";
							assignModel();
						}
					});
				});
			}

			function askDuplicateContent(args) {
				var	modalOptions = {
						header: { text: 'Confirm content copy?', icon: 'ion-ios-copy' },
						body: {	text: 'Duplicate ' + vm.contentSubController.contentList[vm.contentSubController.pageState].name + ' "' + args.nameField + '"?' },
						choices: {
							yes: { text: 'Confirm', icon: 'ion-ios-copy' },
							no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
						}
				}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

				newModal.result.then(function(choice) {
					if (choice) {
						var duplicateFunction = vm.contentSubController.contentList[vm.contentSubController.pageState].crud.duplicate,
							objectHash = args[vm.contentSubController.contentList[vm.contentSubController.pageState].id_key];

						duplicateFunction(objectHash).then(function(data) {
							if (data.data.success) {
								services.alertsServices.addNewAlert("success", data.data.message);
								vm.refreshContent();
							}
						});
					}
				});
			}

			function askDeleteContent(args) {
				var	modalOptions = {
						header: { text: 'Confirm content deletion?', icon: 'ion-trash-a' },
						body: {	text: 'Delete ' + vm.contentSubController.contentList[vm.contentSubController.pageState].name + ' "' + args.nameField + '"? This cannot be undone.' },
						choices: {
							yes: { text: 'Delete', icon: 'ion-trash-a', class: 'warning' },
							no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
						}
				}, newModal = services.uiServices.createModal('GenericYesNo', modalOptions);

				newModal.result.then(function(choice) {
					if (choice) {
						var deleteFunction = vm.contentSubController.contentList[vm.contentSubController.pageState].crud.delete,
							objectHash = args[vm.contentSubController.contentList[vm.contentSubController.pageState].id_key];

						deleteFunction(objectHash).then(function(data) {
							if (data.data.success) {
								services.alertsServices.addNewAlert("warning", data.data.message);
								vm.refreshContent();
							}
						});
					}
				});
			}

			return _cb(true);
		}

		return contentSubController;
	};
})();