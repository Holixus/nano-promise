# nanopromise
A small Promise/A++ node module

## Usage



```js
var Promise = require('nanopromise');

new Promise(function (resolve, reject) {
	resolve(1, 2, 3, 4); // you can pass several arguments
}).then(function (a, b, c, d) {
	console.log(a, b, c, d);
	return Promise.Arguments(5, 6, 7, 8); // and return
}).then(function (a, b, c, d) {
	console.log(a, b, c, d);
});
````
