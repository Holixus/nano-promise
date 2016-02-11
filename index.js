module.exports = (function (onIdle) {"use strict";
var queue = [];

function Arguments() {
	Array.call(this);
	this.push.apply(this, arguments);
}

Arguments.prototype = Object.create(Array.prototype);

function atoa() {
	var a = new Arguments();
	a.push.apply(a, arguments);
	return a;
};

function sched(defer, op, args) { // [pending.resolve, pending.reject, res, rej], op, arguments
	if (!queue.length)
		onIdle(function () {
			for (var i = 0; i < queue.length; i += 3) {
				var defer = queue[i],
				    op    = queue[i+1],
				    args  = queue[i+2],
				    fn = defer[op ? 2 : 3];
				if (typeof fn !== 'function')
					defer[op ? 0 : 1].apply(undefined, args);
				else
					try {
						var a = fn.apply(undefined, args);
						if (a instanceof Arguments)
							defer[0].apply(undefined, a); // resolve with several arguments proxy
						else
							defer[0](a); // resolve
					} catch (e) {
						defer[1](e); // reject
					}
			}
			queue = [];
		});
	queue.push(defer, op, args);
}

function thenable(v, res, rej) {
	if (v && (typeof v === 'object' || typeof v === 'function')) {
		try {
			var _then = v.then;
		} catch (e) {
			return rej && rej(e), 1;
		}
		if (typeof _then === 'function') {
			var f = 0;
			try {
				_then.call(v, function () {
						if (!f++ && res)
							res.apply(undefined, arguments);
					}, function () {
						if (!f++ && rej)
							rej.apply(undefined, arguments);
					});
			} catch (e) {
				if (!f++ && rej)
					rej(e);
			}
			return 1;
		}
	}
}

function ReedThen(op, args) { // Re(solv|ject)edThen
	return function reed_then(res, rej) {
		return new Pending(function (resolve, reject) {
			sched([resolve, reject, res, rej], op, args);
		});
	};
}

var CANCEL_REASON = 'CANCEL';

function execAll(arr, resolve, reject) {

		if (typeof arr !== 'object' || !('length' in arr))
			return reject(TypeError('not array'));

		var refs = 0,
		    promises = [],
		    results = [];

		function _cancel() {
			for (var i = 0, n = promises.length; i < n; ++i)
				try {
					promises[i].cancel();
				} catch (e) {}
		}

		function sub(i, o) {
			if (thenable(o, function (v) {
						results[i] = arguments.length > 1 ? atoa.apply(null, arguments): v;
						if (!--refs)
							resolve(results);
					}, reject)) {
				++refs;
				promises.push(o);
			} else
				results[i] = o; // not a Promise
		};

		for (var i = 0, n = arr.length; i < n; ++i)
			sub(i, arr[i]);

		if (!n || !refs)
			return resolve(results);

		return { cancel: _cancel };
	}

function Pending(executor) {
	var self = this,
	    defers = [],
	    cancel,
	    is_reed = 0,
	    _done = function (args, op) {
	    		++is_reed;
	    		for (var i = 0; i < defers.length; ++i)
	    			sched(defers[i], op, args);
	    		self.then = ReedThen(op, args);
	    		defers = 0;
	    	},
	    _reject = function (r) {
	    		if (is_reed)
	    			return;
	    		++is_reed;
	    		if (r === CANCEL_REASON)
	    			if (cancel)
	    				cancel();
	    		_done(atoa.apply(null, arguments), 0);
	    	},
	    _resolve = function (v) {
	    		if (v === self)
	    			throw TypeError();
	    		var args = atoa.apply(null, arguments);
	    		if (args.length > 1) {
	    			var o = execAll(args, function (arr) {
	    				_done(arr, 1);
	    			}, _reject);
	    			if (o)
	    				cancel = o.cancel;
	    		} else
	    			if (thenable(v, _resolve, _reject)) {
	    				var vcancel = v.cancel;
	    				if (typeof vcancel === 'function')
	    					cancel = vcancel;
	    			} else
	    				_done(args, 1);
	    	};

	this.then = function (res, rej) {
			return new Pending(function (resolve, reject) {
					defers.push([resolve, reject, res, rej]);
					return { cancel: self.cancel };
				});
		};
	this.cancel = function () {
		_reject(CANCEL_REASON);
		return self;
	};

	if (typeof executor === 'function')
		try {
			var o = executor(_resolve, _reject);
			if (typeof o === 'object') {
				var ocancel = o.cancel;
				if (typeof ocancel === 'function')
					cancel = ocancel;
			}
		} catch (e) {
			_reject(e);
		}
}

Pending.prototype = {
	cancel: undefined,
	'catch': function (reject) {
		return this.then(0, reject);
	},
	finally: function (cb) {
		return this.then(function () {
			cb();
			return atoa.apply(null, arguments);
		}, function (r) {
			cb();
			throw r;
		});
	},
	spread: function (res, rej) {
		return this.then(function (a) {
			return res.apply(null, a instanceof Array ? a : arguments);
		}, rej);
	}
};


Pending.all = function (arr) {
	return new Pending(function (_resolve, _reject) {
		return execAll(arr, _resolve, _reject);
	});
};

Pending.race = function (arr) {
	return new Pending(function (resolve, reject) {
		if (typeof arr !== 'object' || (!'length' in arr))
			return reject(TypeError('not array'));

		var promises = [],
		    _cancel = 
		function () {
			for (var i = 0, n = promises.length; i < n; ++i)
				try {
					promises[i].cancel();
				} catch (e) {}
		}

		for (var i = 0, n = arr.length; i < n; ++i) {
			var v = arr[i];
			if (!thenable(v, resolve, reject)) {
				resolve(arr[i]);

				for (; i < n; ++i) {
					var v = arr[i];
					if (thenable(v))
						v.cancel();
				}
				return _cancel();
			} else {
				promises.push(v);
				v.then(_cancel, function (r) {
					if (r !== CANCEL_REASON)
						_cancel();
				});
			}
		}

		if (promises.length)
			return { cancel: _cancel };
		resolve(); // nothing
	});
};

Pending.resolve = function () {
	var args = atoa.apply(null, arguments);
	return new Pending(function (resolve, reject) {
		resolve.apply(null, args);
	});
};

Pending.reject = function () {
	var o = Object.create(Pending.prototype);
	o.then = ReedThen(0, atoa.apply(null, arguments));
	return o;
};

Pending.Arguments = Arguments;
Pending.CANCEL_REASON = CANCEL_REASON;

Pending.concat = function (arr) {
	return Pending.all(arr).then(function (arr) {
			var r = new Arguments();
			for (var i = 0, n = arr.length; i < n; ++i) {
				var a = arr[i];
				if (a instanceof Arguments || a instanceof Array)
					r.push.apply(r, a)/*, console.log(a)*/;
				else
					r.push(a);
			}
			return r;
		});
};

return Pending; // constructor of Promise in pending state
})(process.nextTick);
