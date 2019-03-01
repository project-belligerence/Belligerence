(function() {
	'use strict';

	FrontPageControllerFunction.$inject = [];

	function FrontPageControllerFunction() {
		var vm = this,
			aosOffset = isMobile() ? 100 : 280;

		AOS.init({ "offset": aosOffset, "easing": "ease-out-quad" });

		handleScrollIcon();

		function isMobile() {
			var windowWidth = $(window).width();
			return (windowWidth <= 768);
		}

		function handleScrollIcon() {
			var scrollIconDOM = $("#fp-scroll-invite"),
				windowDOM = $(window),
				scrollHandle = windowDOM.scroll(handleScroll);

			function handleScroll() {
				var currentScroll = windowDOM.scrollTop(),
					scrollIconTop = scrollIconDOM.position().top;
				if (currentScroll >= (scrollIconTop / 2)) {
					destroyIcon();
					windowDOM.off("scroll", handleScroll);
				}
			}
			function destroyIcon() { scrollIconDOM.fadeOut(250, function() { scrollIconDOM.remove(); }); }
		}
	}

	exports.function = FrontPageControllerFunction;
})();