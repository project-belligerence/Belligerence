(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Upgrade/Player Integration', function () {

		before('Deleting test entries...', function(done) {
			models.players.destroy({where: {usernameField: 'test_upgradeplayer_player'}}).then(function() {
				models.upgrades.destroy({where: {nameField: 'test_upgradeplayer_upgradepmc'}}).then(function() {
					models.upgrades.destroy({where: {nameField: 'test_upgradeplayer_upgrade'}}).then(done());
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.players.destroy({where: {usernameField: 'test_upgradeplayer_player'}}).then(function() {
				models.upgrades.destroy({where: {nameField: 'test_upgradeplayer_upgradepmc'}}).then(function() {
					models.upgrades.destroy({where: {nameField: 'test_upgradeplayer_upgrade'}}).then(done());
				});
			});
		});

		it('Creates test Player Upgrade', function (done) {
			var newUpgrade = { name: "test_upgradeplayer_upgrade", type: "player" };

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.upgrade = res.body.data;
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('Creates test PMC Upgrade', function (done) {
			var newUpgrade = { name: "test_upgradeplayer_upgradepmc", type: "pmc" };

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.upgradepmc = res.body.data;
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('Creates test Player', function (done) {
			var newPlayer = {
				username: "test_upgradeplayer_player", password: "123465798",
				alias: "Unknown User"
			};

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.player = res.body.data;
					res.body.success.should.be.true();
					done();
				});
		});

		it('authenticates the player and returns a token', function (done) {
			var newPlayer = { username: "test_upgradeplayer_player", password: "123465798" };

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

		it('FAILS: Associates them both as a regular user.', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				player: testVar.player.hashField
			};

			request(app)
				.post('/api/upgrades/player')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('FAILS: Attemps to modify the item without owning it', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				player: testVar.player.hashField,
				rank: 1
			};

			request(app)
				.put('/api/upgrades/set/player')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal('The player does not own this upgrade.');
					done();
				});
		});

		it('FAILS: Adds PMC the upgrade to the Player', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgradepmc.hashField,
				player: testVar.player.hashField
			};

			request(app)
				.post('/api/upgrades/player')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.message.should.equal(config.messages().no_entry);
					res.body.success.should.be.false();
					done();
				});
		});

		it('Adds the PMC upgrade to the Player', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				player: testVar.player.hashField
			};

			request(app)
				.post('/api/upgrades/player')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('Modifies the upgrade rank', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				player: testVar.player.hashField,
				rank: 1
			};

			request(app)
				.put('/api/upgrades/set/player')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.rankField.should.equal(2);
					done();
				});
		});
	});

})();