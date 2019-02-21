(function() {
	'use strict';

	MessagesControllerFunction.$inject = ["$stateParams", "$scope", "$location", "$state", "$anchorScroll", "$timeout", "apiServices", "generalServices", "messagesServices", "routesServices", "navServices", "selfInfo"];

	function MessagesControllerFunction($stateParams, $scope, $location, $state, $anchorScroll, $timeout, apiServices, generalServices, messagesServices, routesServices, navServices, selfInfo) {
		var vm = this;

		vm.currentView = ($stateParams.view ? $stateParams.view : "messages");
		vm.cachedView = vm.currentView;
		vm.selfInfo = selfInfo;

		vm.outfitPermission = apiServices.getOutfitPermissions(vm.selfInfo);

		vm.sentReceived = "received";
		vm.currentOrder = "DESC";

		vm.currentMessageList = [];
		vm.currentInviteList = [];
		vm.currentReceivedData = {};
		vm.currentDisplayedMessage = null;
		vm.currentIndexMessage = -1;
		vm.currentIndexInvite = -1;
		vm.currentPage = 1;
		vm.loadingMessage = false;
		vm.safetyOff = false;

		vm.selectedViewIndex = -1;
		vm.selectedDirectionIndex = -1;

		vm.cachedAmountMessages = 0;
		vm.cachedAmountInvites = 0;

		vm.changeView = changeView;
		vm.setMessageDirection = setMessageDirection;
		vm.getTotalItems = getTotalItems;
		vm.readMessage = readMessage;
		vm.writeReply = writeReply;
		vm.getInviteIcon = apiServices.getInviteIcon;
		vm.switchOrder = switchOrder;
		vm.askDeleteMessage = askDeleteMessage;
		vm.getInviteType = apiServices.getInviteType;
		vm.getReSeInvite = getReSeInvite;
		vm.getInviteTarget = messagesServices.getInviteTarget;
		vm.getReSeMessage = getReSeMessage;
		vm.askResolveInvite = askResolveInvite;
		vm.askCancelInvite = askCancelInvite;

		vm.validViews = ["messages", "invites", "outfitinvites"];
		if (_.indexOf(vm.validViews, vm.currentView) < 0) vm.currentView = "messages";

		vm.defaultQueryOptions = { page: 1,	sort: "DESC", limit: 6 };

		vm.viewOptions = {
			messages: { value: "messages", icon: "ion-chatbox-working", name: "Messages" },
			invites: { value: "invites", icon: "ion-android-person-add", name: "Invites" },
			outfitinvites: { value: "outfitinvites", icon: "ion-ios-people", name: "Outfit Invites" },
		};

		vm.directionOptions = {
			received: { value: "received", icon: "ion-arrow-left-a", name: "Received" },
			sent: { value: "sent", icon: "ion-arrow-right-a", name: "Sent" }
		};

		vm.messageViews = {
			messages: {
				resolveFunc: getMessagesSelf,
				cache: "cachedAmountMessages"
			},
			invites: {
				resolveFunc: getInvitesSelf,
				cache: "cachedAmountInvites"
			},
			outfitinvites: {
				resolveFunc: getOutfitInvitesSelf,
				cache: "cachedAmountInvites"
			}
		};

		initializePage();

		$scope.$on("messagesPage:refresh", initializePage);

		// =========================================================================================

		function changeView(view, _cb) {
			var callbackFunc = (vm.messageViews[view].resolveFunc);
			vm.safetyOff = false;

			apiServices.resolveFunction(callbackFunc).then(function(result) {
				if (result) {
					vm.currentIndexMessage = -1;
					vm.currentIndexInvite = -1;
					vm.cachedView = view;
					vm.currentView = "";

					routesServices.scrollToTop();

					$timeout(function() {
						vm.currentView = view;

						generalServices.countMessagesInvitesReceived().then(function(data) {
							vm.currentReceivedData.messages = data.messages;
							vm.currentReceivedData.invites = data.receivedPlayer;
							vm.currentReceivedData.outfitinvites = data.receivedPMC;
						});

						$stateParams.view = (vm.cachedView);
						$state.params.view = (vm.cachedView);
						$location.search('view', (vm.cachedView));

						$timeout(function() {
							vm.safetyOff = true;
							messagesServices.alignMessages(vm.currentView);
						}, 200);

						if (_cb) return _cb(true);
					}, 350);

				} else { vm.cachedView = "messages"; changeView((vm.cachedView || "messages"));	}
			});
		}

		function getMessagesSelf(_cb) {
			var cPage = vm.currentPage,
				cFunction = ((vm.sentReceived === "sent") ? "getSentMessagesSelf" : "getReceivedMessagesSelf");

			messagesServices[cFunction]({ page: (cPage), order: vm.currentOrder }).then(function(data) {
				if (data) {
					vm.cachedAmountMessages = data.count;
					vm.messageViews.messages.amount = data.count;
					vm.currentMessageList = data.data;

					return _cb(true);
				} else { return _cb(false); }
			});
		}

		function getInvitesSelf(_cb) {
			var cPage = vm.currentPage,
				cFunction = ((vm.sentReceived === "sent") ? "getSentInvitesSelf" : "getReceivedInvitesSelf");
			messagesServices[cFunction]({ page: (cPage), order: vm.currentOrder }).then(function(data) {
				if (data) {
					vm.cachedAmountInvites = data.count;
					vm.messageViews.invites.amount = data.count;
					var cacheInvites = data.data;

					for (var cInvite in cacheInvites) {
						var currentMessage = cacheInvites[cInvite];
						currentMessage.direction = vm.sentReceived;

						currentMessage.avatarPicture =
							"images/avatars/" + vm.getInviteTarget(vm.sentReceived, currentMessage.type).folder +
							"/thumb_" + currentMessage[getReSeInvite() + 'Hash'] + ".jpg";
					}
					vm.currentInvitesList = cacheInvites;
					return _cb(true);
				} else { return _cb(false); }
			});
		}

		function getOutfitInvitesSelf(_cb) {
			var cPage = vm.currentPage,
				cFunction = ((vm.sentReceived === "sent") ? "getSentOutfitInvitesSelf" : "getReceivedOutfitInvitesSelf");
			messagesServices[cFunction]({page: (cPage), order: vm.currentOrder}).then(function(data) {
				if (data) {
					vm.cachedAmountInvites = data.count;
					vm.messageViews.invites.amount = data.count;
					var cacheInvites = data.data;

					for (var cInvite in cacheInvites) {
						var currentMessage = cacheInvites[cInvite];

						var renderedHash = ((vm.sentReceived === "received") ? "A_Hash" : "B_Hash");

						currentMessage.direction = vm.sentReceived;
						currentMessage.avatarPicture =
							"images/avatars/" + vm.getInviteTarget(vm.sentReceived, currentMessage.type).folder +
							"/thumb_" + currentMessage[renderedHash] + ".jpg";
					}
					vm.currentInvitesList = cacheInvites;
					return _cb(true);
				} else { return _cb(false); }
			});
		}

		function getReSeInvite() { return (vm.sentReceived === "received" ? "A_" : "B_");}
		function getReSeMessage() { return (vm.sentReceived === "received" ? "Sender" : "Receiver");}

		function getTotalItems() { return vm[vm.messageViews[vm.cachedView].cache];	}

		function setMessageDirection(d) {
			if (vm.sentReceived !== d) {
				vm.sentReceived = d; vm.currentPage = 1;
				changeView(vm.currentView);
			}
		}

		function switchOrder() {
			vm.currentOrder = (vm.currentOrder === "DESC") ? "ASC" : "DESC";
			changeView(vm.currentView);
		}

		function writeReply() {
			var alias = vm.currentDisplayedMessage.senderName,
				hash = vm.currentDisplayedMessage.senderHash,
				title = vm.currentDisplayedMessage.title;
			messagesServices.writeReply(alias, title, hash);
		}

		function askDeleteMessage(hash, _cb) {
			return messagesServices.askDeleteMessage(vm.currentDisplayedMessage.hash, function(result) {
				if (result) {
					vm.currentDisplayedMessage = null;
					changeView(vm.currentView);
				}
			});
		}

		function askResolveInvite(invite) {
			messagesServices.askResolveInvite(invite, function(data){ if (data) changeView(vm.currentView); });
		}

		function askCancelInvite(invite) {
			messagesServices.askCancelInvite(vm.sentReceived, invite, function(data) { if (data) changeView(vm.currentView); });
		}

		function readMessage(hash, index) {
			vm.currentDisplayedMessage = null;
			messagesServices.readSingleMessage(hash).then(function(data) {
				if (data.data.success) {
					vm.currentDisplayedMessage = null;
					$timeout(function() {
						if (!vm.currentMessageList[index].readField && (vm.sentReceived === "received")) {
							vm.currentReceivedData[vm.currentView] = (vm.currentReceivedData[vm.currentView] - 1);
							navServices.callEvent("refreshMessageCount");
						}
						if (vm.sentReceived === "received") vm.currentMessageList[index].readField = true;

						vm.currentIndexMessage = index;
						vm.currentDisplayedMessage = data.data.data;
						vm.currentDisplayedMessage.selfSent = (vm.sentReceived === "sent");

						if (apiServices.isPortrait()) $timeout(function() { $anchorScroll('current-message-view'); }, 150);
					}, 350);
				}
			});
		}

		function initializePage() {
			$timeout(function() {
				changeView(vm.currentView, function() {
					if ($stateParams.latest && vm.currentView === "messages") {
						var msg = vm.currentMessageList[0];
						readMessage(msg.hashField, 0);
					}
				});
			}, 250);
		}
	}

	exports.function = MessagesControllerFunction;
})();