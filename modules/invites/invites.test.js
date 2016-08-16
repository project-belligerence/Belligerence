(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		mainModel = models.invites,
		config   = require('./../../config.js'),
		mainModelName = 'Invites',
		mainModelAPI = 'invites',
		testVar  = {};

	describe(mainModelName + ' Model', function () {

		it('returns the ' + mainModelName + ' model', function () {
			expect(mainModel).to.be.ok();
		});

		it('returns all ' + mainModelName, function(done) {
			request(app)
			.get('/api/'+ mainModelAPI)
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.true();
				done();
			});
		});

	});

})();