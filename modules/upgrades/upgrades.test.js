(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		config   = require('./../../config.js'),
		testVar  = {};

	describe('Upgrades Model', function () {
		before('Deleting test entries...', function(done) {
			models.upgrades.destroy({where: {nameField: 'test_upgrade'}}).then(done());
		});

		after('Done testing, cleaning up...', function(done) {
			models.upgrades.destroy({where: {nameField: 'test_upgrade'}}).then(done());
		});

		it('returns the Upgrades model', function () {
			expect(models.upgrades).to.be.ok();
		});

		it('FAILS: returns all upgrades as user', function(done) {
			request(app).get('/api/upgrades')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.user)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.false();
				done();
			});
		});

		it('Returns all upgrades', function(done) {
			request(app).get('/api/upgrades')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.true();
				done();
			});
		});

		it('FAILS: attempts to create a new upgrade with no name', function (done) {
			var newUpgrade = {
				wrong_param: "test_upgrade"
			};

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('creates a new upgrade', function (done) {
			var newUpgrade = {
				name: "test_upgrade",
				icon: "myicon",
				flavortext: "test_flavor",
				flavortextupgrade: "[flavor,test]",
				tiercost: 1,
				costmult: 1.5,
			};

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					testVar.upgrade = res.body.data;
					res.body.success.should.be.true();
					res.body.data.nameField.should.equal(newUpgrade.name);
					res.body.data.tierCost.should.equal(1);
					done();
				});
		});

		it('returns that upgrade', function (done) {
			request(app)
				.get('/api/upgrades/' + testVar.upgrade.hashField)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					res.body.success.should.be.true();
					res.body.data.nameField.should.equal('test_upgrade');
					done();
				});
		});

		it('FAILS: attempts to create a new upgrade with an existing name', function (done) {
			var newUpgrade = {
				name: "test_upgrade"
			};

			request(app)
				.post('/api/upgrades')
				.send(newUpgrade)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().entry_exists(newUpgrade.name));
					done();
				});
		});

		it('FAILS: updates upgrade details with an existing name', function (done) {
			var update =  { name: 'test_upgrade' };

			request(app)
				.put('/api/upgrades/' + testVar.upgrade.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().entry_param_exists('upgrade name'));
					done();
				});
		});

		it('updates upgrade details', function (done) {
			var update =  {
				icon: 'new_icon',
				tiercost: 5
			};

			request(app)
				.put('/api/upgrades/' + testVar.upgrade.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					res.body.success.should.be.true();
					res.body.data.iconName.should.equal('new_icon');
					res.body.data.tierCost.should.equal(5);
					done();
				});
		});

	});

})();