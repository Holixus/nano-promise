var assert = require("assert");

var Promise = require(__dirname+'/index.js');

describe('Promise with multi arguments resolving', function () {

	it('resolve(5)', function (done) {
		var p = new Promise(function (resolve, reject) {
			resolve(5);
		})
		.then(function (a) {
			assert.strictEqual(5, a);
			done();
		}).catch(done);
	});

	it('resolve(5, 2)', function (done) {
		var p = new Promise(function (resolve, reject) {
			resolve(5, 2);
		})
		.then(function (a, b) {
			assert.strictEqual(5, a);
			assert.strictEqual(2, b);
			done();
		}).catch(done);
	});

	it('resolve(5, Promise.resolve()).', function (done) {
		var p = new Promise(function (resolve, reject) {
			resolve(5, new Promise(function (r) { r(2); }));
		})
		.then(function (a, b) {
			assert.strictEqual(5, a);
			assert.strictEqual(2, b);
			done();
		}).catch(done);
	});

	it('resolve(5, Promise.reject()).', function (done) {
		var p = new Promise(function (resolve, reject) {
			resolve(5, new Promise(function (a, r) { r(2); }));
		})
		.then(function (a, b) {
		}).catch(function (r) {
			assert.strictEqual(2, r);
			done();
		});
	});
});
