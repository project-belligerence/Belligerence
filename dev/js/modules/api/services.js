(function() {
	'use strict';

	APIServicesFunction.$inject = ["$http", "$q", "$timeout", "$cookies", "alertsServices"];

	function APIServicesFunction($http, $q, $timeout, $cookies, alertsServices) {

		var methods = {
				getModule: getModule,
				returnUnloggedUser: returnUnloggedUser,
				getToken: getToken,
				cloneValue: cloneValue,
				suggestedTags: suggestedTags,
				boolString: boolString,
				displayContract: displayContract,
				displayPrivilege: displayPrivilege,
				returnDateDifferenceDays: returnDateDifferenceDays,
				handleRequestSuccess: handleRequestSuccess,
				handleRequestError: handleRequestError,
				statusError: statusError,
				requestGET: requestGET,
				requestPOST: requestPOST,
				requestPUT: requestPUT,
				getInfo: getInfo,
				resolveFunction: resolveFunction,
				validateParams: validateParams
			},
			tokens = {
				admin : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkNvb2wgQWRtaW4iLCJwcml2aWxlZ2UiOjAsImhhc2giOiJkMTYyMmUyNjMzNjE4OWY1MjI5ZSIsInBtY0hhc2giOm51bGwsImlhdCI6MTQ1ODgwNDgyNSwiZXhwIjo5OTc0NjQ4MDA4MjZ9.5lFbAOXpqu2EJ_kopLtunGVnK-FrBmX0zfFYkiC32pE',
				pmc: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZGI4OWEyNzU2Y2IxYTdhNjMxMDYiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNjMsImV4cCI6OTk3NDYxNjA5MjY0fQ.VhR1eAS2Z2UKdFVA7PWYs2h2VrnHNRfD6wfdDQPGr_0",
				regular: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZDRiMzY2Y2E3NWJkZjU0YjEyNGQiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNzMsImV4cCI6OTk3NDYxNjA5Mjc0fQ.eNh9GKWuzL4HiPVbcmiEwL-chzdYD1q5gdI0uw6KT-U",
				dummy: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkhvYm8gTWFuIiwicHJpdmlsZWdlIjoxMCwiaGFzaCI6ImI5MTVjOGU4NGFlMDZhMzAxZTY3IiwicG1jSGFzaCI6bnVsbCwiaWF0IjoxNDY3Nzg0MzMwLCJleHAiOjk5NzQ3Mzc4MDMzMX0.VlyFXS10naplGF8-CEABlINGC-2T0rdNCchKKC31C50"
			},
			activeToken = tokens.regular,

			MULTIP_LAG = 1,

			MIN_LAG = 150 * MULTIP_LAG,
			MAX_LAG = 350 * MULTIP_LAG,

			// CURRENT_LAG = Math.floor(Math.random() * (MAX_LAG - MIN_LAG + 1)) + MIN_LAG
			CURRENT_LAG = 0
		;

		if (typeof(Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function() {
				return this * Math.PI / 180;
			};
		}

		function cloneValue(source) { return ($.extend(true, {}, source)); }

		function boolString(value) { return (value === "true"); }

		function getModule(module) { return ("./modules/" + module + "/init"); }

		function statusError(data) { if (data.data !== undefined) { return (!(data.data.success) || (data.status === -1)); } else { return false; } }

		function getToken() {
			// return ($cookies.get('loggedInToken') || activeToken);
			// return activeToken;
			return null;
		}

		function returnUnloggedUser() {
			return {
				aliasField: "Anonymous User",
				hashField: "123abc",
				playerPrivilege: 9991
			};
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

		function suggestedTags(q) {
			var suggested = [
				"Loner",
				"Realism",
				"Relaxed",
				"Incompetent",
				"Leading"
			], i, final = [];

			for (i in suggested) {
				var search = suggested[i].match(new RegExp(q, 'gi'));
				if (search) final.push(suggested[i]);
			}

			return final;
		}

		function getValidationString(o, v) {
			var validationStrings = {
				isLength: function(v, o) {
					return 'Length of value \"' + v + '\" must be between ' + o.params.min + ' and ' + o.params.max + ' characters.';
				},
				isEmail: function(v, o) {
					return '\"' + v + '\" is not a valid e-mail.';
				},
				valueUndefined: function(v) { return 'A required value provided is undefined.';	}
			};
			return validationStrings[o.func](v, o);
		}

		function validateParams(v, p) {
			var success = true;
			for (var i in p) {
				var requirement = p[i];

				if (!(requirement.library[requirement.func](v, requirement.params))) {
					alertsServices.addNewAlert("warning", getValidationString(requirement, v));
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
				case 2: { return { name: "Freelancer", icon: "ion-ios-paperplane" }; } break;
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

		function handleRequestError(response, request) {
			console.error("INVALID REQUEST:", JSON.stringify(response), response.status, response.statusText);

			var errorList = {
				10: {
					type: "danger",
					message: function(d) {
						var diffDays = returnDateDifferenceDays(response.data.data.expiration);
						return d.message + " REASON: '" + d.data.reason + "' " + diffDays + " DAYS REMAINING.";
					},
					redirect: "app"
				},
				11: {
					type: "warning",
					message: function(d) { return "Malformed session - please login again.";	},
					redirect: "app"
				},
				12: {
					type: "info",
					message: function(d) { return "Your session has expired - please login again.";	},
					redirect: "app"
				}
			};

			if (response.status >= 300) {
				var error = errorList[response.data.code];

				if (error) {
					if (error.message) {
						alertsServices.addNewAlert(error.type, error.message(response.data));
						if (error.redirect) $state.go(error.redirect);
					}
				}
			}

			return response;
		}

		function getInfo(r, cache) {
			var	request = {	url: r, cache: (cache === undefined ? false : true) };
			return requestGET(request).then(function(data) {
				if (statusError(data)) return false;
				return data.data.data;
			});
		}

		function requestGET(request) { return makeRequest({method: "GET", cache: ((request.cache !== null) ? request.cache : true)}, request); }
		function requestPOST(request) { return makeRequest({method: "POST", cache: ((request.cache !== null) ? request.cache : false)}, request); }
		function requestPUT(request) { return makeRequest({method: "PUT", cache: ((request.cache !== null) ? request.cache : false)}, request); }

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