(function() {
	'use strict';

	UIServicesFunction.$inject = ["$uibModal", "$document"];

	function UIServicesFunction($uibModal, $document) {

		var methods = {
			centerElements: centerElements,
			centerHexagon: centerHexagon,
			createModal: createModal
		};

		function centerElements(parents, children) {
			$(parents).each(function(i, el) {
				var elWidth = (parseInt($(el).css("width"), 10)),
					element = $(el).find(children),
					fSize = (((elWidth) - (parseInt($(element).css("width"), 10))) / 3);

				$(element).css({"position": "relative", "left": fSize + "px"});
			});
		}

		function centerHexagon(hexagonName, anchorName, large) {
			var hexagonElement = $(hexagonName),
				hexagonInside = $(hexagonName + " .in2"),
				anchorElement = $(anchorName),

				anchorWidth = (parseInt(anchorElement.css("width"), 10)),
				hexagonInsideWidth = ((parseInt(hexagonInside.css("width"), 10))),

				finalLeft = ((anchorWidth / 2) - (hexagonInsideWidth / 2)),

				windowWidth = $(window).width();

			// console.log("Hexagon:", $(hexagonName + ".hexagon").hasClass("avatar-large"));
			// console.log("Has avatarLarge:", hexagonElement.hasClass("avatar-large"));

			// console.log("Anchor width:", anchorWidth);
			// console.log("Inside width:", hexagonInsideWidth);
			// console.log("Final left:", finalLeft);
			// console.log("Targetting:", hexagonElement);
			// console.log("Window: ", windowWidth);

			hexagonElement.css({"position": "relative", "left": finalLeft + "px"});
		}

		function createModal(type, parameters, size) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'modals/'+ type +'.ejs',
				controller: 'Modal'+ type +'Controller',
				controllerAs: 'ModalController',
				size: size,
				resolve: { parameters: parameters }
			});
			return modalInstance;
		}

		return methods;
	}

	exports.function = UIServicesFunction;
})();