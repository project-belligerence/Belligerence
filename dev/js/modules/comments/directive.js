(function() {
	'use strict';

	CommentsDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "commentsServices", "playerServices", "uiServices"];

	function CommentsDirectiveFunctions($scope, $timeout, apiServices, commentsServices, playerServices, uiServices) {
		var vm = this;

		vm.page = 1;
		$scope.sort = "createdAt";
		$scope.order = "DESC";

		$scope.finalContainerSize = ($scope.containerSize === "small" ? "col-md-12" : "col-md-6 col-xs-12");

		if ($scope.containerSize === "small") $(".comments-container").addClass("single-column");

		$scope.perPage = ($scope.perPage === undefined ? 4 : $scope.perPage);

		$scope.currentIcon = "ion-ios-calendar-outline";

		$scope.allowCommentsParam = (angular.isUndefinedOrNull($scope.allowComments) ? true : $scope.allowComments);
		$scope.allowCommentsParam = (apiServices.getToken() ? $scope.allowCommentsParam : false);
		$scope.showCommentsParam = (angular.isUndefinedOrNull($scope.showComments) ? true : $scope.showComments);

		vm.commentTitle = "";
		vm.commentBody = "";

		$scope.currentPostError = "";

		$scope.maxTitleCharacters = 21;
		$scope.maxMessageCharacters = 144;

		$scope.sortingMethods = [
			{ name: "Date",	value: "createdAt", icon: "ion-ios-calendar-outline" },
			{ name: "Popular", value: "totalCheers", icon: "ion-star" }
		];

		$scope.orderName = ($scope.order === "DESC" ? "ion-arrow-down-b" : "ion-arrow-up-b");

		$scope.displayPostComment = 0;
		$scope.togglePostComment = togglePostComment;

		$scope.refreshComments = refreshComments;
		$scope.postComment = postComment;

		$scope.deleteComment = deleteComment;
		$scope.checkPermission = checkPermission;

		vm.selfInfo = {};

		playerServices.getSelf().then(function(data) {
			vm.selfInfo = (data || apiServices.returnUnloggedUser());
			refreshComments();
		});

		function refreshComments(clear) {
			if ($scope.showCommentsParam) {
				if (clear === undefined || clear === true) { $scope.commentsList = []; }

				$timeout(function() {
					return commentsServices.getComments($scope.subjectType, $scope.subjectHash, vm.page, $scope.sort, $scope.order, $scope.perPage).then(function(data) {
						if (apiServices.statusError(data)) return false;

						$scope.commentsCount = data.data.count;
						$scope.commentsList = data.data.data;

						$timeout(function(){
							uiServices.uiMasonry(".comments", {
								itemSelector: ".parent-comment", columnWidth: ".parent-comment", percentPosition: true
							});
						}, 250);
					});
				}, 250);
			}
		}

		function deleteComment(comment) {
			return commentsServices.deleteComment(comment).then(function(data) { refreshComments(); });
		}

		function checkPermission(subject, poster) {
			var allowDeletion = false;
			allowDeletion = (function(selfInfo, subject, poster, v) {
				switch (v) {
					case "item": { return (selfInfo.hashField == poster); }
					case "upgrade": { return (selfInfo.hashField == poster); }
					case "intel": { return (selfInfo.hashField == poster); }
					case "player": { return ((selfInfo.hashField === poster) || (selfInfo.hashField === subject)); }
					case "pmc": {
						if (selfInfo.PMC) { return ((selfInfo.playerTier <= 2) && (selfInfo.PMC.hashField === subject)); }
						else { return false; }
					}
				}
			})(vm.selfInfo, subject, poster, $scope.subjectType);

			if (vm.selfInfo.playerPrivilege <= 2) allowDeletion = true;

			return allowDeletion;
		}

		$scope.changeOrder = function() {
			$scope.order = ($scope.order === "DESC" ? "ASC" : "DESC");
			$scope.orderName = ($scope.order === "DESC" ? "ion-arrow-down-b" : "ion-arrow-up-b");

			refreshComments();
		};

		$scope.changeSort = function(value) {
			if (value.value !== $scope.sort) {
				$scope.sort = value.value;
				$scope.currentIcon = value.icon;
				refreshComments();
			}
		};

		function postComment() {
			if ($scope.allowCommentsParam) {
				var results = commentsServices.validateComment(vm.commentTitle, $scope.maxTitleCharacters, vm.commentBody, $scope.maxMessageCharacters);

				$timeout(function() { $scope.currentPostError = ""; }, 6000);

				if (results[0] === false) {	$scope.currentPostError = results[1]; }
				else {
					commentsServices.postComment(vm.commentTitle, vm.commentBody, $scope.subjectHash, $scope.subjectType).then(function(data) {
						refreshComments(false);

						vm.commentTitle = "";
						vm.commentBody = "";
						togglePostComment();
					});
				}
			}
		}

		function togglePostComment() {
			var newScope = (($scope.displayPostComment === 0) ? 2 : 0),
				doDelay = (($scope.displayPostComment === 0) ? 150 : 250);

			$scope.displayPostComment = 1;
			$timeout(function() { $scope.displayPostComment = newScope; }, doDelay);
		}
	}

	function CommentsDirectiveFunction() {
		return {
			scope: {
				subjectType: "@",
				subjectHash: "=",
				perPage: "=",
				containerSize: "@",
				allowComments: "=",
				showComments: "="
			},
			restrict : "E",
			templateUrl: 'directive/comments.ejs',
			controller: CommentsDirectiveFunctions,
			controllerAs: "CommentsController"
		};
	}

	exports.function = CommentsDirectiveFunction;
})();