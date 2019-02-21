(function() {
	'use strict';
	/* jshint validthis: true */

	exports.init = InitializeWebsocketServer;
	exports.broadcastEvent = broadcastEvent;
	exports.registerEvent = registerEvent;
	exports.WebsocketEventObject = WebsocketEventObject;

	var WebSocket = require('ws'),
		ACTIVE_CONNECTIONS = {},
		EVENT_LIST = {},
		FRONT_END_SESSION_TOKEN = process.env.FRONT_END_SESSION_TOKEN;

	function InitializeWebsocketServer(server) {
		var wss = new WebSocket.Server({ server: server, clientTracking: true });
		wss.on("connection", handleWebsocketConnection);
		initializeCheckConnectionLoop();
	}

	function handleWebsocketConnection(ws, req) {
		var socketParams = parseSocket(req);
		if (socketParams.listener) registerWebsocketEventListener(ws, req, socketParams);
	}

	function registerWebsocketEventListener(ws, req, params) {
		var ListenerEvent = getWebsocketEvents(params.listener);

		if (ListenerEvent) {
			registerClientConnection(params, ws, req);

			ws.on("close", (ListenerEvent.close || handleClosedConnections));
			ws.on("pong", (ListenerEvent.pong || connectionHeartbeat));
			ws.on("message", function(message) {
				var API = require('./../routes/api.js'),
					parsedMessage = (API.methods.isValidJSON(message) ? JSON.parse(message) : false);
				if (parsedMessage) return ListenerEvent.message(ws, req, parsedMessage);
			});
		}
	}

	function broadcastEvent(event, params) {
		var broadcastData = joinParams(event, params);

		for (var key in ACTIVE_CONNECTIONS[event]) {
			if (ACTIVE_CONNECTIONS[event].hasOwnProperty(key)) {
				var currentClient = ACTIVE_CONNECTIONS[event][key],
					listenerParams = currentClient.listenerParams;

				if (clientReady(currentClient)) {
					validateClient(event, currentClient, broadcastData).then(
						EVENT_LIST[event].handleSuccess, EVENT_LIST[event].handleFailure
					);
				}
			}
		}
		function joinParams(event, params) { return (params ? (event + ":" + (require("lodash").join(params, ":"))) : event); }
		function clientReady(client) { return (client.readyState === WebSocket.OPEN); }
		function validateClient(event, client, data) { return EVENT_LIST[event].validate(client, data); }
	}

	function registerClientConnection(params, client, request) {
		var _ = require("lodash"),
			listener = params.listener;
		if (!ACTIVE_CONNECTIONS[listener]) ACTIVE_CONNECTIONS[listener] = {};

		client.isAlive = true;
		client.listenerParams = _.omit(params, ["listener"]);
		client.listenerParams.token = socketToken(request, FRONT_END_SESSION_TOKEN);

		ACTIVE_CONNECTIONS[listener][client.listenerParams.token] = client;

		console.log("=============== NEW CONNECTION -", "ID:", client.listenerParams.token, "| LISTENER:", listener, "(" + Object.keys(ACTIVE_CONNECTIONS[listener]).length  + ")");
	}

	function handleClosedConnections() {
		for (var key1 in ACTIVE_CONNECTIONS) {
			if (ACTIVE_CONNECTIONS.hasOwnProperty(key1)) {
				for (var key2 in ACTIVE_CONNECTIONS[key1]) {
					if (ACTIVE_CONNECTIONS[key1].hasOwnProperty(key2)) {
						if (!ACTIVE_CONNECTIONS[key1][key2].isAlive) {
							ACTIVE_CONNECTIONS[key1][key2].terminate();
							delete ACTIVE_CONNECTIONS[key1][key2];
						} else {
							ACTIVE_CONNECTIONS[key1][key2].isAlive = false;
							ACTIVE_CONNECTIONS[key1][key2].ping(noop);
						}
					}
				}
			}
		}
		function noop(){}
	}

	function WebsocketEventObject(params) {
		params = (params || {});
		return {
			message: (params.message || defaultMessage),
			validate: (params.validate || defaultValidation),
			handleSuccess: (params.handleSuccess || defaultHandleSuccess),
			handleFailure: (params.handleFailure || defaultHandleFailure)
		};
		function defaultMessage(ws, req, message) { ws.send(message.data); }
		function defaultValidation(client, data) {
			return new Promise(function(resolve, reject) { resolve({ client: client, data: data}); });
		}
		function defaultHandleSuccess(r) { r.client.send(r.data); }
		function defaultHandleFailure() {}
	}

	function registerEvent(event, object) {
		console.log("======== REGISTERED EVENT: ", event);
		EVENT_LIST[event] = object;
	}
	function getWebsocketEvents(event) { return (EVENT_LIST[event] || false); }
	function initializeCheckConnectionLoop() { setInterval(handleClosedConnections, 30000); }
	function parseSocket(req) { return require('url').parse(req.url, true).query; }
	function socketId(req) { return req.headers['sec-websocket-key']; }
	function socketToken(req, token) {
		if (!req.headers.cookie) return null;

		var cookies = req.headers.cookie,
			cookiesArray = cookies.split("="),
			rObj = {}, i, _ = require("lodash");

		for (i = cookiesArray.length - 1; i >= 0; i--) {
			cookiesArray[i] = cookiesArray[i].split(";");
			for (var j = cookiesArray[i].length - 1; j >= 0; j--) { cookiesArray[i][j] = cookiesArray[i][j].trim(); }
		}

		cookiesArray = _.flattenDeep(cookiesArray);
		for (i = cookiesArray.length - 1; i >= 0; i--) { if (i % 2 === 0) rObj[cookiesArray[i]] = cookiesArray[i+1]; }

		return rObj[token];
	}
	function connectionHeartbeat() { this.isAlive = true; }
})();