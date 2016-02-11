var DO_APLUS_KIT_TESTS = 1;

var assert = require("assert"),
    util = require('util')

var Promise = require(__dirname+'/../index.js');

var promise = function (f) { return new Promise(f); };

var timer = function (ms, o, v) {
	var v = Array.prototype.splice.call(arguments, 2);
	return promise(function (resolve, reject) {
		var to = setTimeout(function () {
				resolve.apply(null, v);
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
};

var then_timer = function (ms, v) {
	return promise(function (res, rej) {
		var to = setTimeout(function () {
			res(v);
		}, ms);
	});
};

var timerThenResolve = function (ms, val) {
	return timer(ms).then(function () { return val; });
};

var timerThenReject = function (ms, val) {
	return timer(ms).then(function () { throw val; });
};

if (DO_APLUS_KIT_TESTS)
describe("Promises/A+ Tests", function () {
	require("promises-aplus-tests").mocha({
		resolved: function (v) {
			return Promise.resolve(v);
		},
		rejected: function (r) {
			return Promise.reject(r);
		},
		deferred: function () {
			var d = {};
			d.promise = new Promise(function (_resolve, _reject) {
						d.resolve = _resolve;
						d.reject = _reject;
					})
			return d;
		}
	});
});


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
		Promise.all([timerThenResolve(5, 1),Promise.resolve(2,3,4),timerThenResolve(8,3)])
			.then(function (a) {
				assert.deepStrictEqual([1, new Promise.Arguments(2,3,4),3], a);
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
	it('all([promise,promise,promise]).then().cancel()', function (done) {
		Promise.all([timerThenResolve(5, 1),Promise.resolve(2),timerThenResolve(8,3)])
			.then(function () {
				done(Error('not cancelled'));
			}, function (a) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
				done();
			}).catch(function (e) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
				done();
			}).cancel();
	});
});


describe('Promise.concat(x).then(...)', function () {

	it('concat().then()', function (done) {
		Promise.concat().catch(function (r) {
				done()
			});
	});
	it('concat([]).then()', function (done) {
		Promise.concat([])
			.then(function (a) {
				assert.strictEqual(a, undefined);
				done();
			}).catch(done);
	});
	it('concat([1,2,3]).then()', function (done) {
		Promise.concat([1,2,3])
			.then(function (a, b, c) {
				assert.strictEqual(a, 1);
				assert.strictEqual(b, 2);
				assert.strictEqual(c, 3);
				done();
			}).catch(done);
	});
	it('concat([1,promise,3]).then()', function (done) {
		Promise.concat([1,Promise.resolve(2),3])
			.then(function (a, b, c) {
				assert.strictEqual(a, 1);
				assert.strictEqual(b, 2);
				assert.strictEqual(c, 3);
				done();
			}).catch(done);
	});
	it('concat([promise,promise,promise]).then()', function (done) {
		Promise.concat([timerThenResolve(5, 1),Promise.resolve(2,3,4),timerThenResolve(8,5)])
			.then(function (a, b, c, d, e) {
				assert.strictEqual(a, 1);
				assert.strictEqual(b, 2);
				assert.strictEqual(c, 3);
				assert.strictEqual(d, 4);
				assert.strictEqual(e, 5);
				done();
			}).catch(done);
	});
	it('concat([promise,reject,promise]).then()', function (done) {
		Promise.concat([timerThenResolve(5, 1),timerThenReject(10,'ooo'),timerThenResolve(8,3)])
			.catch(function (a) {
				assert.deepStrictEqual('ooo', a);
				done();
			})
	});
	it('concat([promise,promise,promise]).then().cancel()', function (done) {
		Promise.concat([timerThenResolve(5, 1),Promise.resolve(2),timerThenResolve(8,3)])
			.then(function () {
				done(Error('not cancelled'));
			}, function (a) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
				done();
			}).catch(function (e) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
				done();
			}).cancel();
	});
});


