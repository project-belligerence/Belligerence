(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Messages/Players Integration', function () {

		before('Deleting test entries...', function(done) {
			models.messages.destroy({where: {titleField: 'test_messagesplayer_message'}}).then(function() {
				models.players.destroy({where: {usernameField: 'test_messageplayer_receiver'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_messageplayer_sender'}}).then(done());
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.messages.destroy({where: {titleField: 'test_messagesplayer_message'}}).then(function() {
				models.players.destroy({where: {usernameField: 'test_messageplayer_receiver'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_messageplayer_sender'}}).then(done());
				});
			});
		});

		it('Creates test Sender', function (done) {
			var newPlayer = {
				username: "test_messageplayer_sender",
				password: "testpassword",
				alias: "Unknown User",
				email: "testuser@testuser.com",
				bio: "Just a test user without a background.",
				contract: "Soldier",
			};

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.sender = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(10);
					done();
				});
		});

		it('Creates test Receiver', function (done) {
			var newPlayer = {
				username: "test_messageplayer_receiver",
				password: "testpassword",
				alias: "Unknown User",
				email: "testuser@testuser.com",
				bio: "Just a test user without a background.",
				contract: "Soldier",
			};

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.receiver = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(10);
					done();
				});
		});

		it('authenticates the Sender and returns a token', function (done) {
			var newPlayer = {
				username: "test_messageplayer_sender",
				password: "testpassword"
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.sender.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.sender.hashField);
					done();
				});
		});

		it('authenticates the Receiver and returns a token', function (done) {
			var newPlayer = {
				username: "test_messageplayer_receiver",
				password: "testpassword"
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.receiver.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.receiver.hashField);
					done();
				});
		});

		it('FAILS: sends a message to yourself', function (done) {
			var newMessage = {
				title: "test_messagesplayer_message",
				body: "body of the message",
				receiver: testVar.sender.hashField
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.sender.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.message.should.equal("You wouldn't want to send a message to yourself.");
					res.body.success.should.be.false();
					done();
				});
		});

		it('FAILS: invalid receiver', function (done) {
			var newMessage = {
				title: "test_messagesplayer_message",
				body: "body of the message",
				receiver: testVar.sender.hashField + "999"
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.sender.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.message.should.equal('Invalid players.');
					res.body.success.should.be.false();
					done();
				});
		});

		it('Sends a new message and associates it with the previous players', function (done) {
			var newMessage = {
				title: "test_messagesplayer_message_old",
				body: "body of the message",
				receiver: testVar.receiver.hashField
			};

			request(app)
				.post('/api/messages')
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.sender.token)
				.end(function(err, res) {
					if (err) console.log(err);
					testVar.message = res.body.data;
					res.body.success.should.be.true();
					res.body.data.ReceiverId.should.equal(testVar.receiver.id);
					res.body.data.SenderId.should.equal(testVar.sender.id);
					done();
				});
		});

		it('FAILS: attempts to edit the message without being the sender', function (done) {
			var newMessage = {
				title: "test_messagesplayer_message",
				body: "body of the message"
			};

			request(app)
				.put('/api/messages/' + testVar.message.hashField)
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.receiver.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.message.should.equal(config.messages.bad_permission);
					res.body.success.should.be.false();
					done();
				});
		});

		it('Edits the message as the sender', function (done) {
			var newMessage = {
				title: "test_messagesplayer_message",
				body: "body of the message"
			};

			request(app)
				.put('/api/messages/' + testVar.message.hashField)
				.send(newMessage)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.sender.token)
				.end(function(err, res) {
					if (err) console.log(err);
					testVar.message = res.body.data;
					res.body.message.should.equal(config.messages.entry_updated(testVar.message.hashField));
					res.body.success.should.be.true();
					done();
				});
		});

		it('Returns a single message which is marked as already read', function (done) {
			request(app)
				.get('/api/messages/' + testVar.message.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.receiver.token)
				.end(function(err, res) {
					res.body.success.should.be.true();
					res.body.data.read.should.equal(true);
					done();
				});
		});

		it('Returns the sent messages', function (done) {
			request(app)
				.get('/api/messages/sent')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.sender.token)
				.end(function(err, res) {
					res.body.success.should.be.true();
					var message = res.body.data[0];
					message.title.should.equal(testVar.message.titleField);
					message.hash.should.equal(testVar.message.hashField);
					message.sender.hashField.should.equal(testVar.sender.hashField);
					message.receiver.hashField.should.equal(testVar.receiver.hashField);
					done();
				});
		});

		it('Returns the received messages', function (done) {
			request(app)
				.get('/api/messages/received')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.receiver.token)
				.end(function(err, res) {
					res.body.success.should.be.true();
					var message = res.body.data[0];
					message.title.should.equal(testVar.message.titleField);
					message.hash.should.equal(testVar.message.hashField);
					message.sender.hashField.should.equal(testVar.sender.hashField);
					message.receiver.hashField.should.equal(testVar.receiver.hashField);
					done();
				});
		});
	});

})();