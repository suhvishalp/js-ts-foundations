// this-binding.js — runnable with:  node this-binding.js
//
// A tour of how `this` is determined, and the arrow-vs-regular distinction.

"use strict";

// ---------------------------------------------------------------------------
// 1. Method call: `this` is the object left of the dot.
// ---------------------------------------------------------------------------
const model = {
  name: "gpt-mini",
  describe() {
    return `model: ${this.name}`;
  },
};
console.log(model.describe()); // => "model: gpt-mini"

// ---------------------------------------------------------------------------
// 2. Losing `this`: passing a method as a bare callback.
// ---------------------------------------------------------------------------
const describeFn = model.describe;
try {
  describeFn(); // called as a plain function => `this` is undefined (strict)
} catch (e) {
  console.log("bare call throws:", e.constructor.name); // => TypeError
}

// Fixes:
console.log(describeFn.call(model)); // => "model: gpt-mini" (call sets this)
const boundDescribe = model.describe.bind(model);
console.log(boundDescribe()); // => "model: gpt-mini" (bind fixes this)

// ---------------------------------------------------------------------------
// 3. Regular vs arrow callback inside a method.
// ---------------------------------------------------------------------------
const trainer = {
  name: "trainer-1",
  epochs: [1, 2, 3],

  reportRegular() {
    const out = [];
    // Regular callback: `this` is NOT trainer inside forEach.
    this.epochs.forEach(function (e) {
      // this.name would be undefined here; capture via closure instead
      out.push(`epoch ${e}`);
    });
    return out;
  },

  reportArrow() {
    const out = [];
    // Arrow callback: inherits `this` from reportArrow => trainer.
    this.epochs.forEach((e) => {
      out.push(`${this.name} epoch ${e}`);
    });
    return out;
  },
};

console.log(trainer.reportRegular());
// => [ 'epoch 1', 'epoch 2', 'epoch 3' ]
console.log(trainer.reportArrow());
// => [ 'trainer-1 epoch 1', 'trainer-1 epoch 2', 'trainer-1 epoch 3' ]

// ---------------------------------------------------------------------------
// 4. Do NOT use an arrow as a method that needs `this`.
// ---------------------------------------------------------------------------
const brokenCounter = {
  count: 0,
  inc: () => {
    // `this` here is the module scope, not brokenCounter.
    return typeof this === "undefined" || this.count === undefined
      ? "no this.count"
      : this.count;
  },
};
console.log("arrow method sees:", brokenCounter.inc()); // => "no this.count"

// ---------------------------------------------------------------------------
// 5. call vs apply — same effect, different argument shape.
// ---------------------------------------------------------------------------
function tag(prefix, suffix) {
  return `${prefix}${this.name}${suffix}`;
}
console.log(tag.call({ name: "A" }, "<", ">"));   // => "<A>"
console.log(tag.apply({ name: "B" }, ["<", ">"])); // => "<B>"
