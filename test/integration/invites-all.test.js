(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models = require('./../../modules/index.js').getModels(),
		config   = require('./../../config.js'),
		testVar = {};

	describe('Invites Integration', function () {

		before('Deleting test entries...', function(done) {
			models.invites.destroy({where: {noteField: 'delete1'}}).then(function(){
				models.invites.destroy({where: {noteField: 'delete_2'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_inviteall_player1'}}).then(function() {
						models.players.destroy({where: {usernameField: 'test_inviteall_player2'}}).then(function() {
							models.players.destroy({where: {usernameField: 'test_inviteall_player3'}}).then(function() {
								models.pmc.destroy({where: {"display_name": 'test_inviteall_pmc1'}}).then(function() {
									models.pmc.destroy({where: {"display_name": 'test_inviteall_pmc2'}}).then(done());
								});
							});
						});
					});
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.invites.destroy({where: {noteField: 'delete1'}}).then(function(){
				models.invites.destroy({where: {noteField: 'delete_2'}}).then(function() {
					models.players.destroy({where: {usernameField: 'test_inviteall_player1'}}).then(function() {
						models.players.destroy({where: {usernameField: 'test_inviteall_player2'}}).then(function() {
							models.players.destroy({where: {usernameField: 'test_inviteall_player3'}}).then(function() {
								models.pmc.destroy({where: {"display_name": 'test_inviteall_pmc1'}}).then(function() {
									models.pmc.destroy({where: {"display_name": 'test_inviteall_pmc2'}}).then(done());
								});
							});
						});
					});
				});
			});
		});

		it('Creates a test player 1', function(done) {
			var newPlayer = {
				username: "test_inviteall_player1",
				password: "testpassword",
				alias: "Unknown User"
			};

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.player1 = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(10);
					done();
				});
		});

		it('Creates a test player 2', function(done) {
			var newPlayer = {
				username: "test_inviteall_player2",
				password: "testpassword",
				alias: "Unknown User",
				TEST_tier: "0"
			};

			request(app)
				.post('/api/players/admin')
				.send(newPlayer)
				.set('x-access-session-token', config.privileges.tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.player2 = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(0);
					done();
				});
		});

		it('Creates a test player 3', function(done) {
			var newPlayer = {
				username: "test_inviteall_player3",
				password: "testpassword",
				alias: "Unknown User"
			};

			request(app)
				.post('/api/players')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.player3 = res.body.data;
					res.body.success.should.be.true();
					res.body.data.aliasField.should.equal(newPlayer.alias);
					res.body.data.playerTier.should.equal(10);
					done();
				});
		});

		it('authenticates player1 and returns a token', function(done) {
			var newPlayer = {
				username: "test_inviteall_player1",
				password: "testpassword",
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.player1.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.player1.hashField);
					done();
				});
		});

		it('authenticates player2 and returns a token', function(done) {
			var newPlayer = {
				username: "test_inviteall_player2",
				password: "testpassword"
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.player2.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.player2.hashField);
					done();
				});
		});

		it('authenticates player3 and returns a token', function(done) {
			var newPlayer = {
				username: "test_inviteall_player3",
				password: "testpassword",
			};

			request(app)
				.post('/api/players/auth')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					testVar.player3.token = res.body.data.token;
					res.body.data.token.length.should.be.above(170);
					res.body.data.player.hashField.should.equal(testVar.player3.hashField);
					done();
				});
		});

		it('creates a new PMC 1', function(done) {
			var newPMC = {
				displayname: "test_inviteall_pmc1",
				motto: "we are the best!"
			};

			request(app)
				.post('/api/pmc')
				.send(newPMC)
				.set('x-access-session-token', config.privileges.tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.pmc1 = res.body.data;
					res.body.success.should.be.true();
					res.body.data.displaynameField.should.equal(newPMC.displayname);
					done();
				});
		});

		it('Adds the player 2 to PMC 1.', function (done) {
			var newPlayer = {
				player: testVar.player2.hashField,
				pmc: testVar.pmc1.hashField
			};

			request(app)
				.post('/api/players/set/pmc')
				.send(newPlayer)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges.tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.message.should.equal('Player has been added to the PMC.');
					done();
				});
		});

		it('creates a new PMC 2', function(done) {
			var newPMC = {
				displayname: "test_inviteall_pmc2",
				motto: "we are the best!"
			};

			request(app)
				.post('/api/pmc')
				.send(newPMC)
				.set('x-access-session-token', config.privileges.tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.pmc2 = res.body.data;
					res.body.success.should.be.true();
					res.body.data.displaynameField.should.equal(newPMC.displayname);
					done();
				});
		});

		it('FAILS: Invite with malformed argument.', function(done) {
			var newInvite = { bad_type: 'Request_PlayerPMC', point_b: '123'	};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal(config.messages.invalid_params);
						res.body.success.should.be.false();
					done();
				});
		});

		it('FAILS: Invite with invalid type.', function(done) {
			var newInvite = { type: 'Request_PlayerPMC_INVALID', point_b: '123'	};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal(config.messages.modules.invites.invalid);
						res.body.success.should.be.false();
					done();
				});
		});

		it('FAILS: PMC does not exist.', function(done) {
			var newInvite = {
				type: 'Request_PlayerPMC',
				point_b: testVar.pmc1.hashField + "123abc"
			};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal(config.messages.modules.invites.invalid);
						res.body.success.should.be.false();
					done();
				});
		});

		it('Player requests to be accepted into the PMC.', function(done) {
			var newInvite = {
				type: 'Request_PlayerPMC',
				point_b: testVar.pmc1.hashField
			};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						testVar.invite_playerpmc = res.body.data;
						res.body.message.should.equal(config.messages.new_entry);
						res.body.data.typeField.should.equal(newInvite.type);
						res.body.data.pointA.should.equal(testVar.player1.hashField);
						res.body.data.pointB.should.equal(testVar.pmc1.hashField);
						res.body.success.should.be.true();
					done();
				});
		});

		it('FAILS: Invite already exists.', function(done) {
			var newInvite = {
				type: 'Request_PlayerPMC',
				point_b: testVar.pmc1.hashField,
				note: 'delete1'
			};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal(config.messages.duplicate_entry);
						res.body.success.should.be.false();
					done();
				});
		});

		it('Gets all invites sent by the player and checks the latest sent.', function(done) {

			request(app)
				.get('/api/invites/sent/player')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.data[0].pointA.should.equal(testVar.player1.hashField);
						res.body.data[0].pointB.should.equal(testVar.pmc1.hashField);
						res.body.success.should.be.true();
					done();
				});
		});

		it('Gets all invites sent to the PMC and checks the latest received.', function(done) {
			request(app)
				.get('/api/invites/received/pmc')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player2.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.data[0].pointA.should.equal(testVar.player1.hashField);
						res.body.data[0].pointB.should.equal(testVar.pmc1.hashField);
						res.body.success.should.be.true();
					done();
				});
		});

		it('FAILS: Tries to resolve the request as the sender.', function (done) {

			request(app)
				.post('/api/invites/resolve/' + testVar.invite_playerpmc.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal(config.messages.bad_permission);
						res.body.success.should.be.false();
					done();
				});
		});

		it('Resolves the request as the PMC leader.', function (done) {

			request(app)
				.post('/api/invites/resolve/' + testVar.invite_playerpmc.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player2.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
						res.body.message.should.equal('Invite has been successfully resolved.');
						res.body.success.should.be.true();
					done();
				});
		});

		it('Verifies if the player is now part of the PMC.', function (done) {
			request(app)
				.get('/api/players/get/self')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.data.PMCId.should.equal(testVar.pmc1.id);
					res.body.success.should.be.true();
					done();
				});
		});

		it('FAILS: PMC invites a player from a low rank member.', function (done) {
			var newInvite = {
				type: 'Invite_PlayerPMC',
				note: 'delete_2',
				point_b: testVar.player3.hashField,
			};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player1.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.message.should.equal(config.messages.bad_permission);
					res.body.success.should.be.false();
					done();
				});
		});

		it('PMC invites a player.', function (done) {
			var newInvite = {
				type: 'Invite_PlayerPMC',
				note: 'delete_2',
				point_b: testVar.player3.hashField,
			};

			request(app)
				.post('/api/invites')
				.send(newInvite)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player2.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.invite_pmcplayer = res.body.data;
					res.body.data.typeField.should.equal('Invite_PlayerPMC');
					res.body.data.pointA.should.equal(testVar.pmc1.hashField);
					res.body.data.pointB.should.equal(testVar.player3.hashField);
					res.body.success.should.be.true();
					done();
				});
		});

		it('Resolves the invitation.', function (done) {

			request(app)
				.post('/api/invites/resolve/' + testVar.invite_pmcplayer.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player3.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.message.should.equal('Invite has been successfully resolved.');
					res.body.success.should.be.true();
					done();
				});
		});

		it('Verifies if the player is now part of the PMC.', function (done) {
			request(app)
				.get('/api/players/get/self')
				.set('Accept', 'application/json')
				.set('x-access-session-token', testVar.player3.token)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.data.PMCId.should.equal(testVar.pmc1.id);
					res.body.success.should.be.true();
					done();
				});
		});
	});

})();
