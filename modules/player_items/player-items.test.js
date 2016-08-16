(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Item/Player Integration', function () {

		before('Deleting test entries...', function(done) {
			models.players.destroy({where: {usernameField: 'test_itemplayer_player'}}).then(function() {
				models.items.destroy({where: {nameField: 'test_itemplayer_item'}}).then(done());
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.players.destroy({where: {usernameField: 'test_itemplayer_player'}}).then(function() {
				models.items.destroy({where: {nameField: 'test_itemplayer_item'}}).then(done());
			});
		});

		it('Creates test Item', function (done) {
			var newItem = { name: "test_itemplayer_item" };

			request(app)
				.post('/api/items')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.item = res.body.data;
					res.body.success.should.be.true();
					done();
				});
		});

		it('creates a new test Player', function (done) {
			var newPlayer = {
				username: "test_itemplayer_player",
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

		it('authenticates the player and returns a token', function (done) {
			var newPlayer = {
				username: "test_itemplayer_player",
				password: "testpassword"
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.player.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.player.hashField);
					done();
				});
		});

		it('FAILS: Adds the item to the player inventory as regular user.', function (done) {
			var newItem = {
				item: testVar.item.hashField,
				player: testVar.player.hashField,
				amount: 5
			};

			request(app)
				.post('/api/items/player')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('Adds the item to the player inventory.', function (done) {
			var newItem = {
				item: testVar.item.hashField,
				player: testVar.player.hashField,
				amount: 5
			};

			request(app)
				.post('/api/items/player')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('Item should be there', function (done) {
			request(app)
				.get('/api/items/player/' + testVar.player.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data[0].nameField.should.equal(testVar.item.nameField);
					done();
				});
		});
	});

})();