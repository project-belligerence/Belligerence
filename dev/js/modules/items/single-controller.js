(function() {
	'use strict';

	ItemsControllerFunction.$inject = ["$scope", "$state", "$timeout", "itemInfo", "selfInfo", "apiServices", "generalServices", "itemsServices"];

	function ItemsControllerFunction($scope, $state, $timeout, itemInfo, selfInfo, apiServices, generalServices, itemsServices) {
		var vm = this;
		if (!itemInfo) return $state.go("app.public.frontpage");

		vm.selfInfo = (selfInfo || apiServices.returnUnloggedUser());
		vm.itemInfo = itemInfo;
		vm.showItem = false;
		vm.generateLink = generateLink;
		vm.askSendReport = itemsServices.askReportItem;

		generalServices.getItemsTypeClass().then(function(itemsClass) {
			generalServices.getItemContent().then(function(content) {
				if (itemsClass && content) {
					vm.itemTypes = itemsClass.typeField;
					vm.itemClasses = itemsClass.classField;
					vm.contentData = content;

					$timeout(550).then(function(){ vm.showItem = true; });
				}
			});
		});

		// ====================================================

		function generateLink(property, value) { return "items?" + property + "=" + vm.itemInfo[value]; }
	}

	exports.function = ItemsControllerFunction;
})();