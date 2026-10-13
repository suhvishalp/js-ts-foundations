// solutions/exercise-03.mjs — Lazy batch generator over a dataset
// Run: node solutions/exercise-03.mjs

// Yields arrays of at most `size` items from ANY iterable, lazily. Because it
// only holds one batch at a time, memory stays flat over huge inputs.
function* batchify(iterable, size) {
  if (size < 1) throw new RangeError('size must be >= 1');
  let batch = [];
  for (const item of iterable) {
    batch.push(item);
    if (batch.length === size) {
      yield batch;   // emit a full batch...
      batch = [];    // ...and reset (lets the old batch be garbage-collected)
    }
  }
  if (batch.length) yield batch; // don't forget the final partial batch
}

// A simple lazy range [start, end).
function* range(start, end) {
  for (let i = start; i < end; i++) yield i;
}

// --- checks ---
console.log([...batchify([1, 2, 3, 4, 5], 2)]);
// => [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]

console.log([...batchify(range(0, 10), 3)]);
// => [ [ 0, 1, 2 ], [ 3, 4, 5 ], [ 6, 7, 8 ], [ 9 ] ]

// Works on a Set too (any iterable):
console.log([...batchify(new Set(['a', 'b', 'c']), 2)]);
// => [ [ 'a', 'b' ], [ 'c' ] ]

export { batchify, range };
