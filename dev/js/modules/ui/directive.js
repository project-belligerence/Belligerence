(function() {
	'use strict';

	UIDirectives.$inject = [];

	function UIDirectives() {

		var ngHTMLFunction = ['$compile', function ($compile) {
			return function (scope, jELem, attrs) {
				if (attrs.ngHtml) {
					jELem.html(scope.$eval(attrs.ngHtml));
					$compile(jELem.contents())(scope);
				}
				scope.$watch(attrs.ngHtml, function (newValue, oldValue) {
					if (newValue && newValue !== oldValue) {
						jELem.html(newValue);
						$compile(jELem.contents())(scope);
					}
				});
			};
		}];

		var createRadialMenu = ['$timeout', '$location', 'apiServices' , function($timeout, $location, apiServices) {
			return {
				restrict: 'E',
				scope: {
					options: "=",
					arguments: "=",
					listClass: "@",
					itemClass: "@"
				},
				link: link,
				templateUrl: 'directive/radial.ejs'
			};

			function link(scope, el, attrs) {
				var
					jEL = $(el),
					elParent = $(jEL.parent()),
					params = [
						{ param: "itemClass", f: function(jEL, scope) { return jEL.addClass(scope.itemClass);}},
						{ param: "listClass", f: function(jEL, scope) { return jEL.find("li").addClass(scope.listClass);}},
						{ param: "isOpen", f: function() { isOpen = scope.isOpen; return true; }}
					],
					isOpen = !(scope.options.toggleOnClick),
					subItems = [],
					disabledItems = [],
					argPos = (scope.arguments.offset || {top: 0, left: 0})
				;

				scope.newList = apiServices.cloneValue(scope.options.items);

				scope.buttonInteraction = buttonInteraction;

				if (scope.options.toggleOnClick) { elParent.on("click", switchMode); }

				readParams(jEL, scope, params);

				$timeout(function() {
					jEL.find(".content").each(function(i, liEl) { subItems.push(liEl); });

					filterItems();

					setElementsSize(jEL);
					positionElements(jEL);
				}, 1);

				function buttonInteraction(id) {
					var itemID = id,
						fIndex = (disabledItems.indexOf(itemID));

					if ((fIndex === -1) || (disabledItems.length === 0)) {
						var liFunction = scope.newList[itemID].function,
							liRoute = scope.newList[itemID].route;

						if (liFunction) scope.newList[itemID].function(scope.arguments);
						// if (liRoute) $location.path(liRoute(scope.arguments));
					}
				}

				function setElementsSize(jEL) {
					jEL.find(".radial-menu").each(function(i, ul) {
						var thisLeft = parseInt(elParent.position().left, 10),
							thisTop = elParent.position().top,
							ulObj = $(ul),
							ulItems = ulObj.find(".radial-item").length,
							ulMaxWidth = 45;

						ulObj.find(".radial-item").each(function(ix, liEl) {
							var liElObj = $(liEl),
								liContent = liElObj.find(".content"),
								liIcon = liElObj.find(".icon");

							liContent.each(function(iix, liEl2) {
								var liPad = ((liIcon.length === 0) ? 0 : 40),
									nWidth = ((parseInt($(liEl2).outerWidth(), 10) + liPad)),
									nHeight = parseInt($(liEl2).outerHeight(), 10);
								liElObj.css('width', nWidth);
								liElObj.css('height', nHeight);
							});

							if (liContent.length === 0) { liElObj.css({'width' : 40, 'height': 40}); }
							if (liElObj.outerWidth() > ulMaxWidth) ulMaxWidth = liElObj.outerWidth();

							if ((ix + 1) === ulItems) {
								if (ulMaxWidth > 45) ulMaxWidth = ((ulMaxWidth / 10));
								ulObj.css({
									'top': (thisTop - 50),
									'left': (thisLeft + (ulMaxWidth)),
									'width': elParent.outerWidth()
								});
							}
						});
					});
				}

				function filterItems() {
					var subItemsHTML = [], i, j;

					for (i in scope.newList) {
						if (scope.newList[i].condition) {
							if ((scope.newList[i].condition(scope.arguments)) === false) disabledItems.push(parseInt(i));
						}
					}
					jEL.find("li").each(function(i, liEl) {
						var fIndex = (disabledItems.indexOf(i));
						if (fIndex > -1) { $(liEl).addClass("disabled"); }

						if (scope.newList[i].route !== undefined) {
							$(liEl).wrap( "<a href='" + scope.newList[i].route(scope.arguments) + "'></a>" );
						}
					});
				}

				function switchMode() { isOpen = !(isOpen); positionElements(jEL); setElementsSize(jEL); }

				function readParams(jEL, scope, arg) { for (var i in arg) { if (scope[arg[i].param]) arg[i].f(jEL, scope);}}

				function positionElements(jEL) {
					var
						eLeft = elParent.position().left,
						eTop = elParent.position().top,
						eWidth = (parseInt(elParent.outerWidth(), 10)),
						eHeight = (parseInt(elParent.outerHeight(), 10))
					; // console.log(isOpen, elParent, eTop, eLeft, eWidth, eHeight);

					if (isOpen) {
						var totalItems = 0;
						jEL.find("li").each(function(){totalItems++;});

						jEL.find("li").each(function(ix, liEl) {
							var
								angle = ((ix * (360/totalItems)) + 270),
								distance = ((eHeight + 40) / 2),

								finalLeft = (distance * Math.cos(angle.toRad())),
								finalTop = (((eHeight / 2) + 40) + distance * Math.sin(angle.toRad()))
							;
							$(liEl).show();
							$(liEl).css({'top': (finalTop + argPos.top), 'left': ((finalLeft + 5) + argPos.left), 'opacity': '1'});
							elParent.addClass('active');
						});

						elParent.find(".close-radial").each(function(i, closeEl) {
							$(closeEl).show();

							$(closeEl).css({
								'top': (((eHeight / 2) - ($(closeEl).outerHeight() / 2) ) + argPos.top),
								'left': (((eWidth / 2) - ($(closeEl).outerWidth() / 2)) + argPos.left)
							});

							$(closeEl).css({'opacity': 1});
						});

					} else {
						jEL.find("li").each(function(i, liEl) {
							$(liEl).css({'top': (((eHeight / 2) + 32) + argPos.top), 'left': 5 + (argPos.left), 'opacity': '0'});
							elParent.removeClass('active');
							$timeout(function() {$(liEl).hide();}, 400);
						});
						elParent.find(".close-radial").each(function(i, closeEl) {
							$(closeEl).css({
								'top': (((eHeight / 2) - ($(closeEl).outerHeight() / 2) ) + argPos.top),
								'left': (((eWidth / 2) - ($(closeEl).outerWidth() / 2)) + argPos.left)
							});

							$(closeEl).css({'opacity': 0});

							$timeout(function() {$(closeEl).hide();}, 250);
						});
					}
				}

				// $(window).resize(function() {
				// 	positionElements(jEL);
				// 	setElementsSize(jEL);
				// });
			}
		}];

		var directives = {
			ngHTMLFunction: ngHTMLFunction,
			createRadialMenu: createRadialMenu
		};

		return directives;
	}

	module.exports = UIDirectives;
})();