describe('Promise.race(x).then(...)', function () {

	it('race().then()', function (done) {
		Promise.race().catch(function (r) {
				done()
			});
	});
	it('race([]).then()', function (done) {
		Promise.race([])
			.then(function (a) {
				assert.strictEqual(undefined, a, 'not undefined');
				done();
			}).catch(done);
	});
	it('race([1,2,3]).then()', function (done) {
		Promise.race([1,2,3])
			.then(function (a) {
				assert.deepStrictEqual(1, a);
				done();
			}).catch(done);
	});
	it('race([1,promise,3]).then()', function (done) {
		Promise.race([1,Promise.resolve(2),3])
			.then(function (a) {
				assert.deepStrictEqual(1, a);
				done();
			}).catch(done);
	});
	it('race([promise,promise,promise]).then()', function (done) {
		Promise.race([timerThenResolve(5, 1),Promise.resolve(2),timerThenResolve(8,3)])
			.then(function (a) {
				assert.deepStrictEqual(2, a);
				done();
			}).catch(done);
	});
	it('race([promise,promise,promise]).then() with promised reject', function (done) {
		Promise.race([timerThenResolve(45, 1),timerThenReject(8,3),timerThenResolve(34,3)])
			.then(function (a) {
				done(Error('resolved!'));
			}, function (e) {
				assert.strictEqual(e, 3);
				done();
			});
	});
	it('race([promise,promise,promise]).then().cancel()', function (done) {
		Promise.race([timerThenResolve(45, 1),Promise.resolve(2),timerThenResolve(38,3)])
			.then(function () {
				done(Error('wasn`t cancelled'));
			}, function (a) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
				done();
			}).catch(function (rc) {
				assert.strictEqual(a, Promise.CANCEL_REASON);
			}).cancel();
	});
	it('race([promise,reject,promise]).then()', function (done) {
		Promise.all([timerThenResolve(5, 1),timerThenReject(10,'ooo'),timerThenResolve(8,3)])
			.catch(function (a) {
				assert.deepStrictEqual('ooo', a);
				done();
			})
	});
});


