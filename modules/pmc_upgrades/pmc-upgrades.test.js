(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Upgrade/PMC Integration', function () {

		before('Deleting test entries...', function(done) {
			models.upgrades.destroy({where: {nameField: 'test_upgradepmc_upgrade'}}).then(function() {
				models.upgrades.destroy({where: {nameField: 'test_upgradepmc_upgradeplayer'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_upgradepmc_player'}}).then(function() {
						models.pmc.destroy({where: {displaynameField: "test_upgradepmc_pmc"}}).then(done());
					});
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.upgrades.destroy({where: {nameField: 'test_upgradepmc_upgrade'}}).then(function() {
				models.upgrades.destroy({where: {nameField: 'test_upgradepmc_upgradeplayer'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_upgradepmc_player'}}).then(function() {
						models.pmc.destroy({where: {displaynameField: "test_upgradepmc_pmc"}}).then(done());
					});
				});
			});
		});

		it('Creates test PMC Upgrade', function (done) {
			var newUpgrade = { name: "test_upgradepmc_upgrade", type: "pmc" };

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.upgrade = res.body.data;
					res.body.message.should.equal(config.messages().new_entry);
					res.body.success.should.be.true();
					done();
				});
		});

		it('Creates test Player Upgrade', function (done) {
			var newUpgrade = { name: "test_upgradepmc_upgradeplayer", type: "player" };

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					testVar.upgradeplayer = res.body.data;
					res.body.message.should.equal(config.messages().new_entry);
					res.body.success.should.be.true();
					done();
				});
		});

		it('creates a new PMC', function (done) {

			var newPMC = {
				displayname: "test_upgradepmc_pmc",
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
					res.body.data.displaynameField.should.equal(newPMC.displayname);
					res.body.success.should.be.true();
					done();
				});
		});

		it('creates a new test leader of a PMC', function (done) {
			var newPlayer = {
				username: "test_upgradepmc_player",
				password: "testpassword",
				alias: "Unknown User",
				email: "testuser@testuser.com",
				bio: "Some dipshit."
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
				username: "test_upgradepmc_player",
				password: "testpassword",
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

		it('FAILS: Tries to associate them both as a random user', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				pmc: testVar.pmc.hashField
			};

			request(app)
				.post('/api/upgrades/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('FAILS: player isnt of a high enough rank to purchase the upgrade.', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				pmc: testVar.pmc.hashField
			};

			request(app)
				.post('/api/upgrades/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().bad_permission);
					done();
				});
		});

		it('changes the player into a PMC leader', function (done) {
			var update =  { tier: "0" };

			request(app)
				.put('/api/players/' + testVar.player.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.playerTier.should.equal(0);
					done();
				});
		});

		it('Adds the PMC upgrade to the PMC', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				pmc: testVar.pmc.hashField
			};

			request(app)
				.post('/api/upgrades/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.success.should.be.true();
					res.body.message.should.equal(config.messages().new_entry);
					done();
				});
		});

		it('FAILS: Adds Player the upgrade to the PMC', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgradeplayer.hashField,
				pmc: testVar.pmc.hashField
			};

			request(app)
				.post('/api/upgrades/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) console.log(err);
					res.body.message.should.equal(config.messages().no_entry);
					res.body.success.should.be.false();
					done();
				});
		});

		it('FAILS: modifies the upgrade rank wihtout a proper rank', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				pmc: testVar.pmc.hashField,
				rank: 1
			};

			request(app)
				.put('/api/upgrades/set/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.user)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.message.should.equal(config.messages().bad_permission);
					res.body.success.should.be.false();
					done();
				});
		});

		it('Modifies the upgrade rank', function (done) {
			var newUpgrade = {
				upgrade: testVar.upgrade.hashField,
				pmc: testVar.pmc.hashField,
				rank: 1
			};

			request(app)
				.put('/api/upgrades/set/pmc')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.data.rankField.should.equal(2);
					res.body.success.should.be.true();
					done();
				});
		});
	});

})();