// closures.js — runnable with:  node closures.js
//
// Demonstrates the closure mental model: a function plus the variables it
// captured from the scope where it was defined ("its backpack").

// ---------------------------------------------------------------------------
// 1. The canonical counter — private, persistent state via closure
// ---------------------------------------------------------------------------
function makeCounter() {
  let count = 0; // lives inside the closure; not accessible from outside

  return function () {
    count += 1; // reads AND updates the captured variable
    return count;
  };
}

const next = makeCounter();
console.log("counter:", next(), next(), next()); // => counter: 1 2 3

// A second counter has an independent backpack
const other = makeCounter();
console.log("independent counter:", other()); // => independent counter: 1

// ---------------------------------------------------------------------------
// 2. The classic `var` loop bug and its fixes
// ---------------------------------------------------------------------------
// With `var`, there is ONE shared `i` — all closures see its final value.
const varFns = [];
for (var i = 0; i < 3; i++) {
  varFns.push(() => i);
}
console.log("var loop (buggy):", varFns.map((f) => f())); // => [3, 3, 3]

// With `let`, each iteration gets a FRESH binding — the intuitive result.
const letFns = [];
for (let j = 0; j < 3; j++) {
  letFns.push(() => j);
}
console.log("let loop (fixed):", letFns.map((f) => f())); // => [0, 1, 2]

// ---------------------------------------------------------------------------
// 3. Closures for data privacy — a tiny "module" with private state
// ---------------------------------------------------------------------------
function createTokenBudget(limit) {
  let used = 0; // private

  return {
    spend(n) {
      if (used + n > limit) throw new Error("Over budget");
      used += n;
      return limit - used; // remaining
    },
    remaining() {
      return limit - used;
    },
  };
}

const budget = createTokenBudget(100);
console.log("remaining after 30:", budget.spend(30)); // => 70
console.log("remaining after 50:", budget.spend(50)); // => 20
console.log("queried remaining:", budget.remaining()); // => 20
// There is no way to set `used` directly from out here — it is fully private.
