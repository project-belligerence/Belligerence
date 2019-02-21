(function() {
	'use strict';

	ItemsServicesFunction.$inject = ["$timeout", "apiServices", "generalServices", "uiServices"];

	function ItemsServicesFunction($timeout, apiServices, generalServices, uiServices) {

		var methods = {
			askReportItem: askReportItem
		};

		function askReportItem(args) {
			var
			modalOptions = { alias: args.nameField,	hash: args.hashField, content: "item", types: ["itemData", "itemBugged"] },
			newModal = uiServices.createModal('SendReport', modalOptions);

			newModal.result.then(function(choice) {
				if (choice.choice) { generalServices.sendReport(choice); }
				else { return false; }
			});
		}

		return methods;
	}

	exports.function = ItemsServicesFunction;
})();