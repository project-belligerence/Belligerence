(function(){
	'use strict';

	module.exports = function(vm, services) {

		function reportsSubController(_cb) {

			vm.contentSubController = {};
			vm.contentSubController.pageState = "main";

			vm.contentSubController.refreshContent = vm.refreshContent;

			vm.contentSubController.lodashCapitalize = _.capitalize;
			vm.contentSubController.changeContentState = changeContentState;
			vm.contentSubController.getReportContentInfo = getReportContentInfo;
			vm.contentSubController.getReportTypeInfo = getReportTypeInfo;

			vm.contentSubController.deleteReport = deleteReport;
			vm.contentSubController.enforceReport = enforceReport;

			vm.contentSubController.getReportData = services.adminServices.getReportData;

			vm.contentSubController.askDeleteBan = services.adminServices.askDeleteBan;
			vm.contentSubController.askBanPlayer = services.adminServices.askBanPlayer;
			vm.contentSubController.liftBan = liftBan;

			vm.contentSubController.subViews = {

				"main": {
					id: "main",
					icon: "ion-plus",
					name_plural: "Reports & Bans",
					description: "Main menu",
					controller: function(_cb) { return _cb(true); }
				},
				"reports": {
					id: "reports",
					icon: "ion-alert-circled",
					name_plural: "Reports",
					description: "View/Resolve all content or personnel reported by the playerbase.",
					controller: function(_cb) { return _cb(true); },
					getAll: services.adminServices.getReports
				},
				"bans": {
					id: "bans",
					icon: "ion-flash-off",
					name_plural: "Bans",
					description: "View/Resolve all issued bans, active or not.",
					controller: function(_cb) { return _cb(true); },
					getAll: services.adminServices.getBans
				}
			};

			function enforceReport(report, enforceFnc) {
				enforceFnc(report.reportedHash).then(function(done) {
					if (done && services.apiServices.handleRequestData(done)) {
						services.adminServices.deleteReport(report.hashField).then(function(done2){
							if (done && services.apiServices.handleRequestData(done2)) {
								services.alertsServices.addNewAlert("warning", "The reported content has been dealt with.");
								return vm.contentSubController.refreshContent(vm.contentSubController.pageState, false);
							}
						});
					}
				});
			}

			function deleteReport(report) {
				services.adminServices.askDeleteReport(report).then(function(done) {
					if (done && services.apiServices.handleRequestData(done)) {
						services.alertsServices.addNewAlert("warning", "The report has been ignored.");
						return vm.contentSubController.refreshContent(vm.contentSubController.pageState, false);
					}
				});
			}

			function liftBan(report) {
				services.adminServices.askDeleteBan(report).then(function(done) {
					if (done && services.apiServices.handleRequestData(done)) {
						services.alertsServices.addNewAlert("warning", "The ban has been lifted.");
						return vm.contentSubController.refreshContent(vm.contentSubController.pageState, false);
					}
				});
			}

			function getReportTypeInfo(report) {
				var rV = (function(report){
					switch(report.typeField) {
						case "harassment": { return {text: "Harassment"}; } break;
						case "rules": { return {text: "Rule Violation"}; } break;
						case "illegal": { return {text: "Illegal Content"}; } break;
						case "bug": { return {text: "Bug Exploit"}; } break;
					}
				})(report);
				return rV;
			}

			function getReportContentInfo(report) {
				var rV = (function(report){
					switch(report.contentField) {
						case "player": {
							return {
								text: "Operator",
								image: "images/avatars/players/thumb_" + report.reportedHash + ".jpg",
								url: "operator/" + report.reportedHash,
								sendObject: true,
								removeMethod: services.adminServices.askBanPlayer
							};
						} break;
						case "pmc": {
							return {
								text: "Outfit",
								image: "images/avatars/pmc/thumb_" + report.reportedHash + ".jpg",
								url: "outfit/" + report.reportedHash,
								removeMethod: function(hash) {
									return services.$q(function(resolve) {
										services.$state.go('app.public.pmc', { pmcHash: hash });
										resolve(false);
									});
								}
							};
						} break;
						case "intel": {
							return {
								text: "Intel",
								image: "images/modules/intel/thumb_" + report.reportedHash + ".jpg",
								url: "intel/view/" + report.reportedHash,
								removeMethod: services.intelServices.askDeleteIntel
							};
						} break;
						case "item": {
							return {
								text: "Item",
								image: "images/modules/items/thumb_" + report.reportedHash + ".jpg",
								url: "item/" + report.reportedHash,
								removeMethod: function(hash) {
									return services.$q(function(resolve) {

										var itemEditState = {
											menu: "content",
											section: "item",
											editHash: hash
										};

										services.$state.go(services.$state.$current.self.name, itemEditState);
										resolve(false);
									});
								}
							};
						} break;
						case "store": {
							return {
								text: "Store",
								image: "images/modules/stores/thumb_" + report.reportedHash + ".jpg",
								url: "market/store/" + report.reportedHash,
								removeMethod: function(hash) {
									return services.$q(function(resolve) {
										services.$location.search("editStore", hash);
										resolve(false);
									});
								}
							};
						} break;
						case "upgrade": {
							return {text: "Upgrade", image: "images/modules/upgrades/thumb_" + report.reportedHash + ".jpg", url: "upgrades/" + report.reportedHash};
						} break;
						case "comment": {
							return {text: "Comment", image: "images/avatar_placeholder.png", url: "/"};
						} break;

						case "map": { return new reportDisplayObject(report, ["Map", "modules", "maps", "jpg", "app.public.map-single", "objectHash"]);	} break;
						case "faction": { return new reportDisplayObject(report, ["Faction", "modules", "factions", "jpg", "app.public.faction-single", "objectHash"]);	} break;
						case "conflict": { return new reportDisplayObject(report, ["Conflict", "modules", "conflicts", "jpg", "app.public.conflcit-single", "objectHash"]);	} break;

						default: {
							return {text: "Unknown", image: "images/avatar_placeholder.png", url: "/"};
						} break;
					}
				})(report);

				return rV;
			}

			function reportDisplayObject(report, options) {
				return {
					text: options[0],
					image: ("images/" + options[1] + "/" + options[2] + "/thumb_" + report.reportedHash + "." + options[3]),
					url: (options[0].toLowerCase() + "/" + report.reportedHash),
					removeMethod: function(hash) {
						return services.$q(function(resolve) {
							var rParams = {};
							rParams[options[5]] = hash;
							services.$state.go(options[4], rParams);
							resolve(false);
						});
					}
				};
			}

			function changeContentState(state) {
				vm.contentSubController.pageState = "null";
				vm.contentSubController.contentData = [];
				vm.contentSubController.queryForm = {};
				vm.contentSubController.showPagination = false;

				services.$timeout(350).then(function() {
					if (state !== "main") {
						services.apiServices.resolveFunction(vm.contentSubController.subViews[state].controller).then(function() {
							vm.updateURL("section", state);
							vm.contentSubController.refreshContent(state, true);
						});
					} else {
						services.$timeout(250).then(function() {
							vm.contentSubController.pageState = state; vm.updateURL("section", "");
						});
					}
				});
			}

			changeContentState((services.$state.params.section || "main"));
			return _cb(true);
		}

		return reportsSubController;
	};
})();