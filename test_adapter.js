var Promise = require('./index.js');

module.exports = {
	resolved: function (v) {
		return new Promise.resolve(v);
	},
	rejected: function (r) {
		return new Promise.reject(r);
	},
	deferred: function () {
		var d = {};
		d.promise = new Promise(function (_resolve, _reject) {
					d.resolve = _resolve;
					d.reject = _reject;
				})
		return d;
	}
};
