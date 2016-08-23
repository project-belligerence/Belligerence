(function() {
	'use strict';

	var object = { 'a': 1, 'b': 2 };
	var ismatch = _.isMatch(object, { 'b': 2 });

	console.log("Should it be: " + ismatch + "?");

	console.log("Now we get it.");

	require('./myfile');
})();