module.exports = (function (onIdle, queue) {"use strict";

function Arguments(a) {
	if (a)
		for (var n = this.length = a.length, i = 0; i < n; ++i)
			this[i] = a[i];
	else
		this.length = 0;
}

Arguments.prototype = {
	push: function (v) {
		this[this.length++] = v;
	},
	concat: function (e) {
		if (e instanceof Arguments)
			for (var j = 0, m = e.length; j < m; ++j)
				this.push(e[j]);
		else
			this.push(e);
	}
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
			return rej(e), 1;
		}
		if (typeof _then === 'function') {
			var f = 0;
			try {
				_then.call(v, function () {
						if (!f++)
							res.apply(undefined, arguments);
					}, function () {
						if (!f++)
							rej.apply(undefined, arguments);
					});
			} catch (e) {
				if (!f++)
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

function Pending(executor) {
	var self = this,
	    defers = [],
	    _done = function (args, op) {
	    		for (var i = 0; i < defers.length; ++i)
	    			sched(defers[i], op, args);
	    		self.then = ReedThen(op, args);
	    		defers = 0;
	    	},
	    _reject = function (r) {
	    		_done(arguments, 0);
	    	},
	    _resolve = function (v) {
	    		if (v === self)
	    			throw TypeError();
	    		if (!thenable(v, _resolve, _reject))
	    			_done(arguments, 1);
	    	};

	this.then = function (res, rej) {
			return new Pending(function (resolve, reject) {
					defers.push([resolve, reject, res, rej]);
				});
		};

	if (typeof executor === 'function')
		try {
			executor(_resolve, _reject);
		} catch (e) {
			_reject(e);
		}
}

Pending.prototype = {
	'catch': function (reject) {
		return this.then(0, reject);
	}
};


Pending.all = function (arr) {
	return new Pending(function (resolve, reject) {
		var refs = 0,
		    results = [];

		function sub(i) {
			if (thenable(arr[i], function (v) {
						results[i] = arguments.length > 1 ? new Arguments(arguments): v;
						if (!--refs)
							resolve(results);
					}, reject))
				++refs;
			else
				results[i] = arr[i]; // not a Promise
		};

		if (typeof arr !== 'object' || !('length' in arr))
			reject(TypeError('not array'));
		else {
			for (var i = 0, n = arr.length; i < n; ++i)
				sub(i);
			if (!n || !refs)
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
				if (!thenable(arr[i], resolve, reject)) {
					resolve(arr[i]);
					break;
				}
			if (!n)
				resolve(undefined);
		}
	});
};

Pending.resolve = function () {
	return { then: ReedThen(1, arguments) };
};

Pending.reject = function () {
	return { then: ReedThen(0, arguments) };
};

Pending.Arguments = Arguments;

Pending.concat = function (arr) {
	return Pending.all(arr).then(function (results) {
			var out = new Arguments;
			for (var i = 0, n = results.length; i < n; ++i)
				out.concat(results[i]);
			return out;
		});
};

return Pending; // constructor of Promise in pending state
})(process.nextTick, []);
