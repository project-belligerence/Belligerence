(function() {
	'use strict';

	BannedControllerFunction.$inject = ["$rootScope"];

	function BannedControllerFunction($rootScope) {
		var vm = this;
		vm.status = $rootScope.currentBanData;
		vm.renderBan = false;

		$rootScope.$on("banscreen:displayBanReason", refreshBanScreen);

		function refreshBanScreen(event, data) {
			vm.status = data;
			vm.renderBan = true;
		}
	}

	exports.function = BannedControllerFunction;
})();