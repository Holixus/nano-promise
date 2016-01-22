[![Join the chat][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.1 compliant" align="right" />
</a>

# nano-promise

A small Promise/A++ node module.

## Usage



```js
var Promise = require('nano-promise');

new Promise(function (resolve, reject) {
	resolve(1, 2, 3, 4); // you can pass several arguments
}).then(function (a, b, c, d) {
	console.log(a, b, c, d); // 1 2 3 4
	return new Promise.Arguments(5, 6, 7, 8); // and return
}).then(function (a, b, c, d) {
	console.log(a, b, c, d); // 5 6 7 8
});
````

## Extensions

### Promise.resolve(...)


```js
Promise.resolve(5, 'a')
	.then(function (a, b) {
		console.log(a, b);
	});
```

Like Promise.all() but ...

```js
function timer(ms, value) {
	return new Promise(function (resolve, reject) {
		var to = setTimeout(function () {
				resolve(value);
			}, ms);
		return { cancel: function () {
			clearTimeout(to); // can be called in pending state one time only
		}};
	});
}

Promise.resolve(timer(1000, 'go'), timer(800, 'up'))
	.then(function (a, b) {
		console.log(a, b); // 'go', 'up'
	});
```



### Promise.concat(array)

* array {Array} - array of Promises or values

```js
Promies.concat([
	new Promise(function (resolve, reject) {
		resolve(1, 2, 3, 4);
	},
	new Promise(function (resolve, reject) {
		resolve(4, 5, 6, 7);
	}])
	.then(function (a,b,c,d,e,f,g,h) {
		console.log(a,b,c,d,e,f,g,h); // 1 2 3 4 5 6 7 8
	});
```

### promise.cancel()

```js
function timer(ms) {
	return new Promise(function (resolve, reject) {
		var to = setTimeout(resolve, ms);
		return { cancel: function () {
			clearTimeout(to); // can be called in pending state one time only
		}};
	});
}

timer(1000).then(function () {
		console.log('timeout');
	}, function (r) {
		if (r === Promise.CANCEL_REASON)
			console.log('cancelled');
	}).cancel();

```

[gitter-image]: https://badges.gitter.im/Holixus/nano-promise.svg
[gitter-url]: https://gitter.im/Holixus/nano-promise?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge

[npm-image]: https://img.shields.io/npm/v/nano-promise.svg
[npm-url]: https://npmjs.org/package/nano-promise

[github-tag]: http://img.shields.io/github/tag/Holixus/nano-promise.svg
[github-url]: https://github.com/Holixus/nano-promise/tags

[travis-image]: https://travis-ci.org/Holixus/nano-promise.svg?branch=cancellable
[travis-url]: https://travis-ci.org/Holixus/nano-promise

[coveralls-image]: https://img.shields.io/coveralls/Holixus/nano-promise.svg?branch=cancellable
[coveralls-url]: https://coveralls.io/r/Holixus/nano-promise

[david-image]: http://img.shields.io/david/Holixus/nano-promise.svg
[david-url]: https://david-dm.org/Holixus/nano-promise

[license-image]: http://img.shields.io/npm/l/nano-promise.svg
[license-url]: LICENSE

[downloads-image]: http://img.shields.io/npm/dm/nano-promise.svg
[downloads-url]: https://npmjs.org/package/nano-promise
