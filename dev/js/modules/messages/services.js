(function() {
	'use strict';

	MessagesServicesFunction.$inject = ["$timeout", "$filter", "apiServices", "alertsServices", "uiServices", "unitsServices", "navServices"];

	function MessagesServicesFunction($timeout, $filter, apiServices, alertsServices, uiServices, unitsServices, navServices) {

		var methods = {
			getReceivedMessagesSelf: getReceivedMessagesSelf,
			readSingleMessage: readSingleMessage,
			getSentMessagesSelf: getSentMessagesSelf,
			getReceivedInvitesSelf: getReceivedInvitesSelf,
			getSentInvitesSelf: getSentInvitesSelf,
			deleteMessage: deleteMessage,
			getReceivedOutfitInvitesSelf: getReceivedOutfitInvitesSelf,
			getSentOutfitInvitesSelf: getSentOutfitInvitesSelf,
			inviteNotification: inviteNotification,
			negotiationCancelled: negotiationCancelled,
			negotiationNotification: negotiationNotification,
			contractNotification: contractNotification,
			resolveInvite: resolveInvite,
			cancelInvite: cancelInvite,
			getInviteTarget: getInviteTarget,
			askDeleteMessage: askDeleteMessage,
			askResolveInvite: askResolveInvite,
			askCancelInvite: askCancelInvite,
			writeReply: writeReply,
			alignMessages: alignMessages
		};

		function getReceivedMessagesSelf(options) { return getMessages("player", "getReceivedMessagesSelf", options); }
		function getSentMessagesSelf(options) { return getMessages("player", "getSentMessagesSelf", options); }

		function getMessages(subject, fnc, qParams) {
			var apiURL = ("/api/" + subject + "actions/" + fnc + "/");
			return apiServices.getQuery(apiURL, (qParams || {}));
		}

		function readSingleMessage(hash) {
			return apiServices.requestGET({url: ("/api/generalactions/readMessage/" + hash), cache: true});
		}

		function deleteMessage(hash) {
			return apiServices.requestDELETE({url: ("/api/generalactions/deleteMessage/" + hash)});
		}

		function getReceivedInvitesSelf(options) { return getMessages("player", "getReceivedInvitesSelf", options); }
		function getSentInvitesSelf(options) { return getMessages("player", "getSentInvitesSelf", options); }

		function getReceivedOutfitInvitesSelf(options) { return getMessages("pmc", "getReceivedInvitesPMC", options); }
		function getSentOutfitInvitesSelf(options) { return getMessages("pmc", "getSentInvitesPMC", options); }

		function getInvites(subject, url, options) {
			var qPage = ((options.page !== undefined) ? ("?page=" + (options.page - 1)) : ""),
				qSort = ((options.sort !== undefined) ? ("&sort=" + options.sort) : ""),
				qOrder = ((options.order !== undefined) ? ("&order=" + options.order) : ""),
				qLimit = ((options.limit !== undefined) ? ("&limit=" + options.limit) : ""),
				request = {url: ("/api/" + subject + "actions/" + url + qPage + qSort + qOrder + qLimit), cache: false};
			return apiServices.requestGET(request);
		}

		function resolveInvite(hash) {
			return apiServices.requestPOST({url: ("/api/generalactions/resolveInvite/" + hash)});
		}

		function cancelInvite(hash) {
			return apiServices.requestPOST({url: ("/api/generalactions/deleteInvite/" + hash)});
		}

		function getInviteTarget(direction, invite) {
			var operatorObject = {target: "operator", folder: "players"},
				outfitObject = {target: "outfit", folder: "pmc"},
				rS = (direction === "received");

			return (function(invite) {
				switch(invite) {
					case "Request_PlayerPMC": { return (rS ? operatorObject : outfitObject); } break;
					case "Invite_PlayerPMC": { return (rS ? outfitObject : operatorObject); } break;
					case "Friends_Player": { return (rS ? operatorObject : operatorObject); } break;
					case "Friends_PMC": { return (rS ? outfitObject : outfitObject); } break;
					default: { return operatorObject; }
				}
			})(invite);
		}

		function askDeleteMessage(hash, _cb) {
			var
				modalOptions = {
					header: { text: 'Delete message?', icon: 'ion-trash-a' },
					body: {	text: 'Are you sure you want to delete this message?' },
					choices: {
						yes: { text: 'Do it', icon: 'ion-trash-a', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				},
				newModal = uiServices.createModal('GenericYesNo', modalOptions);
			newModal.result.then(function(choice) {
				if (choice) { deleteMessage(hash).then(function(data) {
					if (angular.isUndefined(data)) _cb(false);
					if (data) { alertsServices.addNewAlert("warning", "The message has been deleted."); }
					return _cb(data);
				});	} else { return _cb(false); }
			});
		}

		function inviteNotification(invite) {
			switch(invite.type) {
				case "Request_PlayerPMC": {
					return {
						title: ("Oufit application from: " + invite.A_Name),
						icon: ("images/avatars/players/thumb_" + invite.A_Hash + ".jpg"),
					};
				} break;
				case "Invite_PlayerPMC": {
					return {
						title: ("Outfit invitation from: " + invite.A_Name),
						icon: ("images/avatars/pmc/thumb_" + invite.A_Hash + ".jpg"),
					};
				} break;
				case "Friends_Player": {
					return {
						title: ("Friend request from: " + invite.A_Name),
						icon: ("images/avatars/players/thumb_" + invite.A_Hash + ".jpg"),
					};
				} break;
				case "Friends_PMC": {
					return {
						title: ("Alliance request from: " + invite.A_Name),
						icon: ("images/avatars/pmc/thumb_" + invite.A_Hash + ".jpg"),
					};
				} break;
				default: {
					return {
						title: "Generic invite."
					};
				}
			}
		}

		function negotiationNotification(data) {
			var isNew = (data.roundField === 1),
				isSender = (data.turnField === 0),
				title = (isNew ? "New Negotiation" : "Negotiation Updated (" + data.roundField + ")"),
				iconLists = ["images/avatars/players/thumb_", "images/avatars/pmc/thumb_"],
				icon = ((isSender ? (iconLists[data.turnField] + data.Freelancer.hashField + ".jpg") : (iconLists[data.turnField] + data.Outfit.hashField + ".jpg"))),

				missionFactions = ((data.sideField === data.Mission.FactionA.sideField) ? ["A", "B"] : ["B", "A"]),

				clientFaction = data.Mission["Faction" + missionFactions[0]],
				targetFaction = data.Mission["Faction" + missionFactions[1]],

				clientReward = ((data.Mission["reward" + missionFactions[0] + "Field"] * data.percentField) / 100),
				targetReward = ((data.Mission["reward" + missionFactions[1] + "Field"] * data.percentField) / 100)
			;

			return {
				title: title, icon: icon,
				body: [
					("INVITER: " + (data.Outfit.displaynameField) + " (" + data.Outfit.players.length + "/" + data.Outfit.sizeTier + ") " + data.Outfit.PMCPrestige + "★"),
					("MISSION: " + (data.Mission.nameField + " (" + data.Mission.Map.nameField + ")")),
					("OBJECTIVE: " + data.Mission.Objective.nameField + " [" + (_.fill(Array(data.Mission.difficultyField), "★")) + "]"),
					("CLIENT: " + clientFaction.nameField + " (" + apiServices.getSideName(clientFaction.sideField) + ")"),
					("REWARD: " + data.percentField + "% - " + "D$ " + $filter("number")(clientReward))
				].join("\n"),
				route: function() { return { route: "app.private.operations", params: { view: "negotiations" } }; }
			};
		}

		function contractNotification(data, selfInfo) {
			var isHiring = (data.ContractedId),
				title = (isHiring ? "Contract Formed" : "Contract Signed"),
				iconLists = ["images/avatars/players/thumb_", "images/modules/maps/thumb_"],

				icon = ((isHiring ? (iconLists[0] + data.Contracted.hashField + ".jpg") : (iconLists[1] + data.Mission.Map.classnameField + ".jpg"))),

				missionFactions = ((data.sideField === data.Mission.FactionA.sideField) ? ["A", "B"] : ["B", "A"]),

				clientFaction = data.Mission["Faction" + missionFactions[0]],
				targetFaction = data.Mission["Faction" + missionFactions[1]],

				clientReward = ((data.Mission["reward" + missionFactions[0] + "Field"] * data.percentField) / 100),
				targetReward = ((data.Mission["reward" + missionFactions[1] + "Field"] * data.percentField) / 100),

				rewardText = ("D$ " + $filter("number")(Math.floor(clientReward))),

				missionText = (data.Mission.nameField + " (" + data.Mission.Map.nameField + ")"),
				objectiveText = (data.Mission.Objective.nameField + " [" + (_.fill(Array(data.Mission.difficultyField), "★")) + "]"),
				clientText = (clientFaction.nameField + " (" + apiServices.getSideName(clientFaction.sideField) + ")"),

				body = [
					("MISSION: " + missionText),
					("OBJECTIVE: " + objectiveText),
					("CLIENT: " + clientText),
				]
			;

			if (isHiring) {
				var contractText,
					contracted = data.Contracted,
					employer = data.Employer,
					paymentText = (rewardText + " (" + data.percentField + "%)");

				if (selfInfo.PMC) {	contractText = ("FREELANCER: " + contracted.aliasField + " (" + contracted.playerPrestige + "★)"); }
				else { contractText = ("EMPLOYER: " + employer.displaynameField + " (" + employer.PMCPrestige + "★)"); }

				body.push(contractText);
				body.push("PAYMENT: " + paymentText);
			} else {
				body.push(("REWARD: " + rewardText));
			}

			return {
				title: title, icon: icon, body: body.join("\n"),
				route: function() { return { route: "app.private.operations", params: { view: "contracts" } }; }
			};
		}

		function negotiationCancelled() {
			return {
				title: "NEGOTIATION CANCELLED!",
				body: "A previously ongoing Contract negotiation has been cancelled.",
				icon: "images/bannedlogo.png",
				route: function() { return { route: "app.private.operations", params: { view: "negotiations" } }; }
			};
		}

		function askResolveInvite(invite, _cb) {
			var modalText = (function(invite) {
				switch(invite.type) {
					case "Request_PlayerPMC": { return {
						text: "Accept the application?",
						body: "If you accept this application, " + invite.A_Name + " will become a member of your " +
						"Outfit.", alert: invite.A_Name + " is now part of your Outfit."};} break;
					case "Invite_PlayerPMC": { return {
						text: "Accept the membership invitation?",
						body: "If you accept this invitation, you will become a part of " + invite.A_Name + ".",
						alert: "You have joined " + invite.A_Name + "."};} break;
					case "Friends_Player": { return {
						text: "Accept the friend request?",
						body: "If you accept this invitation, " + invite.A_Name + " will become your friend.",
						alert: "You are now friends with " + invite.A_Name + "."};} break;
					case "Friends_PMC": { return {
						text: "Accept alliance request?",
						body: "If you accept this invitation, " + invite.A_Name + " will become your allies.",
						alert: "You are now allied with " + invite.A_Name + "."};} break;
					default: { return {
						text: "Accept the friend request?",
						body: "If you accept this invitation, " + invite.A_Name + " will become your friend.",
						alert: "You are now friends with " + invite.A_Name + "."};}
				}
			})(invite);

			var
				modalOptions = {
					header: { text: modalText.text, icon: apiServices.getInviteIcon(invite.type) },
					body: {	text: modalText.body },
					choices: {
						yes: { text: 'Confirm', icon: 'ion-checkmark', class: 'btn-default' },
						no: { text: 'Cancel', icon: 'ion-arrow-left-c', class: 'btn-default' }
					}
				}, newModal = uiServices.createModal('GenericYesNo', modalOptions);

			newModal.result.then(function(choice) {
				if (choice) {
					resolveInvite(invite.hashField).then(function(data) {
						if (angular.isUndefined(data)) return _cb(false);
						if (data.data.success) {
							alertsServices.addNewAlert("success", modalText.alert);
							if (invite.type === "Invite_PlayerPMC") {
								$timeout(function() { apiServices.changeURL("/dashboard?page=outfit"); }, 1000);
							}
							navServices.callEvent("refreshMessageCount");
							return _cb(true);
						} else { return _cb(false); }
					});
				} else { return _cb(false); }
			});
		}

		function askCancelInvite(direction, invite, _cb) {
			var
			rS = (direction === "received"),
			cancelOptions = {
				text: "Cancel the Invite?", body: "Are you sure you want to cancel this invite?",
				alert: "The Invite has been canceled."
			},
			refuseOptions ={
				text: "Refuse the Invite?", body: "Are you sure you want to refuse this invite?",
				alert: "The Invite has been refused."
			},
			modalText = rS ? refuseOptions : cancelOptions,
			modalOptions = {
				header: { text: modalText.text, icon: 'ion-close' },
				body: {	text: modalText.body },
				choices: {
					yes: { text: 'Do it', icon: 'ion-close' },
					no: { text: 'Cancel', icon: 'ion-arrow-left-c' }
				}
			},
			newModal = uiServices.createModal('GenericYesNo', modalOptions);

			newModal.result.then(function(choice) {
				if (choice) {
					cancelInvite(invite.hashField).then(function(data) {
						if (data === undefined) return _cb(false);
						if (data.data.success) {
							alertsServices.addNewAlert("warning", modalText.alert);
							navServices.callEvent("refreshMessageCount");

							_cb(true);
						} else { _cb(false); }
					});
				} else { return _cb(false); }
			});
		}

		function writeReply(alias, title, hash) {
			return unitsServices.askSendMessage({alias: alias, hash: hash, suggestions: { title: ("RE: " + title) }});
		}

		function alignMessages(view) {
			var classesSelected = (view === "messages") ? ".message-object" : ".invite-object";
			uiServices.uiMasonry("#listed-objects", {
				itemSelector: classesSelected, columnWidth: classesSelected, percentPosition: true
			});
		}

		return methods;
	}

	exports.function = MessagesServicesFunction;
})();