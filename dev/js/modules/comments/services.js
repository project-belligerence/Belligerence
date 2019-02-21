(function() {
	'use strict';

	CommentsServicesFunction.$inject = ["apiServices"];

	function CommentsServicesFunction(apiServices) {

		var methods = {
			getComments: getComments,
			validateComment: validateComment,
			postComment: postComment,
			deleteComment: deleteComment
		};

		function getComments(type, subject, page, sort, order, limit) {
			var qPage = ((page !== undefined) ? ("?commentPage=" + (page - 1)) : ""),
				qSort = ((sort !== undefined) ? ("&commentSort=" + sort) : ""),
				qOrder = ((order !== undefined) ? ("&commentOrder=" + order) : ""),
				qLimit = ((limit !== undefined) ? ("&commentLimit=" + limit) : ""),
				request = {url: ("/api/generalactions/getComments/" + type + "/" + subject + qPage + qSort + qOrder + qLimit), cache: false};

			return apiServices.requestGET(request);
		}

		function validateComment(currentTitle, maxTitleCharacters, currentMessage, maxMessageCharacters) {
			var titleCharactersLeft = (maxTitleCharacters - currentTitle.length),
				messageCharactersLeft = (maxMessageCharacters - currentMessage.length);

			if (((titleCharactersLeft >= 0) && (messageCharactersLeft >= 0)) &&	((messageCharactersLeft !== maxMessageCharacters))) {
				return [true, ""];
			} else {
				var currentError = (function(titleLeft, messageLeft, maxTitle, maxMessage) {
					switch (true) {
						case (titleLeft < 0): { return "Your title cannot be longer than " + maxTitle + " characters!"; } break;
						case (messageLeft < 0): { return "Your message cannot be longer than " + maxMessage + " characters!"; } break;
						case (messageLeft === maxMessage): { return "Your message body cannot be empty."; } break;
						default: { return "Please format your message properly."; }
					}
				})(titleCharactersLeft, messageCharactersLeft, maxTitleCharacters, maxMessageCharacters);

				return [false, currentError];
			}
		}

		function postComment(title, body, subject, type) {
			return apiServices.requestPOST({
				url: "/api/generalactions/postComment",
				data: { "title": title,	"body": body, "subject": subject, "type": type }
			});
		}

		function deleteComment(comment) {
			return apiServices.requestPOST({url: "/api/generalactions/deleteComment", data: { "comment": comment }});
		}

		return methods;
	}

	exports.function = CommentsServicesFunction;
})();