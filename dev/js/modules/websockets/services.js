(function() {
	'use strict';

	WebsocketsServicesFunction.$inject = ["$websocket", "$state", "$location", "$q", "$timeout", "apiServices"];

	function WebsocketsServicesFunction($websocket, $state, $location, $q, $timeout, apiServices) {

		var methods = {
			initializeConnection: initializeConnection,
			registerEvent: registerEvent,
			broadcast: broadcast,
			initCtrlWS: initCtrlWS,
			joinFilter: joinFilter
		},
		NOTIFICATIONS_ENABLED = false,
		WEBSOCKET_EVENTS = [];

		if (apiServices.isValidBrowser()) {
			webNotificationAPI.requestPermission(function(r) { NOTIFICATIONS_ENABLED = r; });
		}

		function initializeConnection(listener, data) {

			function formWebsocketUrl(location, query) {
				var host = location.host(), port = location.port(),
					addr = ("wss://" + host + ":" + port + "/" + query);
				return addr;
			}

			if (false) {
				if (!NOTIFICATIONS_ENABLED) return false;

				try {
					if (!listener) throw("Invalid websocket parameters.");

					var listenerObj = { listener: listener },
						dataV = (data ? data : {}),
						finalQuery = apiServices.generateQueryFromState(_.merge(listenerObj, dataV), "", [], true),
						fUrl = formWebsocketUrl($location, finalQuery),
						ws = $websocket(fUrl);
					ws.initialTimeout = 5000;
					ws.maxTimeout = 5000;
					ws.reconnectIfNotNormalClose = true;

					return ws;
				} catch(e) { console.error(e); }
			}
		}

		function initCtrlWS(scope, sockets) {
			if (false) {
				if (!NOTIFICATIONS_ENABLED) return false;

				var ctrlSockets = sockets;

				return $q(function(resolve, reject) {
					Object.keys(ctrlSockets).forEach(function(key) {

						if (ctrlSockets.hasOwnProperty(key)) {
							var socket = ctrlSockets[key],
								fullEvent = (ctrlSockets[key].filter ? ctrlSockets[key].filter() : key),
								filterV = (socket.filter ? socket.filter() : "");

							if (!(apiServices.inArray(fullEvent, WEBSOCKET_EVENTS))) {
								socket.ws = initializeConnection(key, socket.socketData);
								socket.ws._normalCloseCode = 1005;

								registerEvent(socket.ws, "onMessage", socket.onMessage, filterV);

								if (socket.notification) {
									registerEvent(socket.ws, "onMessage", function() { return callNotification(socket); }, filterV);
								}

								scope.$on("$destroy", function() {
									WEBSOCKET_EVENTS = _.without(WEBSOCKET_EVENTS, fullEvent);
									socket.ws.close();
								});

								WEBSOCKET_EVENTS.push(joinFilter([fullEvent]));
							}
						}
					});
					return resolve(ctrlSockets);
				});
			}
		}

		function callNotification(socket) {
			var dataCb = (socket.notificationData || apiServices.nullCbFunction);
			dataCb(function(data) { if (data) return notificationObject(socket.notification(data)); });
		}

		function notificationObject(params) {
			var settings = {
				title: (params.title || "Notification"),
				body: (params.body || ""),
				icon: (params.icon || "images/belligerence-logo-small.png"),
				duration: (params.duration || 1),
				onClick: function() {
					if (params.route) {
						var route = params.route();
						return $state.go(route.route, (route.params || {}));
					} else { return (params.onClick() || function(){}); }
				}
			};

			if ((NOTIFICATIONS_ENABLED || webNotificationAPI.permissionGranted)) {
				webNotificationAPI.showNotification(settings.title, {
					icon: settings.icon,
					body: settings.body,
					onClick: settings.onClick,
					autoClose: settings.duration
				}, function onShow(e) { if (e) window.alert('Unable to show notification: ' + e.message); });
			}
		}

		function registerEvent(ws, event, fnc, filter) { return ws[event](fnc, { filter: filter }); }

		function broadcast(ws, data) { if (ws.readyState === 1) ws.send({data: data}); }

		function joinFilter(filters) {
			var fFilter = "";
			for (var i = 0; i <= (filters.length - 1); i++) {
				fFilter += filters[i];
				if (i < (filters.length - 1)) fFilter += ":";
			}
			return fFilter;
		}

		return methods;
	}

	exports.function = WebsocketsServicesFunction;
})();