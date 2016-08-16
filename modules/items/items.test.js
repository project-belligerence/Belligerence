(function(){

	'use strict';

	var expect 	 = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080",
		models   = require('./../index.js').getModels(),
		config   = require('./../../config.js'),
		testVar  = {};

	describe('Items Model', function () {

		before('Deleting test entries...', function(done) {
			models.items.destroy({where: {nameField: 'test_item'}}).then(function() {
				models.items.destroy({where: {nameField: 'test_item_2'}}).then(function() {
					done();
				});
			});
		});

		after('Done testing, cleaning up...', function(done) {
			models.items.destroy({where: {nameField: 'test_item'}}).then(function() {
				models.items.destroy({where: {nameField: 'test_item_2'}}).then(function() {
					done();
				});
			});
		});

		it('returns the Items model', function (done) {
			expect(models.items).to.be.ok();
			done();
		});

		it('FAILS: attempts to create a new Item with wrong parameters', function (done) {
			var newItem = {
				wrong_param: "test_item"
			};

			request(app)
				.post('/api/items')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().invalid_params);
					done();
				});
		});

		it('FAILS: attempts to create a new Item with a token that has no permissions', function (done) {
			var newItem = {
				name: "test_item"
			};

			request(app)
				.post('/api/items')
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

		it('creates a new item', function (done) {
			var newItem = {
				name: "test_item",
				description: "description",
				deployable: false,
				value: 5000,
				info: "item_page"
			};

			request(app)
				.post('/api/items')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					testVar.item = res.body.data;
					res.body.success.should.be.true();
					res.body.data.nameField.should.equal(newItem.name);
					res.body.data.valueField.should.equal(5000);
					done();
				});
		});

		it('returns that item', function (done) {
			request(app)
				.get('/api/items/' + testVar.item.hashField)
				.set('Accept', 'application/json')
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.nameField.should.equal('test_item');
					done();
				});
		});

		it('FAILS: updates item details with an existing name', function (done) {
			var update = { name: 'test_item' };

			request(app)
				.put('/api/items/' + testVar.item.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().entry_param_exists('item name'));
					done();
				});
		});

		it('FAILS: updates upgrade details as user', function (done) {
			var update =  {
				name: "test_item_2",
				description: "new_description",
				type: 1,
				class: 2
			};

			request(app)
				.put('/api/items/' + testVar.item.hashField)
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

		it('updates upgrade details', function (done) {
			var update =  {
				name: "test_item_2",
				description: "new_description",
				type: 1,
				class: 2
			};

			request(app)
				.put('/api/items/' + testVar.item.hashField)
				.send(update)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res){
					if (err) throw new Error(err);
					res.body.success.should.be.true();
					res.body.data.nameField.should.equal("test_item_2");
					res.body.data.descriptionField.should.equal("new_description");
					res.body.data.typeField.should.equal(1);
					res.body.data.classField.should.equal(2);
					done();
				});
		});

		it('FAILS: creates a new item with an existing name', function (done) {
			var newItem = {
				name: "test_item_2",
				description: "description",
			};

			request(app)
				.post('/api/items')
				.send(newItem)
				.set('Accept', 'application/json')
				.set('x-access-session-token', config.privileges().tokens.admin)
				.end(function(err, res) {
					if (err) throw new Error(err);
					res.body.success.should.be.false();
					res.body.message.should.equal(config.messages().entry_exists(newItem.name));
					done();
				});
		});

		it('FAILS: returns all items', function(done) {
			request(app).get('/api/players')
			.set('Accept', 'application/json')
			.set('x-access-session-token', config.privileges().tokens.user)
			.end(function(err, res) {
				if (err) throw new Error(err);
				res.body.success.should.be.false();
				done();
			});
		});

	});

})();