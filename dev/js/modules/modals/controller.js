(function() {
	'use strict';

	ModalGenericYesNo.$inject = ['$scope', '$uibModalInstance', 'parameters'];
	ModalSendMessage.$inject = ['$scope', '$timeout', '$uibModalInstance', 'parameters'];
	ModalSendReport.$inject = ['$scope', '$timeout', '$uibModalInstance', 'parameters'];

	function ModalGenericYesNo($scope, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		$scope.closeModal = function(choice) { $uibModalInstance.close(choice); };
	}

	function ModalSendMessage($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modalTitle = "";
		vm.modalMessage = "";
		vm.currentError = "";

		vm.maxTitleCharacters = 48;
		vm.maxMessageCharacters = 1024;

		$scope.closeModal = function(choice) {
			if (choice) {
				var titleCharactersLeft = (vm.maxTitleCharacters - vm.modalTitle.length),
					messageCharactersLeft = (vm.maxMessageCharacters - vm.modalMessage.length);

				if (
					((titleCharactersLeft >= 0) && (messageCharactersLeft >= 0)) &&
					((titleCharactersLeft !== vm.maxTitleCharacters) && (messageCharactersLeft !== vm.maxMessageCharacters))
				) {
					$uibModalInstance.close({choice: true, title: vm.modalTitle, body: vm.modalMessage, receiver: vm.options.receiver.hash});
				} else {
					vm.currentError = (function(titleLeft, messageLeft, maxTitle, maxMessage) {
						switch (true) {
							case (titleLeft < 0): { return "Your title cannot be longer than " + maxTitle + " characters!"; } break;
							case (messageLeft < 0): { return "Your message cannot be longer than " + maxMessage + " characters!"; } break;
							case (titleLeft ===  maxTitle): { return "Your title cannot be empty."; } break;
							case (messageLeft === maxMessage): { return "Your message body cannot be empty."; } break;
							default: { return "Please format your message properly."; }
						}
					})(titleCharactersLeft, messageCharactersLeft, vm.maxTitleCharacters, vm.maxMessageCharacters);

					$timeout(function() { vm.currentError = ""; }, 6000);
				}
			} else {
				$uibModalInstance.close({ choice: false });
			}

		};
	}

	function ModalSendReport($scope, $timeout, $uibModalInstance, parameters) {
		var vm = this;
		vm.options = parameters;
		vm.modalTitle = "";
		vm.modalMessage = "";
		vm.currentError = "";

		vm.maxMessageCharacters = 144;

		vm.currentReportIndex = 0;

		vm.defaultReportRules = [
			{name: "Rule Violation", description: "The subject has intentionally violated any of the established rules.", type: "rules"},
			{name: "Harassment", description: "The subject has intentionally harassed or disturbed other users.", type: "harassment"},
			{name: "Illegal Content", description: "The subject has posted illegal content.", type: "illegal"},
			{name: "Hacking", description: "The subject has intentionally utilized third-party tools or abused bugs.", type: "bug"}
		];

		vm.reportRules = [];

		for (var i in vm.defaultReportRules) {
			for (var j in vm.options.types) {
				if (vm.defaultReportRules[i].type === vm.options.types[j]) vm.reportRules.push(vm.defaultReportRules[i]);
			}
		}

		vm.contextData = (function(content) {
			switch(content) {
				case "player": { return {image: "images/avatars/players/", name: "Operator"}; } break;
				case "pmc": { return {image: "images/avatars/pmc/", name: "Outfit"}; } break;
				default: { return {image: "images/avatars/players/", name: "Unit"}; } break;
			}
		})(vm.options.content);

		console.log(vm.contextData);

		$scope.closeModal = function(choice) {
			var reportType = vm.reportRules[vm.currentReportIndex].type;

			if (choice) {
				$uibModalInstance.close({
					choice: true,
					reason: (vm.modalMessage || "No reason specified."),
					type: reportType,
					reported: vm.options.hash,
					content: vm.options.content
				});
			} else { $uibModalInstance.close({ choice: false }); }

		};
	}

	exports.ModalGenericYesNo = ModalGenericYesNo;
	exports.ModalSendMessage = ModalSendMessage;
	exports.ModalSendReport = ModalSendReport;
})();