(function() {
	'use strict';

	FrontPageControllerFunction.$inject = [];

	function FrontPageControllerFunction() {
		var vm = this,
			aosOffset = isMobile() ? 100 : 280;

		AOS.init({ "offset": aosOffset, "easing": "ease-out-quad" });

		function isMobile() {
			var windowWidth = $(window).width();
			return (windowWidth <= 768);
		}
	}

	exports.function = FrontPageControllerFunction;
})();