(function() {
	'use strict';

	APIFilters.$inject = [];

	function APIFilters() {

		var kebabCase = function() {
			return function(input) { return _.kebabCase(input); };
		};

		var filters = {
			kebabCase: kebabCase
		};

		return filters;
	}

	module.exports = APIFilters;
})();