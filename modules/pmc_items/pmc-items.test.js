(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Item/PMC Integration', function () {

		before('Deleting test entries...', function(done) {
			models.pmc.destroy({where: {displaynameField: 'test_itempmc_pmc'}}).then(function(){
				models.items.destroy({where: {nameField: 'test_itempmc_item'}}).then(function(){
					models.players.destroy({where: {usernameField: 'test_itempmc_player'}}).then(done());
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.pmc.destroy({where: {displaynameField: 'test_itempmc_pmc'}}).then(function(){
				models.items.destroy({where: {nameField: 'test_itempmc_item'}}).then(function(){
					models.players.destroy({where: {usernameField: 'test_itempmc_player'}}).then(done());
				});
			});
		});

		it('Creates test Item', function (done) {
			var newItem = { name: "test_itempmc_item" };

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

		it('creates a new PMC', function (done) {

			var newPMC = {
				displayname: "test_itempmc_pmc",
				motto: "we are the best!",
				tiernames: ""
			};

			request(app)
				.post('/api/pmc')
				.send(newPMC)
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.pmc = res.body.data;
					res.body.success.should.be.true();
					res.body.data.displaynameField.should.equal(newPMC.displayname);
					done();
				});
		});

		it('creates a new test leader of a PMC', function (done) {
			var newPlayer = {
				username: "test_itempmc_player",
				password: "testpassword",
				alias: "Unknown User",
				TEST_tier: "0"
			};

			request(app)
				.post('/api/players/admin')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.player = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(0);
					done();
				});
		});

		it('Adds the player to the PMC.', function (done) {
			var newPlayer = {
				player: testVar.player.hashField,
				pmc: testVar.pmc.hashField
			};

			request(app)
				.post('/api/players/set/pmc')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.message.should.equal('Player has been added to the PMC.');
					done();
				});
		});

		it('authenticates the player and returns a token', function (done) {
			var newPlayer = {
				username: "test_itempmc_player",
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

		it('FAILS: Adds the item to the PMC inventory as regular user.', function (done) {
			var newItem = {
				item: testVar.item.hashField,
				pmc: testVar.pmc.hashField,
				amount: 5
			};

			request(app)
				.post('/api/items/pmc')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('Adds the item to the PMC inventory.', function (done) {
			var newItem = {
				item: testVar.item.hashField,
				pmc: testVar.pmc.hashField,
				amount: 5
			};

			request(app)
				.post('/api/items/pmc')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('FAILS: cant get items as a regular, unrelated user.', function (done) {
			request(app)
				.get('/api/items/pmc/' + testVar.pmc.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					done();
				});
		});

		it('Item should be there', function (done) {
			request(app)
				.get('/api/items/pmc/' + testVar.pmc.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data[0].nameField.should.equal(testVar.item.nameField);
					done();
				});
		});
	});

})();