describe('Cancelation', function () {

	it('executor.cancel() call after resolve check', function (done) {

		var d = 0;
		var t = promise(function (resolve, reject) {
			var to = setTimeout(function () {
					resolve(11);
					d = 1;
					to = -1;
				}, 10);
			return { cancel: function () {
				assert.notStrictEqual(to,  -1, 'cancel resolved timer!!');
				assert.strictEqual(d, 1);
				clearTimeout(to);
			}};
		});

		timer(20).then(function () {
			assert.strictEqual(d, 1);
			t.cancel();
		});

		timer(30).then(done);
	});



	it('timer(10).then(done)', function (done) {
		var o = {};
		timer(10, o).then(function () {
				assert(o.getTO() === undefined, 'undefined');
				done();
			});
		assert(o.getTO() !== undefined, 'no timer');
	});


	it('timer(10).then(done).cancel()', function (done) {
		var o = 'A', oo = 'B';
		var p = timer(4, undefined, o).then(function (v) {
			assert.strictEqual(v, o);
			return then_timer(10, oo);
		}).then(function (v) {
			assert.strictEqual(v, oo);
			done();
		}, function (e) {
			assert.notStrictEqual(e, Promise.CANCEL_REASON);
			throw e;
		}).catch(function (e) {
			assert.strictEqual(e, Promise.CANCEL_REASON);
			done();
		});

		timer(8).then(function () {
			p.cancel();
		});
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

	it('timer(10, 10).then(timer); cancel() in 15ms', function (done) {
		var seq = timer(10).then(function () {
				return timer(40).then(function () {
						done(Error('not cancelled'));
					}, function (r) {
						assert.strictEqual(r, Promise.CANCEL_REASON, 'not a cancel reason');
						done();
					});
			}, function (r) {
				done(r);
			});
		timer(30).then(function () {
			seq.cancel();
		});
	});

	it('timer(10).then(timer(11).then(timer(12)); cancel() in 15ms', function (done) {
		var check = '', ccheck = '';
		var s = timer(10).then(function () {
			check += 'a';
			return timer(11).then(function () {
				check += 'b';
				return timer(12).then(function () {
					check += 'c';
					done(Error('not cancelled'));
				}, function (e) {
					assert.strictEqual(e, Promise.CANCEL_REASON);
					ccheck += 'C';
					throw e;
				});
			}, function (e) {
				assert.strictEqual(e, Promise.CANCEL_REASON);
				ccheck += 'B';
				throw e;
			});
		}, function (e) {
			assert.strictEqual(e, Promise.CANCEL_REASON);
			ccheck += 'A';
			throw e;
		}).catch(function (e) {
			if (e !== Promise.CANCEL_REASON)
				done(e);
		});
		timer(15).then(function () {
			s.cancel();
		}).catch(done);
		timer(17).then(function () {
			assert.strictEqual(check, 'a');
		}).catch(done);
		timer(35).then(function () {
			assert.strictEqual(check, 'a');
			assert.strictEqual(ccheck, 'B');
			done();
		}).catch(done);
	});
});

describe('new Promise(...)', function () {

	it('without executor', function (done) {
		new Promise().then(function () {
			done(Error('solved!'));
		}, function (e) {
			done(Error('rejected'));
		});
		timer(10).then(function () {
			done();
		});
	});

	it('then cancel isn`t function', function (done) {
		new Promise(function () {
			return { cancel: 5 };
		}).then(function () {
			done(Error('solved!'));
		}, function (e) {
			done(Error('rejected'));
		});
		timer(10).then(function () {
			done();
		});
	});

	it('with throwing executor', function (done) {
		new Promise(function () {
			throw Error('ok');
		}).then(function () {
			done(Error('solved!'));
		}, function (e) {
			done();
		});
		timer(50).then(function () {
			done(Error('in pending!'));
		});
	});

});

describe('Promise.resolve(...)', function () {

	it('Promise.resolve(timer(10, null, 55), timer(11, null, 12))', function (done) {
		Promise.resolve(timer(10, null, 55), timer(11, null, 12)).then(function (a, b) {
				assert.strictEqual(55, a);
				assert.strictEqual(12, b);
				done();
			});
	});

	it('Promise.resolve(timer(10, null, 55), timer(11, null, timer(1, null, 123)))', function (done) {
		Promise.resolve(timer(10, null, 55), timer(11, null, timer(1, null, 123))).then(function (a, b) {
				assert.strictEqual(55, a);
				assert.strictEqual(123, b);
				done();
			});
	});

});

describe('Promise#finally(...)', function () {

	it('resolve', function (done) {
		var val = 'werwrer',
		    c = 0;
		new Promise(function (res) {
			res(val);
		})
		.finally(function () {
			++c;
		})
		.then(function (r) {
			assert.strictEqual(1, c);
			assert.strictEqual(val, r);
			done();
		})
		.catch(done);
	});

	it('reject', function (done) {
		var val = 'werwrer',
		    c = 0;
		new Promise(function (res, rej) {
			rej(val);
		})
		.finally(function () {
			++c;
		})
		.then(function () {
				done(Error('!'));
			}, function (r) {
				assert.strictEqual(1, c);
				assert.strictEqual(val, r);
				done();
		})
		.catch(done);
	});

	it('resolve later', function (done) {
		var val = 'werwrer',
		    c = 0;
		timer(5).then(function () {
			return val;
		})
		.finally(function () {
			++c;
		})
		.then(function (r) {
			assert.strictEqual(1, c);
			assert.strictEqual(val, r);
			done();
		})
		.catch(done);
	});

	it('reject later', function (done) {
		var val = 'werwrer',
		    c = 0;
		timer(5).then(function () {
			throw val;
		})
		.finally(function () {
			++c;
		})
		.then(function () {
				done(Error('!'));
			}, function (r) {
				assert.strictEqual(1, c);
				assert.strictEqual(val, r);
				done();
		})
		.catch(done);
	});

	it('resolved', function (done) {
		var val = 'werwrer',
		    c = 0;
		Promise.resolve(val)
		.finally(function () {
			++c;
		})
		.then(function (r) {
			assert.strictEqual(1, c);
			assert.strictEqual(val, r);
			done();
		})
		.catch(done);
	});

	it('rejected', function (done) {
		var val = 'werwrer',
		    c = 0;
		Promise.reject(val)
		.finally(function () {
			++c;
		})
		.then(function () {
				done(Error('!'));
			}, function (r) {
				assert.strictEqual(1, c);
				assert.strictEqual(val, r);
				done();
		})
		.catch(done);
	});
});

describe('Promise#spread(...)', function () {

	it('array', function (done) {
		Promise.resolve([1,2,3]).spread(function (a, b, c) {
			assert.strictEqual(1, a);
			assert.strictEqual(2, b);
			assert.strictEqual(3, c);
			done();
		}, done);
	});

	it('not array', function (done) {
		Promise.resolve(1,2,3).spread(function (a, b, c) {
			assert.strictEqual(1, a);
			assert.strictEqual(2, b);
			assert.strictEqual(3, c);
			done();
		}, done);
	});

});

