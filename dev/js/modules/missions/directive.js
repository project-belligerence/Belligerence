(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "generalServices", "missionsServices", "uiServices"];

	function ObjectDirectiveFunctions($scope, $timeout, apiServices, generalServices, missionsServices, uiServices) {
		var vm = this;
		vm.displayObjects = false;

		initializeDirective(function() {
			vm.displayObjects = true;
		});

		function initializeDirective(cb) {
			initalizeFunctions();

			initializeVariables(function() {
				vm.doMasonry();
				return cb(true);
			});
		}

		function initializeVariables(callback) {
			vm.objectList = ($scope.objectList || []);

			missionsServices.getAllOperationsSelf().then(function(operations) {
				vm.missionOperations = (operations ? operations : { negotiations: [], interests: [], contracts: [] });
				return callback(true);
			});
		}

		function initalizeFunctions() {
			vm.displayDirective = displayDirective;
			vm.doMasonry = doMasonry;
			vm.limitObjectiveDesc = limitObjectiveDesc;
			vm.initObject = initObject;
			vm.styleUIPositions = styleUIPositions;
			vm.applyUIStyle = applyUIStyle;

			vm.getRatingIcon = missionsServices.getRatingIcon;

			vm.setBGPicture = apiServices.setBGPicture;
			vm.applyControlledClass = apiServices.applyControlledClass;

			function initObject(obj) {
				obj.timeLeft = missionsServices.getMissionTimeElapsed(obj);
				obj.matchedOperation = matchOperationsMission(obj);
				obj.isFull = (missionsServices.getUnitLimit(obj) && !(obj.matchedOperation.enabled));
				obj.uiStyle = styleUIPositions();
			}

			function matchOperationsMission(obj) {
				var i,
					matchedObjects = {
						contracts: { enabled: true, class: "contract", icon: "ion-document-text", text: "Contracted" },
						negotiations: { enabled: true, class: "negotiation", icon: "ion-arrow-swap", text: "Negotiating" },
						interests: { enabled: true, class: "interest", icon: "ion-star", text: "Interested" },
						default: { enabled: false }
					};

				for (i = vm.missionOperations.negotiations.length - 1; i >= 0; i--) {
					if (vm.missionOperations.negotiations[i].MissionId === obj.id) return matchedObjects.negotiations;
				}

				for (i = vm.missionOperations.interests.length - 1; i >= 0; i--) {
					if (vm.missionOperations.interests[i].MissionId === obj.id) return matchedObjects.interests;
				}

				for (i = vm.missionOperations.contracts.length - 1; i >= 0; i--) {
					if (vm.missionOperations.contracts[i].MissionId === obj.id) return matchedObjects.contracts;
				}

				return matchedObjects.default;
			}

			function applyUIStyle(obj, style) { return obj.uiStyle[style].setter(obj.uiStyle[style].value); }

			function styleUIPositions(el, mode, val) {
				var setRotation = function(val) {
					return apiServices.prefixCssProperty("transform", "rotate(" + val + "deg)");
				};

				return {
					photo: {
						value: _.random(25, 30), setter: function(v) { return { "top": v + "%" }; }
					},
					paper: { value: _.random(0, 1, true), setter: setRotation },
					smudge1: { value: _.random(-10, 10, true), setter: setRotation },
					smudge2: { value: _.random(-10, 10, true), setter: setRotation },
					obj: { value: _.random(-3, 3, true), setter: setRotation },
				};
			}

			function limitObjectiveDesc(input) { return apiServices.limitString(input, 45, "[..]"); }

			function displayDirective() { return (vm.displayObjects); }

			function doMasonry() {
				$timeout(function() {
					uiServices.uiMasonry(".missions-directive", {
						itemSelector: ".missions-col", columnWidth: ".missions-col", percentPosition: false
					});
				}, 3500);
			}
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {
				objectList: "=",
			},
			restrict : "E",
			templateUrl: "directive/" + "missions" + ".ejs",
			controller: ObjectDirectiveFunctions,
			controllerAs: "CtrlDirective" + "Missions"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();