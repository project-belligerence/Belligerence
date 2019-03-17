(function() {
	'use strict';

	ObjectControllerFunction.$inject = ["$scope", "$state", "$stateParams", "$timeout", "apiServices", "generalServices", "uiServices"];

	function ObjectControllerFunction($scope, $state, $stateParams, $timeout, apiServices, generalServices, uiServices) {
		var vm = this;

		vm.getProjectLicense = getProjectLicense;
		vm.getChevron = getChevron;
		vm.getNpmPackages = getNpmPackages;
		vm.rollOverCredits = rollOverCredits;

		initializeUIValues();
		getOpenParamTab();

		// ==========================================================

		function getOpenParamTab() {
			var tab = $stateParams.tab;
			if (tab) {
				vm[(tab + "Open")] = true;
				$timeout(function() { $("html, body").animate({ scrollTop: ($("#" + tab).offset().top - 150) }, "slow"); }, 500);
			}
		}

		function rollOverCredits() {
			if (!vm.ui.creditsStarted) {
				vm.ui.creditsStarted = true;
				vm.ui.currentScroll = 0;

				$("#mouse-warning").fadeIn();

				initializeCreditsUIValues();
				mouseOverCreditsHandler();
				$timeout(function() { scrollCredits(); }, 500);
			}
		}

		function scrollCreditsHandler() {
			if ($state.current.name !== "app.public.about") return false;

			var tgtCtn = "about-container";
			return uiServices.bindScrollToElement(tgtCtn, tgtCtn, function(tgt, ypos) {
				if (vm.ui.creditsStarted) vm.ui.currentScroll = (ypos * -1) + 250;
			});
		}

		function mouseOverCreditsHandler() { vm.ui.mainContainer.on("mousemove", handleScroll); }

		function handleScroll(e) {
			var mX = e.clientX;
			vm.ui.stopScroll = ((mX >= vm.ui.cDom.eLeft) && (mX <= vm.ui.cDom.totalWidth));
		}

		function scrollCredits() {
			var cScroll = vm.ui.currentScroll,
				loweringSpeed = vm.ui.creditsSpeed,
				topScroll = (vm.ui.getScrollTop() + vm.ui.cDom.endHeightOffset),
				doneScrolling = (topScroll >= vm.ui.cDom.totalHeight);

			$timeout(function() {
				var cLowering = (vm.ui.stopScroll ? 0 : loweringSpeed);

				if (!doneScrolling) {
					if (!vm.ui.stopScroll) {
						$('html, body').animate({ scrollTop: (vm.ui.cDom.offsetTop - cScroll) }, (vm.ui.scrollDelay));
						vm.ui.currentScroll = (cScroll - cLowering);
					}
					scrollCredits(vm.ui.currentScroll);
				} else {
					$('html, body').animate({ scrollTop: ((vm.ui.cDom.offsetTop - cScroll) + vm.ui.cDom.finalScroll) }, 2000);
					vm.ui.creditsStarted = false;
				}
			}, vm.ui.scrollDelay);
		}

		function initializeUIValues() {
			vm.ui = {
				creditsStarted: false,
				stopScroll: false,
	      		body: document.body,
	      		docElem: document.documentElement,
	      		mainContainer: $("#about-container"),

	      		currentScroll: 150,
	      		scrollDelay: 2000,
	      		creditsSpeed: 150,

	      		EH: {
	      			scrollHandler: scrollCreditsHandler()
	      		}
			};
			vm.ui.getScrollTop = function() { return (window.pageYOffset || vm.ui.docElem.scrollTop || vm.ui.body.scrollTop); };
		}

		function initializeCreditsUIValues() {
			vm.ui.creditsDOM = $("#credits");

			vm.ui.cDom = {
				eWidth: vm.ui.creditsDOM.outerWidth(),
				eLeft: vm.ui.creditsDOM.position().left,

				eHeight: vm.ui.creditsDOM.outerHeight(),
				eTop: vm.ui.creditsDOM.position().top,

				offsetTop: vm.ui.creditsDOM.offset().top,

				endHeightOffset: 900,
				finalScroll: 50
			};

			vm.ui.cDom.totalWidth = (vm.ui.cDom.eLeft + vm.ui.cDom.eWidth);
			vm.ui.cDom.totalHeight = (vm.ui.cDom.eTop + vm.ui.cDom.eHeight);
		}

		function getNpmPackages() {
			generalServices.getNpmPackages().then(function(packages) { vm.npmPackages = packages; });
		}

		function getProjectLicense() {
			var repoURL = "https://api.github.com/repos/Neefay/Belligerence/license";

			apiServices.simpleGET(repoURL).then(function(data) {
				getProjectLicenseDetails(data.license.url);
			});
		}

		function getChevron(status) { return ('ion-chevron-' + (status ? 'down' : 'right')); }

		function getProjectLicenseDetails(url) {
			apiServices.simpleGET(url).then(function(data) {
				vm.licenseData = data;

				var bodyReplaced = vm.licenseData.body;

				bodyReplaced = _.replace(bodyReplaced, "[year]", new Date().getFullYear());
				bodyReplaced = _.replace(bodyReplaced, "[fullname]", "Ian Ribeiro");

				vm.licenseData.body = bodyReplaced;
			});
		}

		function destroyEHs() {
			vm.ui.mainContainer.off("mousemove", handleScroll);
		}

		$scope.$on("$destroy", destroyEHs);
		$scope.$on("$destroy", scrollCreditsHandler());
	}

	exports.function = ObjectControllerFunction;
})();