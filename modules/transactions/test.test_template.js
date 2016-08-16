(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		config   = require('./../../config.js'),
		models   = require('./../index.js').getModels(),
		mainModel = models.myModel,
		mainModelName = 'Template',
		mainModelAPI = 'template',
		testVar  = {};

		before('Deleting test entries...', function(done) {
			mainModel.destroy({where: {titleField: 'test_message'}}).then(function() { done(); });
		});

		after('Done testing, cleaning up...', function(done) {
			mainModel.destroy({where: {titleField: 'test_message'}}).then(function() { done(); });
		});

	describe(mainModelName + ' Model', function () {
		it('returns the ' + mainModelName + ' model', function () {
			expect(mainModel).to.be.ok();
		});

		it('returns all ' + mainModelName, function(done) {
			request(app).get('/api/'+mainModelAPI)
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.expect(200, done);
		});

		it('POST FAIL: invalid parameters', function (done) {
			var newMessage = {
				wrong_title: "test_message"
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					res.body.success.should.be.false();
					done();
				});
		});

		it('POST FAIL: sender does not exist', function (done) {
			var newMessage = {
				title: "test_message",
				body: "body of the message",
				sender: "123abc",
				receiver: "132abc"
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					res.body.success.should.be.false();
					done();
				});
		});

	});

})();