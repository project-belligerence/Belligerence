(function() {
	'use strict';

	ObjectDirectiveFunctions.$inject = ["$cookies"];

	function ObjectDirectiveFunctions($cookies) {
		var vm = this;

		vm.markWarningRead = markWarningRead;
		vm.warningRead = $cookies.get('cookiesWarningOK');

		if (vm.warningRead) removeBar();

		function markWarningRead() {
			$cookies.put('cookiesWarningOK', true);
			removeBar()
		}

		function removeBar() {
			var cookiesBar = $("#cookies-alert-bar");
			fade();
			function fade() { cookiesBar.fadeOut(250, destroy); }
			function destroy() { cookiesBar.remove(); }
		}
	}

	function ObjectDirectiveFunction() {
		return {
			scope: {},
			restrict : "E",
			templateUrl: 'directive/cookies.ejs',
			controller: ObjectDirectiveFunctions,
			controllerAs: "CookiesCtrl"
		};
	}

	exports.function = ObjectDirectiveFunction;
})();