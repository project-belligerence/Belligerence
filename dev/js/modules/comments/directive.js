(function() {
	'use strict';

	CommentsDirectiveFunctions.$inject = ["$scope", "$timeout", "apiServices", "commentsServices", "playerServices"];

	function CommentsDirectiveFunctions($scope, $timeout, apiServices, commentsServices, playerServices) {
		var vm = this;

		$scope.page = 0;
		$scope.sort = "createdAt";
		$scope.order = "DESC";

		$scope.perPage = ($scope.perPage === undefined ? 4 : $scope.perPage);

		$scope.currentIcon = "ion-ios-calendar-outline";

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
			console.log(vm.selfInfo);
			refreshComments();
		});

		function refreshComments(clear) {
			if (clear === undefined || clear === true) {
				$scope.commentsList = [];
			}

			$timeout(function() {
				return commentsServices.getComments($scope.subjectType, $scope.subjectHash, $scope.page, $scope.sort, $scope.order, $scope.perPage).then(function(data) {
					if (apiServices.statusError(data)) return false;

					$scope.commentsCount = data.data.count;
					$scope.commentsList = data.data.data;
					console.log("Comments: ", $scope.commentsList);
				});
			}, 250);
		}

		function deleteComment(comment) {
			console.log(comment);
			return commentsServices.deleteComment(comment).then(function(data) { refreshComments(); });
		}

		function checkPermission(subject, poster) {
			return ((vm.selfInfo.playerPrivilege <= 2) || (vm.selfInfo.hashField === subject) || (vm.selfInfo.hashField === poster));
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
			var results = commentsServices.validateComment(vm.commentTitle, $scope.maxTitleCharacters, vm.commentBody, $scope.maxMessageCharacters);

			$timeout(function() { $scope.currentPostError = ""; }, 6000);

			if (results[0] === false) {
				$scope.currentPostError = results[1];
			} else {
				commentsServices.postComment(vm.commentTitle, vm.commentBody, $scope.subjectHash, $scope.subjectType).then(function(data) {
					console.log(data);

					refreshComments(false);

					vm.commentTitle = "";
					vm.commentBody = "";
					togglePostComment();
				});
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
				perPage: "="
			},
			restrict : "E",
			templateUrl: 'directive/comments.ejs',
			controller: CommentsDirectiveFunctions,
			controllerAs: "CommentsController"
		};
	}

	exports.function = CommentsDirectiveFunction;
})();