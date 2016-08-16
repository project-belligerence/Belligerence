(function(){

	'use strict';

	var expect   = require('expect.js'),
		request  = require('supertest'),
		should	 = require('should'),
		app 	 = "http://localhost:8080";

	describe('App', function () {
		it('should be running (200)', function (done) {
			request(app).get('/')
			.set('Accept', 'application/json')
			.expect(200, 'OK', done);
		});

		it('should go nowhere (404)', function (done) {
			request(app).get('/r4nd0mstr1ng')
			.set('Accept', 'application/json')
			.expect(404, done);
		});
	});

})();