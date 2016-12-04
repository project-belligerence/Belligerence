(function() {
	'use strict';

	APIServicesFunction.$inject = ["$http"];

	function APIServicesFunction($http) {

		var methods = {
				getModule: getModule,
				boolString: boolString,
				handleRequestSuccess: handleRequestSuccess,
				handleRequestError: handleRequestError,
				statusError: statusError,
				requestGET: requestGET,
				requestPOST: requestPOST
			},
			tokens = {
				admin : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkNvb2wgQWRtaW4iLCJwcml2aWxlZ2UiOjAsImhhc2giOiJkMTYyMmUyNjMzNjE4OWY1MjI5ZSIsInBtY0hhc2giOm51bGwsImlhdCI6MTQ1ODgwNDgyNSwiZXhwIjo5OTc0NjQ4MDA4MjZ9.5lFbAOXpqu2EJ_kopLtunGVnK-FrBmX0zfFYkiC32pE',
				pmc: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZGI4OWEyNzU2Y2IxYTdhNjMxMDYiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNjMsImV4cCI6OTk3NDYxNjA5MjY0fQ.VhR1eAS2Z2UKdFVA7PWYs2h2VrnHNRfD6wfdDQPGr_0",
				regular: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6Im5pZmUiLCJwcml2aWxlZ2UiOjEwLCJoYXNoIjoiZDRiMzY2Y2E3NWJkZjU0YjEyNGQiLCJwbWNIYXNoIjpudWxsLCJpYXQiOjE0NTU2MTMyNzMsImV4cCI6OTk3NDYxNjA5Mjc0fQ.eNh9GKWuzL4HiPVbcmiEwL-chzdYD1q5gdI0uw6KT-U",
				dummy: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGlhcyI6IkhvYm8gTWFuIiwicHJpdmlsZWdlIjoxMCwiaGFzaCI6ImI5MTVjOGU4NGFlMDZhMzAxZTY3IiwicG1jSGFzaCI6bnVsbCwiaWF0IjoxNDY3Nzg0MzMwLCJleHAiOjk5NzQ3Mzc4MDMzMX0.VlyFXS10naplGF8-CEABlINGC-2T0rdNCchKKC31C50"
			},
			activeToken = tokens.regular
		;

		function boolString(value) { return (value === "true"); }

		function getModule(module) { return ("./modules/" + module + "/init"); }

		function statusError(data) { return (!(data.data.success) || (data.status === -1)); }

		function createSystemAlert(response) {
			alert(response.message);
		}

		function handleRequestSuccess(response) {
			if (!(response.data.success)) createSystemAlert(response.data);
			return response;
		}

		function handleRequestError(response) {
			console.error("INVALID REQUEST: ", response);
			return response;
		}

		function requestGET(request) { return makeRequest({method: "GET", cache: ((request.cache !== null) ? request.cache : true)}, request); }
		function requestPOST(request) { return makeRequest({method: "POST", cache: ((request.cache !== null) ? request.cache : false)}, request); }

		function makeRequest(type, request) {
			return $http({
				method: type.method,
				url: request.url,
				params: request.params,
				data: request.data,
				cache: type.cache,
				headers: {
					'x-access-session-token': activeToken
				}
			}).then(handleRequestSuccess, handleRequestError);
		}

		return methods;
	}

	exports.function = APIServicesFunction;
})();