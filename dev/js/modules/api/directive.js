(function() {
	'use strict';

	APIDirectives.$inject = [];

	function APIDirectives() {

		var ngHTMLFunction = ['$compile', function ($compile) {
			return function (scope, elem, attrs) {
				if (attrs.ngHtml) {
					elem.html(scope.$eval(attrs.ngHtml));
					$compile(elem.contents())(scope);
				}
				scope.$watch(attrs.ngHtml, function (newValue, oldValue) {
					if (newValue && newValue !== oldValue) {
						elem.html(newValue);
						$compile(elem.contents())(scope);
					}
				});
			};
		}];

		function LastRepeatFunction() {
			function linkFunction(scope, element, attrs) { if (scope.$parent.$last) { scope.callback(); } }
			return {
				scope: { callback: "&lastRepeatFunction" },
				restrict: 'A',
				link: linkFunction
			};
		}

		function aDisabled() {
			return {
				compile: function(tElement, tAttrs, transclude) {
					tAttrs.ngClick = "!(" + tAttrs.aDisabled + ") && (" + tAttrs.ngClick + ")";
					return function (scope, iElement, iAttrs) {
						scope.$watch(iAttrs.aDisabled, function(newValue) {
							if (newValue !== undefined) { iElement.toggleClass("disabled", newValue); }
						});
						iElement.on("click", function(e) { if (scope.$eval(iAttrs.aDisabled)) { e.preventDefault(); } });
					};
				}
			};
		}

		function placeholderImgFunction() {
			return {
				link: function(scope, element, attrs) {
					element.bind('error', function() {
						if (attrs.src != attrs.ngPlaceholder) {
							attrs.$set('src', attrs.ngPlaceholder);
						}
						element.unbind('error');
					});
				}
			};
		}

		function acBackgroundImageFunction() {

			return {
				restrict: 'A',
				link: link
			};

			function link(scope, element, attrs) {

				var backgroundDiv = createSubDiv();
				var placeholderDiv = createSubDiv();

				backgroundDiv.className = 'ac-bg-img__full-size';
				placeholderDiv.className = 'ac-bg-img__placeholder';

				placeholderDiv.style.opacity = 1;
				placeholderDiv.style.zIndex = 1;

				element[0].style.position = 'relative';

				element[0].appendChild(backgroundDiv);
				element[0].appendChild(placeholderDiv);

				var attrPlaceholder = (attrs.placeholder ? attrs.placeholder : "images/avatar_placeholder.png");
				placeholderDiv.style.backgroundImage = 'url(' + attrPlaceholder + ')';

				attrs.$observe('backgroundImage', backgroundChange);

				function createSubDiv(s) {
					var div = document.createElement('div');

					div.style.position = 'absolute';

					div.style.left = 0;
					div.style.top = 0;
					div.style.bottom = 0;
					div.style.right = 0;

					div.style.backgroundRepeat = "no-repeat";
					div.style.backgroundPosition = "center center";

					return div;
				}

				function backgroundChange() {
					placeholderDiv.style.opacity = 1;
					var image = new Image();

					image.addEventListener('load', function () {
						backgroundDiv.style.backgroundImage = 'url(' + this.src + getUncached() + ')';
						fadeOut(placeholderDiv);
					});

					image.src = attrs.backgroundImage;
				}

				// function getUncached() { return (attrs["no-cache"] ? "" : ("?nocache=" + Math.random())); }

				function getUncached() { return ""; }

				function fadeOut(el) {
					el.style.opacity = 1;
					(function fade() {
						if ((el.style.opacity -= 0.1) <= 0) {
							el.style.display = 'none';
						} else {
							requestAnimationFrame(fade);
						}
					})();
				}
			}
		}

		var directives = {
			ngHTMLFunction: ngHTMLFunction,
			LastRepeatFunction: LastRepeatFunction,
			placeholderImgFunction: placeholderImgFunction,
			acBackgroundImageFunction: acBackgroundImageFunction,
			aDisabled: aDisabled
		};

		return directives;
	}

	module.exports = APIDirectives;
})();