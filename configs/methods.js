(function() {
	'use strict';

	module.exports = {
		generateResponse:
			function(message, data, success) {
				this.header = 'Server response.';
				this.message = message || 'No message specified.';
				this.success = (success === undefined) ? true : success;
				this.count = (data ? (data.count || 0) : 0);
				this.data = ((data.rows || data) || '');
			},
		closeServer:
			function() {
				console.log("SERVER STOPPED.");
				process.exit(0);
			},
		openServer:
			function(app) {
				console.log('Express server listening on port ' + app.get('port') + '.');
			}
	}

})();