(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		config   = require('./../../config.js'),
		testVar  = {};

	describe('Messages Model', function () {
		it('returns the Messages model', function () {
			expect(models.messages).to.be.ok();
		});

		it('returns all messages', function(done) {
			request(app).get('/api/messages')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.true();
				done();
			});
		});

		it('FAILS: returns all messages as user', function(done) {
			request(app).get('/api/messages')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.user)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.false();
				done();
			});
		});

		it('FAILS: invalid parameters', function (done) {
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
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('FAILS: sender does not exist', function (done) {
			var newMessage = {
				title: "test_message",
				body: "body of the message",
				receiver: "132abc"
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					res.body.success.should.be.false();
					res.body.message.should.equal('Invalid players.');
					done();
				});
		});

	});

})();