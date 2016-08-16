(function() {

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		config   = require('./../../config.js'),
		testVar  = {};

	describe('Player model', function () {

		before('Deleting test entries...', function(done) {
			models.players.destroy({where: {usernameField: 'test_player'}}).then(done());
		});

		after('Done testing, cleaning up...', function(done) {
			models.players.destroy({where: {usernameField: 'test_player'}}).then(done());
		});

		it('returns the player model', function () {
			expect(models.players).to.be.ok();
		});

		it('FAILS: returns all players as user', function(done) {
			request(app).get('/api/players')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.user)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.false();
				res.body.message.should.equal(config.messages().bad_permission);
				done();
			});
		});

		it('returns all players', function(done) {
			request(app).get('/api/players')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.true();
				done();
			});
		});

		it('FAILS: creates a new player with invalid username', function (done) {
			var newPlayer = { invalid_username: "test_player" };

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('FAILS: creates a new player with invalid password', function (done) {
			var newPlayer = { username: "test_player", invalid_password: "password" };

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('creates a new player', function (done) {
			var newPlayer = {
				username: "test_player",
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
					testVar.player = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(10);
					done();
				});
		});

		it('returns that player', function (done) {
			request(app)
				.get('/api/players/' + testVar.player.hashField)
				.set('Accept', 'application/json')
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal('Unknown User');
					done();
				});
		});

		it('authenticates the player and returns a token', function (done) {
			var newPlayer = {
				username: "test_player",
				password: "testpassword"
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.player.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.player.hashField);
					done();
				});
		});

		it('Player is able to get his own data.', function (done) {
			request(app)
				.get('/api/players/get/self')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal('Unknown User');
					res.body.data.bioField.should.equal('Just a test user without a background.');
					done();
				});
		});

		it('FAILS: updates player details with a malformed token', function (done) {
			var update =  { bio: 'foo', contract: 'bar', currentPassword: 'testpassword' };

			request(app)
				.put('/api/players/' + testVar.player.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', "123")
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal('jwt malformed');
					done();
				});
		});

		it('FAILS: updates player details as different token', function (done) {
			var update =  { bio: 'foo', contract: 'bar', currentPassword: 'testpassword' };

			request(app)
				.put('/api/players/' + testVar.player.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('FAILS: updates player password with the wrong passwod', function (done) {
			var update =  { bio: 'foo', contract: 'bar', newPassword: 'new_testpasswrod', currentPassword: 'foobar' };

			request(app)
				.put('/api/players/' + testVar.player.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal('Invalid password.');
					done();
				});
		});

		it('updates player details with correct password and succeeds on changing password', function (done) {
			var update =  { contract: 'foobar', currentPassword: 'testpassword', newPassword: 'new_testpassword' };

			request(app)
				.put('/api/players/' + testVar.player.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.contractType.should.equal('foobar');
					done();
				});
		});
	});

})();