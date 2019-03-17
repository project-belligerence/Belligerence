(function() {
	'use strict';

	APIServicesFunction.$inject = ["$rootScope", "$state", "$http", "$injector", "$q", "$timeout", "$cookies", "alertsServices"];

	function APIServicesFunction($rootScope, $state, $http, $injector, $q, $timeout, $cookies, alertsServices) {

		var methods = {
				getModule: getModule,
				returnUnloggedUser: returnUnloggedUser,
				getToken: getToken,
				cloneValue: cloneValue,
				inArray: inArray,
				sumArray: sumArray,
				suggestedTags: suggestedTags,
				suggestedOutfitTags: suggestedOutfitTags,
				getOutfitPermissions: getOutfitPermissions,
				boolString: boolString,
				boolInteger: boolInteger,
				loadSubModule: loadSubModule,
				getWeekDaysDropdown: getWeekDaysDropdown,
				generateQueryFromState: generateQueryFromState,
				displayContract: displayContract,
				dateTimeDifference: dateTimeDifference,
				displayPrivilege: displayPrivilege,
				limitString: limitString,
				setBGPicture: setBGPicture,
				getSideName: getSideName,
				prefixCssProperty: prefixCssProperty,
				validatePrivilege: validatePrivilege,
				isValidAlignment: isValidAlignment,
				getMainEntity: getMainEntity,
				getInviteType: getInviteType,
				getInviteIcon: getInviteIcon,
				returnDateDifferenceDays: returnDateDifferenceDays,
				handleRequestSuccess: handleRequestSuccess,
				handleRequestError: handleRequestError,
				handleRequestData: handleRequestData,
				statusError: statusError,
				responseOK: responseOK,
				requestGET: requestGET,
				requestPOST: requestPOST,
				requestPUT: requestPUT,
				requestDELETE: requestDELETE,
				getInfo: getInfo,
				simpleGET: simpleGET,
				getQuery: getQuery,
				getQuerySimple: getQuerySimple,
				applyControlledClass: applyControlledClass,
				vv: vv,
				numberToArray: numberToArray,
				minMax: minMax,
				readObjectToArray: readObjectToArray,
				resolveFunction: resolveFunction,
				nullCbFunction: nullCbFunction,
				emptyPromise: emptyPromise,
				validateParams: validateParams,
				isValidBrowser: isValidBrowser,
				isLaptop: isLaptop,
				isTablet: isTablet,
				isPortrait: isPortrait,
				isLandscape: isTablet,
				switchFromArray: switchFromArray,
				changeURL: changeURL,
				findIndexInObject: findIndexInObject,
				findObjectsInArray: findObjectsInArray,
				checkCharactersRemaining: checkCharactersRemaining,
				loadXHR: loadXHR
			},
			tokens = {
				admin: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkNvb2wgQWRtaW4iLCJwcml2aWxlZ2UiOjAsImhhc2giOiJkMTYyMmUyNjMzNjE4OWY1MjI5ZSIsInBtY0hhc2giOm51bGwsImlhdCI6MTQ1ODgwNDgyNSwiZXhwIjo5OTc0NjQ4MDA4MjZ9.5lFbAOXpqu2EJ_kopLtunGVnK-FrBmX0zfFYkiC32pE',
				pmc: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZGI4OWEyNzU2Y2IxYTdhNjMxMDYiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNjMsImV4cCI6OTk3NDYxNjA5MjY0fQ.VhR1eAS2Z2UKdFVA7PWYs2h2VrnHNRfD6wfdDQPGr_0",
				moonman: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZDRiMzY2Y2E3NWJkZjU0YjEyNGQiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNzMsImV4cCI6OTk3NDYxNjA5Mjc0fQ.eNh9GKWuzL4HiPVbcmiEwL-chzdYD1q5gdI0uw6KT-U",
				hobo: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkhvYm8gTWFuIiwicHJpdmlsZWdlIjoxMCwiaGFzaCI6ImI5MTVjOGU4NGFlMDZhMzAxZTY3IiwicG1jSGFzaCI6bnVsbCwiaWF0IjoxNDY3Nzg0MzMwLCJleHAiOjk5NzQ3Mzc4MDMzMX0.VlyFXS10naplGF8-CEABlINGC-2T0rdNCchKKC31C50"
			},
			//activeToken = tokens.hobo,
			//activeToken = tokens.admin,

			activeToken = [tokens.pmc, tokens.admin, tokens.hobo, tokens.moonman][2],

			MULTIP_LAG = 1,

			MIN_LAG = 250,
			MAX_LAG = 500,

			//CURRENT_LAG = (Math.floor(Math.random() * ((MAX_LAG * MULTIP_LAG) - (MIN_LAG * MULTIP_LAG) + 1)) + (MIN_LAG * MULTIP_LAG))
			CURRENT_LAG = 0
		;

		function getToken() {
			//return ($cookies.get('loggedInToken') || activeToken);
			return ($cookies.get('loggedInToken') || null);
			//return activeToken;
			//return null;
		}

		function getMainEntity(selfInfo) {
			var hasPMC = (selfInfo.PMC || false),
				entityType = (hasPMC ? "pmc" : "player"),
				entityTypeName = (hasPMC ? "PMC" : "Player"),
				entityHash = (hasPMC ? selfInfo.PMC.hashField : selfInfo.hashField),
				entitySide = (hasPMC ? selfInfo.PMC.sideField : selfInfo.sideField),
				entityId = (hasPMC ? selfInfo.PMC.id : selfInfo.id);

			return {
				hasPMC: hasPMC,
				type: entityType,
				typeName: entityTypeName,
				side: entitySide,
				hash: entityHash,
				id: entityId
			};
		}

		function loadSubModule(qPath) {
			var subCtrl = require(("../" + qPath.module + "/" + qPath.folder + "/" + qPath.file + ".js")),
				subCtrlObj = [];
			for (var i = 0; i < subCtrl.services.length; i++) { subCtrlObj.push(subCtrl.services[i]); }
			subCtrlObj.push(subCtrl.ctrl);
			return $injector.invoke(subCtrlObj);
		}

		function isValidAlignment(side, target) { return ((side === target) || (side === 0)); }

		function getWeekDaysDropdown() {
			var rV = [
				{text: "Sunday", data: 0},
				{text: "Monday", data: 1},
				{text: "Thursday", data: 2},
				{text: "Wednesday", data: 3},
				{text: "Tuesday", data: 4},
				{text: "Friday", data: 5},
				{text: "Saturday", data: 6}
			];
			return rV;
		}

		if (typeof(Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function() {
				return this * Math.PI / 180;
			};
		}

		angular.isUndefinedOrNull = function(val) { return (angular.isUndefined(val) || val === null); };

		// https://stackoverflow.com/a/38080051
		navigator.browserSpecs = (function(){
		    var ua = navigator.userAgent, tem,
		        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		    if(/trident/i.test(M[1])){
		        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		        return {name:'IE',version:(tem[1] || '')};
		    }
		    if(M[1]=== 'Chrome'){
		        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
		        if(tem != null) return {name:tem[1].replace('OPR', 'Opera'),version:tem[2]};
		    }
		    M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		    if((tem = ua.match(/version\/(\d+)/i))!= null)
		        M.splice(1, 1, tem[1]);
		    return {name:M[0], version:M[1]};
		})();

		function isValidBrowser() {
			var browser = navigator.browserSpecs;
			switch(browser.name) {
				case "MSIE": {
					return false;
				} break;
				default: { return true; }
			}
		}

		function vv(v) { return !(angular.isUndefinedOrNull(v)); }

		function isLaptop() {
			var windowWidth = $(window).width();
			return ((windowWidth <= 1199) && (windowWidth > 768));
		}

		function isTablet() {
			var windowWidth = $(window).width();
			return ((windowWidth <= 979) && (windowWidth >= 768));
		}

		function isPortrait() {
			var windowWidth = $(window).width();
			return ((windowWidth <= 767));
		}

		Object.objectSize = function(obj) {
			var size = 0, key;
			for (key in obj) { if (obj.hasOwnProperty(key)) size++;	}
			return size;
		};

		function minMax(min, max, value) { return Math.min(Math.max(parseInt(value), min), max); }

		function numberToArray(num) { return new Array(num); }

		function limitString(string, pLength, end) {
			var rString = (string || "");
			if (rString.length >= pLength) {
				rString = rString.slice(0, (pLength - rString.length)) + (end || "");
			}
			return rString;
		}

		function multiplyArray(array) {
			var sum = 1;
			for (var i = array.length - 1; i >= 0; i--) { sum *= array[i]; }
			return sum;
		}

		function sumArray(array) {
			var sum = 0;
			for (var i = array.length - 1; i >= 0; i--) { sum += array[i]; }
			return sum;
		}

		function dateTimeDifference(date, time) {
			// https://stackoverflow.com/a/2627493
			var timeFrame = (function(t) {
					switch(t) {
						case "day": { return [24, 60, 60, 1000]; } break;
						case "hour": { return [60, 60, 1000]; } break;
						default: { return [24, 60, 60, 1000]; }
					}
				})(time),
				oneDay = multiplyArray(timeFrame),
				currentDate = new Date(),
				givenDate = new Date(date);
			return (Math.round(Math.abs((givenDate.getTime() - currentDate.getTime())/(oneDay))));
		}

		function setBGPicture(prop, res, folder, format) {
			return {
				"background-image": "url('images/modules/" + folder + "/" + res + "_" + prop + "." + format + "')"
			};
		}

		function cloneValue(source) { return ($.extend(true, {}, source)); }

		function boolString(value) { return (value === "true"); }
		function boolInteger(value) { return (value ? 1 : 0); }

		function getModule(module) { return ("./modules/" + module + "/init"); }

		function statusError(data) {
			if (angular.isUndefinedOrNull(data)) return false;
			data = (data.hasOwnProperty("status")) ? data.data : data;
			if (data !== undefined) {
				return (!(data.success) || (data.status === -1));
			} else { return false; }
		}
		function responseOK(data) { return !(statusError(data)); }

		// https://stackoverflow.com/questions/42471755/convert-image-into-blob-using-javascript
		function loadXHR(url) {
			return $q(function(resolve, reject) {
				try {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", url);
					xhr.responseType = "blob";
					xhr.onerror = function() {reject("Network error.");};
					xhr.onload = function() {
						if (xhr.status === 200) {resolve(xhr.response);}
						else {reject("Loading error:" + xhr.statusText);}
					};
					xhr.send();
				}
				catch(err) { reject(err.message); }
			});
		}

		function returnUnloggedUser() {
			return {
				aliasField: "Anonymous User",
				hashField: "123abc",
				playerPrivilege: 9991,
				playerPrestige: 0
			};
		}

		function generateQueryFromState(state, prefix, ignorePrefix, noPrefix) {
			var finalObject = {},
				finalQuery = "", i = 0, key;
			for (key in state) {
				if (state.hasOwnProperty(key)) {
					if (!(angular.isUndefinedOrNull(state[key]))) {
						if (!(inArray(key, ignorePrefix)) && !(noPrefix)) {
							var propName = key[0].toUpperCase() + key.slice(1, key.length);
							if (typeof state[key] === "string")  {
								finalObject[prefix + propName] = state[key].replace(" ", "+");
							} else { finalObject[prefix + propName] = state[key]; }
						} else { finalObject[key] = state[key]; }
					}
				}
			}
			for (key in finalObject) {
				var charToAdd = (i === 0) ? "?" : "&";
				finalQuery += charToAdd + key + "=" + finalObject[key];
				i++;
			}
			return finalQuery;
		}

		function createSystemAlert(response) {
			alertsServices.addNewAlert("danger", response.message);
			return response;
		}

		function resolveFunction(func) {
			var pFunc = func ? func : function(_cb) { return _cb(true); };

			return $q(function(resolve, reject) {
				return pFunc(function(v) {
					if (v) { resolve(v); } else { reject(v); }
				});
			});
		}

		function nullCbFunction(cb) { return cb(true); }
		function emptyPromise() { return $q(function(resolve){ return resolve(true); }); }

		function inArray(value, array) { return (array.indexOf(value) > -1); }

		function findIndexInObject(array, property, target) {
			var rIndex = -1;
			array.forEach(function(element, index) {
				if (element[property] === target) rIndex = index;
			});
			return rIndex;
		}

		function findObjectsInArray(array, property, target) {
			var rObject = [], i;
			for (i = array.length - 1; i >= 0; i--) {
				if (inArray(array[i][property], target)) rObject.push(array[i]);
			}
			return rObject;
		}

		function switchFromArray(value, array) {
			var rArray = array,	fIndex = rArray.indexOf(value);
			if (fIndex > -1) { _.pullAt(rArray, [fIndex]); } else { rArray.push(value); }
			return rArray.sort();
		}

		function readObjectToArray(array, indexes, property) {
			var rString = "";
			for (var i in indexes) {
				rString += array[indexes[i]][property];
				if (i < ((indexes.length) - 1)) rString += ", ";
			}
			return rString;
		}

		function checkCharactersRemaining(input, max) { return { current: (max - input), status: (input > max) }; }

		function suggestedTags(q) {
			var suggested = [
				"Loner",
				"Realism",
				"Relaxed",
				"Incompetent",
				"Leading",
				"Anxious"
			], i, final = [];

			for (i in suggested) {
				var search = suggested[i].match(new RegExp(q, 'gi'));
				if (search) final.push(suggested[i]);
			}

			return final;
		}

		function suggestedOutfitTags(q) {
			var suggested = [
				"Realism",
				"Relaxed",
				"MilSim",
				"Tactical",
				"Casual",
				"Teamwork"
			], i, final = [];

			for (i in suggested) {
				var search = suggested[i].match(new RegExp(q, 'gi'));
				if (search) final.push(suggested[i]);
			}

			return final;
		}

		function prefixCssProperty(prop, propValue) {
			var prefixes = ["webkit", "moz", "ms", "o"],
				rObject = {};

			for (var i = prefixes.length - 1; i >= 0; i--) { rObject["-" + prefixes[i] + "-" + prop] = propValue; }
			rObject[prop] = propValue;

			return rObject;
		}

		function applyControlledClass(owner) {
			return { "neutral": (owner === 0), "blufor": (owner === 1),	"opfor": (owner === 2),	"indfor": (owner === 3) };
		}

		function getSideName(side) {
			switch(side) {
				case (0): { return "NEUTRAL"; } break;
				case (1): { return "BLUFOR"; } break;
				case (2): { return "OPFOR"; } break;
				case (3): { return "INDFOR"; } break;
				default: { return "NEUTRAL"; } break;
			}
		}

		function privEnum() {
			var perms = {
				"owner": 0,
				"admin": 1,
				"moderator": 2,
				"janitor": 3,
				"user": 4
			};
			return Object.freeze(perms);
		}

		function validatePrivilege(player, tier) {
			if (typeof tier === "string") tier = privEnum()[tier];
			return (player.playerPrivilege <= tier);
		}

		function getOutfitPermissions(selfInfo) {
			return (((selfInfo.PMC !== null) && (selfInfo.PMC !== undefined)) && (selfInfo.playerTier < 2));
		}

		function getValidationString(o, v, p) {
			var validationStrings = {
				isLength: function(v, o) {
					return 'Length of value \"' + (p || v) + '\" must be between ' + o.params.min + ' and ' + o.params.max + ' characters.';
				},
				isEmail: function(v, o) {
					return '\"' + v + '\" is not a valid e-mail.';
				},
				valueUndefined: function(v) { return 'A required value provided is undefined.';	},
				isAlphanumeric: function(v) { return 'The value must contain numbers and letters.'; }
			};
			return validationStrings[o.func](v, o);
		}

		function validateParams(v, p, pp) {
			var success = true;
			for (var i in p) {
				var requirement = p[i];

				if (!(requirement.library[requirement.func](v, requirement.params))) {
					alertsServices.addNewAlert("warning", getValidationString(requirement, v, pp));
					success = false;
				}
			}
			return success;
		}

		function handleRequestSuccess(response, request) {
			if (!(response.data.success)) return (request.softErrorFunction || createSystemAlert)(response.data);
			return response;
		}

		function returnDateDifferenceDays(date) {
			var
				oneDay = (24*60*60*1000),
				firstDate = new Date(date),
				secondDate = new Date()
			;
			return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
		}

		function displayContract(v) {
			switch(v) {
				case 0: { return { name: "Commander", icon: "ion-star" }; } break;
				case 1: { return { name: "Soldier", icon: "ion-person" }; } break;
				case 2: { return { name: "Freelancer", icon: "ion-briefcase" }; } break;
				default: { return { name: "???", icon: "ion-ios-help-empty" }; }
			}
		}

		function displayPrivilege(v) {
			switch(v) {
				case 0: { return { name: "Owner", icon: "ion-eye" }; } break;
				case 1: { return { name: "Admin", icon: "ion-star" }; } break;
				case 2: { return { name: "Moderator", icon: "ion-flash" }; } break;
				case 3: { return { name: "Janitor", icon: "ion-pound" }; } break;
				case 4: { return { name: "Player", icon: "ion-man" }; } break;
				default: { return { name: "???", icon: "ion-ios-help-empty" }; }
			}
		}

		function getInviteType(invite) {
			return (function(invite) {
				switch(invite) {
					case "Request_PlayerPMC": { return "Membership application"; } break;
					case "Invite_PlayerPMC": { return "Membership invitation"; } break;
					case "Friends_Player": { return "Friend request"; } break;
					case "Friends_PMC": { return "Outfit alliance"; } break;
					default: { return "Unknown invite"; }
				}
			})(invite);
		}

		function getInviteIcon(invite) {
			return (function(invite) {
				switch(invite) {
					case "Request_PlayerPMC": { return "ion-android-people";} break;
					case "Invite_PlayerPMC": { return "ion-log-in";} break;
					case "Friends_Player": { return "ion-person-add";} break;
					case "Friends_PMC": { return "ion-android-contacts";} break;
					default: { return "ion-person-add"; }
				}
			})(invite);
		}

		function changeURL(url) { window.location.href = url; }

		function handleRequestData(request) {
			var rV = {success: false, data: []};
			if (request) {
				if (request.data) {
					if (request.data.success) {
						rV.success = true;
						rV.data = request.data.data;
						rV.count = (request.data.count || 0);
					}
				}
			}
			return rV;
		}

		function handleRequestError(response, request) {
			var errorList = {
				10: {
					redirect: "app.public.banned",
					fnc: function(response) {
						$rootScope.$emit("banscreen:displayBanReason", response.data.data);
					}
				},
				11: {
					type: "warning",
					message: function(d) { return "Malformed session - please login again."; },
					fnc: function() {
						$cookies.remove('loggedInToken');
						$rootScope.$broadcast("navbar:refreshDirective");
						$rootScope.$broadcast("logoutEvent");
					},
					redirect: "app.public.frontpage"
				},
				12: {
					type: "info",
					message: function(d) { return "Your session has expired - please login again.";	},
					fnc: function() {
						$cookies.remove('loggedInToken');
						$rootScope.$broadcast("navbar:refreshDirective");
						$rootScope.$broadcast("logoutEvent");
					},
					redirect: "app.public.frontpage"
				}
			};

			if ((response.status >= 300)) {
				var firstTimeError = !($rootScope.routeError),
					error = errorList[response.data.code];

				if (error && firstTimeError) {
					$rootScope.routeError = response.data.code;
					if (error.message) alertsServices.addNewAlert(error.type, error.message(response.data));
					if (error.fnc) error.fnc(response);
					if (error.redirect) { $timeout(1).then(function() { $state.go(error.redirect); });	}

					console.error("INVALID REQUEST |", response.status + "(" + response.statusText + ")", "|", response.data.message);
				}
			} else { $rootScope.routeError = null; }

			return response;
		}

		function getInfo(r, cache) {
			var	request = {	url: r, cache: ((cache === undefined) ? false : cache) };
			return requestGET(request).then(function(data) {
				if (statusError(data)) return false;
				return data.data.data;
			});
		}

		function getQuery(r, q, cache) {
			var	request = {	url: r, params: (q || {}), cache: ((cache === undefined) ? false : cache) };
			return requestGET(request).then(function(data) {
				if (statusError(data)) return false;
				return { count: data.data.count, data: data.data.data };
			});
		}

		function getQuerySimple(r, q, cache) {
			var	request = {	url: r, params: (q || {}), cache: ((cache === undefined) ? false : cache) };
			return requestGET(request).then(function(data) {
				if (statusError(data)) return false;
				return data.data.data;
			});
		}

		function requestGET(request) { return makeRequest({method: "GET", cache: ((request.cache !== null) ? request.cache : true)}, request); }
		function requestPOST(request) { return makeRequest({method: "POST", cache: ((request.cache !== null) ? request.cache : false)}, request); }
		function requestDELETE(request) { return makeRequest({method: "DELETE", cache: ((request.cache !== null) ? request.cache : false)}, request); }
		function requestPUT(request) { return makeRequest({method: "PUT", cache: ((request.cache !== null) ? request.cache : false)}, request); }

		function simpleGET(url) {
			return $http({ method: "GET", url: url, cache: true }).then(handleData, logError);

			function handleData(data) {
				if (!data) return logError(data);
				if (data.status !== 200) logError(data);
				return data.data;
			}

			function logError(data) {
				if (!data.data) return console.warn("ERROR ON REQUEST:", data);
				alertsServices.addNewAlert("danger", (data.status + ": " + data.data.message));
			}
		}

		function makeRequest(type, request) {
			return $timeout(function() {
				var
					httpObject = {
						method: type.method,
						url: request.url,
						params: request.params,
						data: request.data,
						cache: type.cache,
						headers: {}
					},
					currentToken = getToken()
				;
				if (currentToken) httpObject.headers['x-access-session-token'] = currentToken;

				return $http(httpObject).then(
					function(r) { return (request.successFunction || handleRequestSuccess)(r, request); },
					function(r) { return (request.errorFunction || handleRequestError)(r, request); }
				);
			}, CURRENT_LAG);
		}

		return methods;
	}

	exports.function = APIServicesFunction;
})();