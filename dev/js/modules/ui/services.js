(function() {
	'use strict';

	UIServicesFunction.$inject = ["$rootScope", "$uibModal", "$document"];

	function UIServicesFunction($rootScope, $uibModal, $document) {

		var methods = {
			centerElements: centerElements,
			centerHexagon: centerHexagon,
			createModal: createModal,
			uiMasonry: uiMasonry,
			stickyPagination: stickyPagination,
			bindScrollToElement: bindScrollToElement,
			getTransformScale: getTransformScale,
			updateWindowTitle: updateWindowTitle,
			updateWindowTitleNumber: updateWindowTitleNumber
		};

		function updateWindowTitle(v) { $rootScope.$broadcast("updatePageTitle", v.join(" | ")); }

		function updateWindowTitleNumber(n, d) { $rootScope.$broadcast("updatePageTitleNumber", { number: n, detail: d }); }

		function getTransformScale(prop) {
			var currentScale = matrixTransform.parse(prop);
			return {
				translate: { x: currentScale[4], y: currentScale[5] },
				scale: { x: currentScale[0], y: currentScale[3] }
			};
		}

		function bindScrollToElement(parentEl, targetEl,  fnc) {
			// https://stackoverflow.com/questions/8189840/get-mouse-wheel-events-in-jquery/15629039#15629039

			var supportOffset = (window.pageYOffset !== undefined),
				lastKnownPos = 0, ticking = false, scrollDir, currYPos,
				elementTarget = document.getElementById(parentEl),
				scrollFunction = function(e) {
					currYPos = (supportOffset ? window.pageYOffset : document.body.scrollTop);
					scrollDir = Math.sign(e.deltaY);

					if (!ticking)
						window.requestAnimationFrame(function() { fnc(targetEl, currYPos, scrollDir); ticking = false; });

					ticking = true;
				},
				unbindEventFunction = function() { elementTarget.removeEventListener("wheel", scrollFunction, false); };

			elementTarget.addEventListener("wheel", scrollFunction);
			return unbindEventFunction;
		}

		function stickyPagination(mainEl, paginationEl, fixedClass, sA, eP) {
			var
				mainElement = $(mainEl),
				mainPagination = $(paginationEl);

			return (function() {
				if ($(window).innerWidth() <= 1024) {
					var currentScroll = ($(window).scrollTop()),
						elementPosition = (mainElement.offset().top),
						directiveHeight = $(mainElement).height(),
						windowHeight = $(window).innerHeight(),
						startPadding = sA,
						endPadding = (windowHeight - eP),
						scrollingThrough = (((currentScroll - elementPosition) >= 0) && ((currentScroll - elementPosition) <= (directiveHeight - endPadding)));
					if (scrollingThrough) { mainPagination.addClass(fixedClass); } else { mainPagination.removeClass(fixedClass); }
				} else { mainPagination.removeClass(fixedClass); }
			})(mainElement, mainPagination, fixedClass, sA, eP);
		}

		function uiMasonry(target, options) { if ($(target).length) var msnry = new masonry(target, options); }

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