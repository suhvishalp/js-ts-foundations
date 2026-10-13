// examples/generators.mjs
// Run with: node examples/generators.mjs
//
// Generators & iterators: basic, infinite/lazy, yield*, batching a dataset,
// and making a custom object iterable via Symbol.iterator.

// --- Basic generator -------------------------------------------------------
function* counter() {
  yield 1;
  yield 2;
  yield 3;
}
const it = counter();
console.log(it.next()); // => { value: 1, done: false }
console.log(it.next()); // => { value: 2, done: false }
console.log([...counter()]); // => [ 1, 2, 3 ]

// --- Infinite generator + lazy take ----------------------------------------
function* naturals() {
  let n = 1;
  while (true) yield n++; // infinite, but only computed on demand
}
function take(iterable, count) {
  const out = [];
  for (const value of iterable) {
    if (out.length >= count) break;
    out.push(value);
  }
  return out;
}
console.log('take 5:', take(naturals(), 5)); // => take 5: [ 1, 2, 3, 4, 5 ]

// --- yield* delegation -----------------------------------------------------
function* letters() { yield 'a'; yield 'b'; }
function* combined() {
  yield 'start';
  yield* letters(); // delegate to another generator
  yield* [1, 2];    // delegate to any iterable
  yield 'end';
}
console.log('combined:', [...combined()]); // => combined: [ 'start', 'a', 'b', 1, 2, 'end' ]

// --- Lazy batching over a (potentially huge) dataset -----------------------
function* batchify(iterable, size) {
  let batch = [];
  for (const item of iterable) {
    batch.push(item);
    if (batch.length === size) {
      yield batch;  // hand off a full batch
      batch = [];   // start fresh so the old batch can be garbage-collected
    }
  }
  if (batch.length) yield batch; // final partial batch
}
function* rows() { for (let i = 0; i < 10; i++) yield `row-${i}`; }

for (const batch of batchify(rows(), 4)) {
  console.log('batch:', batch);
}
// => batch: [ 'row-0', 'row-1', 'row-2', 'row-3' ]
// => batch: [ 'row-4', 'row-5', 'row-6', 'row-7' ]
// => batch: [ 'row-8', 'row-9' ]

// --- Custom iterable object via Symbol.iterator ----------------------------
const range = {
  from: 1,
  to: 5,
  *[Symbol.iterator]() {
    for (let v = this.from; v <= this.to; v++) yield v;
  },
};
console.log('range:', [...range]); // => range: [ 1, 2, 3, 4, 5 ]

// --- Bonus: an async generator (how token streaming works) -----------------
async function* fakeTokenStream() {
  const tokens = ['Hello', ',', ' world', '!'];
  for (const t of tokens) {
    await new Promise((r) => setTimeout(r, 10)); // simulate network latency
    yield t;
  }
}
let assembled = '';
for await (const token of fakeTokenStream()) {
  assembled += token;
}
console.log('streamed:', assembled); // => streamed: Hello, world!
