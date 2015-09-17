(function () {"use strict";

var onIdle = process.nextTick;

var q = []; // sched_queue

function sched(defer, op, v) { // [pending.resolve, pending.reject, res, rej], op, v
	function proc(defer, op, v) {
		var fn = defer[op ? 2 : 3];
		if (typeof fn !== 'function')
			return defer[op ? 0 : 1](v);
		try {
			defer[0](fn.call(undefined, v)); // resolve
		} catch (e) {
			defer[1](e); // reject
		}
	}
	if (!q.length)
		onIdle(function () {
			for (var i = 0; i < q.length; i += 3)
				proc(q[i], q[i+1], q[i+2]);
			q = [];
		});
	q.push(defer, op, v);
}

function thenable(v, res, rej) {
	if (v && (typeof v === 'object' || typeof v === 'function')) {
		try {
			var _then = v.then;
		} catch (e) {
			return rej(e), 1;
		}
		if (typeof _then === 'function') {
			var f = 0;
			try {
				_then.call(v, function (_v) {
						if (!f++)
							res(_v);
					}, function (_r) {
						if (!f++)
							rej(_r);
					});
			} catch (e) {
				if (!f++)
					rej(e);
			}
			return 1;
		}
	}
}

function ReedThen(op, v) {
	return function reed_then(res, rej) {
		return new Pending(function (resolve, reject) {
			sched([resolve, reject, res, rej], op, v);
		});
	};
}

function Pending(executor) {
	var self = this,
	    defers = [],
	    then = this.then = function pending_then(res, rej) {
	    	return new Pending(function (resolve, reject) {
	    			defers.push([resolve, reject, res, rej]);
	    		});
	    },
	    _done = function (v, op) {
	    		for (var i = 0; i < defers.length; ++i)
	    			sched(defers[i], op, v);
	    		self.then = ReedThen(op, v);
	    		defers = 0;
	    	},
	    _resolve = function (v) {
	    		if (v === self)
	    			throw TypeError();
	    		if (!thenable(v, _resolve, _reject))
	    			_done(v, 1);
	    	},
	    _reject = function (r) {
	    		_done(r, 0);
	    	};

	if (typeof executor === 'function') {
		var self = this;
		try {
			executor(_resolve, _reject);
		} catch (e) {
			reject(self, e);
		}
	}
}

module.exports = Pending;

Pending.all = function (arr) {
	return new Pending(function (resolve, reject) {
		var refs = 0,
		    results = [];

		function sub(i) {
			var p = arr[i];
			if (thenable(p, function (v) {
						results[i] = v;
						if (--refs)
							resolve(results);
					}, function (r) {
						reject(r);
					}))
				++refs;
			else
				results[i] = p;
		};

		if (typeof arr !== 'object' || (!'length' in arr))
			reject(TypeError('not array'));
		else {
			for (var i = 0, n = arr.length; i < n; ++i)
				sub(i);
			if (!n)
				resolve(results);
		}
	});
};

Pending.race = function (arr) {
	return new Pending(function (resolve, reject) {
		if (typeof arr !== 'object' || (!'length' in arr))
			reject(TypeError('not array'));
		else {
			for (var i = 0, n = arr.length; i < n; ++i)
				if (!thenable(p, function (v) {
						resolve(v);
					}, function (r) {
						reject(r);
					})) {
					resolve(p);
					break;
				}
			if (!n)
				resolve(undefined);
		}
	});
};

Pending.resolve = function (v) {
	return { then: ReedThen(1, v) };
};

Pending.reject = function (r) {
	return { then: ReedThen(0, r) };
};

})();
