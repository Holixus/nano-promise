# nanopromise
A small Promise/A++ node module

## Usage



```js
var Promise = require('nanopromise');

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
