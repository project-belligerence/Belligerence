(function() {
	'use strict';

	APIConfigs.$inject = [];

	function APIConfigs() {

		var httpInterceptor = ["$httpProvider", function($httpProvider) {
			var interceptor = ['$q', '$rootScope' , function ($q, $rootScope) {
				return {
					request: function(config) {
						$rootScope.$broadcast("httpSensitive:block");
						return config;
					},
					response: function(response) {
						$rootScope.$broadcast("httpSensitive:allow");
						return response;
					},
					responseError: function(rejection) {
						$rootScope.$broadcast("httpSensitive:allow");
						return $q.reject(rejection);
					}
				};
			}];

			$httpProvider.interceptors.push(interceptor);
		}];

		var configs = {
			httpInterceptor: httpInterceptor
		};

		return configs;
	}

	module.exports = APIConfigs;
})();