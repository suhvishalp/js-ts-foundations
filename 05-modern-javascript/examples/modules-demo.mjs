// examples/modules-demo.mjs
// Run with: node examples/modules-demo.mjs
//
// Demonstrates ES module features WITHOUT needing extra files:
//  - named vs default imports (from Node's built-in modules)
//  - namespace import
//  - import aliasing
//  - dynamic import()
//  - import.meta.url (the ESM replacement for __dirname/__filename)

// Named imports from a built-in module:
import { readFile } from 'node:fs/promises';
// Namespace + alias import:
import * as pathNS from 'node:path';
import { join as pathJoin } from 'node:path';

console.log('readFile is a function:', typeof readFile === 'function'); // => true
console.log('namespace join:', typeof pathNS.join === 'function');      // => true
console.log('aliased join:', pathJoin('a', 'b', 'c'));                  // => a/b/c

// import.meta.url replaces __filename in ESM:
console.log('this file url starts with file:', import.meta.url.startsWith('file:')); // => true

// Dynamic import() — load a module lazily and get a Promise of its namespace.
async function main() {
  const os = await import('node:os');
  console.log('platform:', typeof os.platform()); // => string

  // A dynamic import lets you compute the specifier at runtime and defer the
  // cost of loading. In real AI/ML code this is how you lazy-load a heavy
  // library, e.g.:  const { pipeline } = await import('@xenova/transformers');
  const crypto = await import('node:crypto');
  console.log('random hex length:', crypto.randomBytes(4).toString('hex').length); // => 8
}

await main(); // top-level await is allowed in ESM
