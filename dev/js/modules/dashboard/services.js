(function() {
	'use strict';

	DashboardServicesFunction.$inject = ["$timeout", "$q", "$templateRequest", "apiServices", "alertsServices", "Upload"];

	function DashboardServicesFunction($timeout, $q, $templateRequest, apiServices, alertsServices, Upload) {

		var methods = {
			loadNewView: loadNewView,
			menuItem: menuItem,
			statsItem: statsItem,
			callThemOut: callThemOut,
			editFieldPlayer: editFieldPlayer,
			editPMCTierNames: editPMCTierNames,
			editFieldPMC: editFieldPMC,
			uploadAvatar: uploadAvatar,
			uploadPMCAvatar: uploadPMCAvatar
		};

		var validationForm = {
			alias: [ { library: validator, func: 'isLength', params: { min: 3, max: 32} } ],
			tierNames: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
			displayname: [ { library: validator, func: 'isLength', params: { min: 3, max: 32} } ],
			motto: [ { library: validator, func: 'isLength', params: { min: 3, max: 128} } ],
			bio: [ { library: validator, func: 'isLength', params: { min: 1, max: 255} } ],
			location: [ { library: validator, func: 'isLength', params: { min: 1, max: 32} } ],
			email:  [ { library: validator, func: 'isLength', params: { min: 1, max: 32} },
		 			  { library: validator, func: 'isEmail', params: {} }
				 	]
		};

		function loadNewView(view) { return $templateRequest('dashboard/' + view + '.ejs', function(e) { return false; }); }

		function menuItem(text, icon, fnc) {
			return {
				text: text,
				icon: ("ion-" + icon),
				f: fnc
			};
		}

		function statsItem(text, icon, value) {
			return {
				text: text,
				icon: ("ion-" + icon),
				value: value
			};
		}

		function uploadAvatar(dataUrl, name, _cb) {
			function resolveUpload(response) { $timeout(function () { return _cb(response.data); }, 0);	}
			function eventStep(evt) { /* $scope.progress = parseInt(100.0 * evt.loaded / evt.total); */ }

			Upload.upload({
				url: '/api/playeractions/uploadPlayerAvatar',
				headers: { 'x-access-session-token': apiServices.getToken()	},
				data: {	avatar_picture: Upload.dataUrltoBlob(dataUrl, name)	},
			}).then(resolveUpload, function (response) {}, eventStep);
		}

		function uploadPMCAvatar(dataUrl, name, _cb) {
			function resolveUpload(response) { $timeout(function () { return _cb(response.data); }, 0);	}
			function eventStep(evt) { /* $scope.progress = parseInt(100.0 * evt.loaded / evt.total); */ }

			Upload.upload({
				url: '/api/pmcactions/uploadPMCAvatar',
				headers: { 'x-access-session-token': apiServices.getToken()	},
				data: {	avatar_picture: Upload.dataUrltoBlob(dataUrl, name)	},
			}).then(resolveUpload, function (response) {}, eventStep);
		}

		function editField(api, field, value) {
			function handleFailure(v) {	dfd.reject(v); }
			function handleSuccess(v) {
				alertsServices.addNewAlert("success", "Updated successfully.");
				dfd.resolve(v);
			}

			var
				dfd = $q.defer(),
				request = {
					url: api,
					data: {}
				};

			request.data[field] = value;

			if (value === "") return dfd.reject(value);

			if (apiServices.validateParams(value, validationForm[field])) {
				apiServices.requestPUT(request).then(function(data) {
					if (data.data.success) handleSuccess(value);
					else handleFailure(value);
				});
			} else { handleFailure(value); }

			return dfd.promise;
		}

		function editFieldPlayer(field, value) { return editField("/api/playeractions/updateSelf", field, value); }
		function editFieldPMC(field, value) { return editField("/api/pmcactions/editSelfPMC", field, value); }

		function editPMCTierNames(field, value, index) {
			function handleFailure(v) {	dfd.reject(v); }
			function handleSuccess(v) {
				alertsServices.addNewAlert("success", "Updated successfully.");
				dfd.resolve(v);
			}

			var
				dfd = $q.defer(),
				request = {
					url: "/api/pmcactions/editSelfPMC",
					data: {}
				};

			request.data[field] = value;

			if (value === "") return dfd.reject(value);

			if (apiServices.validateParams(value[index], validationForm[field])) {
				apiServices.requestPUT(request).then(function(data) {
					if (data.data.success) handleSuccess(value);
					else handleFailure(value);
				});
			} else { handleFailure(value); }

			return dfd.promise;
		}

		function callThemOut() {
			return $timeout(function() {
				return "This is working, cool.";
			}, 0);
		}

		return methods;
	}

	exports.function = DashboardServicesFunction;
})();