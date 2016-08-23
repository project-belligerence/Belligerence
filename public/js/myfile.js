(function() {
	'use strict';

	var object = { 'a': 1, 'b': 2 };
	var ismatch = _.isMatch(object, { 'b': 2 });

	console.log(ismatch);

	console.log("We good.");
})();