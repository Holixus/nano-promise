var assert = require("assert"),
    util = require('util')

var Promise = require(__dirname+'/index.js');

var promise = function (f) { return new Promise(f); };

var timer = function (ms, o) {
	return promise(function (resolve, reject) {
		var to = setTimeout(function () {
				resolve();
				to = undefined;
			}, ms);
		if (o && typeof o === 'object')
			o.getTO = function () {
				return to;
			};
		return { cancel: function () {
			if (to !== undefined)
				clearTimeout(to);
			to = undefined;
		}};
	});
}

var timerThenResolve = function (ms, val) {
	return timer(ms).then(function () { return val; });
};

var timerThenReject = function (ms, val) {
	return timer(ms).then(function () { throw val; });
};

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

describe('Promise.all(x).then(...)', function () {

	it('all().then()', function (done) {
		Promise.all().catch(function (r) {
				done()
			});
	});
	it('all([]).then()', function (done) {
		Promise.all([])
			.then(function (a) {
				assert.deepStrictEqual([], a, 'not array');
				done();
			}).catch(done);
	});
	it('all([1,2,3]).then()', function (done) {
		Promise.all([1,2,3])
			.then(function (a) {
				assert.deepStrictEqual([1,2,3], a);
				done();
			}).catch(done);
	});
	it('all([1,promise,3]).then()', function (done) {
		Promise.all([1,Promise.resolve(2),3])
			.then(function (a) {
				assert.deepStrictEqual([1,2,3], a);
				done();
			}).catch(done);
	});
	it('all([promise,promise,promise]).then()', function (done) {
		Promise.all([timerThenResolve(5, 1),Promise.resolve(2),timerThenResolve(8,3)])
			.then(function (a) {
				assert.deepStrictEqual([1,2,3], a);
				done();
			}).catch(done);
	});
	it('all([promise,reject,promise]).then()', function (done) {
		Promise.all([timerThenResolve(5, 1),timerThenReject(10,'ooo'),timerThenResolve(8,3)])
			.catch(function (a) {
				assert.deepStrictEqual('ooo', a);
				done();
			})
	});
});


describe('Cancelation', function () {

	it('timer(10).then(done)', function (done) {
		var o = {};
		timer(10, o).then(function () {
				assert(o.getTO() === undefined, 'undefined');
				done();
			});
		assert(o.getTO() !== undefined, 'no timer');
	});

	it('timer(10).cancel().catch()', function (done) {
		var o = {};
		var t = timer(10, o);
		t.catch(function (r) {
				assert.strictEqual(Promise.CANCEL_REASON, r, 'not a cancel reason');
				assert(o.getTO() === undefined, 'undefined');
				done();
			});
		assert(o.getTO() !== undefined, 'no timer');
		t.cancel();
	});

	it('timer(10).catch().cancel()', function (done) {
		var o = {};
		var t = timer(10, o);
		t = t.catch(function (r) {
				assert.strictEqual(Promise.CANCEL_REASON, r, 'not a cancel reason');
				assert(o.getTO() === undefined, 'undefined');
				done();
			});
		assert(o.getTO() !== undefined, 'no timer');
		t.cancel();
	});

});
