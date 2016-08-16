(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		config   = require('./../../config.js'),
		testVar  = {};

	describe('PMC Model', function () {

		before('Deleting test entries...', function(done) {
			models.pmc.destroy({where: {displaynameField: 'test_pmc'}}).then(function() {
				models.pmc.destroy({where: {displaynameField: 'new_test_pmc'}}).then(done());
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.pmc.destroy({where: {displaynameField: 'test_pmc'}}).then(function() {
				models.pmc.destroy({where: {displaynameField: 'new_test_pmc'}}).then(done());
			});
		});

		it('returns the PMC model', function (done) {
			expect(models.pmc).to.be.ok();
			done();
		});

		it('FAILS: returns all PMC as regular user', function(done) {
			request(app).get('/api/pmc').
			set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.user)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.false();
				done();
			});
		});

		it('returns all PMC', function(done) {
			request(app).get('/api/pmc').
			set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.admin)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.true();
				done();
			});
		});

		it('FAILS: creates a new PMC with no displayname', function (done) {

			var newPMC = { wrong_displayname: "test_pmc" };

			request(app)
				.post('/api/pmc')
				.send(newPMC)
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('creates a new PMC', function (done) {

			var newPMC = {
				displayname: "test_pmc",
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

		it('FAILS: creates a new PMC with an already used name', function (done) {

			var newPMC = {
				displayname: "test_pmc",
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
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().entry_exists(newPMC.displayname));
					done();
				});
		});

		it('returns that PMC', function (done) {

			request(app)
				.get('/api/pmc/' + testVar.pmc.hashField)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.displaynameField.should.equal('test_pmc');
					done();
				});
		});

		it('FAILS: Tries to modify the PMC name to an already existing one', function (done) {

			request(app)
				.put('/api/pmc/' + testVar.pmc.hashField)
				.send({pmcname: 'test_pmc'})
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					done();
				});
		});

		it('FAILS: Tries to modify the PMC with no authority name', function (done) {

			request(app)
				.put('/api/pmc/' + testVar.pmc.hashField)
				.send({pmcname: 'test_pmc'})
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					done();
				});
		});

		it('Tries to update the PMC name to a new one and succeeds', function (done) {

			request(app)
				.put('/api/pmc/' + testVar.pmc.hashField)
				.send({pmcname: 'new_test_pmc'})
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					done();
				});
		});

		it('FAILS: Tries again', function (done) {

			request(app)
				.put('/api/pmc/' + testVar.pmc.hashField)
				.send({pmcname: 'new_test_pmc'})
				.set('x-access-session-token', config.privileges().tokens.admin)
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					done();
				});
		});
	});

})();