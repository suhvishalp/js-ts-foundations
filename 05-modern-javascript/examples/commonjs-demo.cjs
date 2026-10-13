// examples/commonjs-demo.cjs
// Run with: node examples/commonjs-demo.cjs
//
// A CommonJS module for contrast with modules-demo.mjs. Note the .cjs
// extension forces CommonJS regardless of any package.json "type" setting.

// require() is synchronous and returns module.exports:
const path = require('node:path');
const os = require('node:os');

// CommonJS gives you __dirname and __filename for free (ESM does not):
console.log('__dirname exists:', typeof __dirname === 'string'); // => true
console.log('joined path:', path.join('a', 'b')); // => a/b
console.log('platform is a string:', typeof os.platform() === 'string'); // => true

// Define exports. Two common styles:

// 1) Assign the whole exports object:
function square(x) { return x * x; }
const PI = 3.14159;

// 2) Or attach properties to `exports`:
exports.square = square;
exports.PI = PI;

// A default-like export by assigning module.exports directly would REPLACE
// the exports object, so do it once if you use it:
//   module.exports = square;            // then require() returns the function
//   module.exports.PI = PI;             // and you can still hang extras off it

// Demonstrate using them here:
console.log('square(6):', exports.square(6)); // => 36
console.log('PI:', exports.PI);               // => 3.14159

// To consume this from another CJS file:
//   const { square, PI } = require('./commonjs-demo.cjs');
