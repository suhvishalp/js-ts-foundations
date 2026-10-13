// examples/immutable-updates.mjs
// Run with: node examples/immutable-updates.mjs
//
// Mutation vs immutable updates: arrays, objects, nested paths, copying
// array methods, Object.freeze, and a reducer-style agent state loop.

// --- Immutable object update -----------------------------------------------
const s0 = { count: 0, tags: ['a'] };
const s1 = { ...s0, count: 1 };                // new object, count changed
const s2 = { ...s1, tags: [...s1.tags, 'b'] }; // new array, item appended
console.log('s0:', s0); // => s0: { count: 0, tags: [ 'a' ] }  (untouched)
console.log('s2:', s2); // => s2: { count: 1, tags: [ 'a', 'b' ] }

// --- Immutable array operations --------------------------------------------
const arr = [1, 2, 3];
console.log('append:', [...arr, 4]);                     // => [ 1, 2, 3, 4 ]
console.log('prepend:', [0, ...arr]);                    // => [ 0, 1, 2, 3 ]
console.log('remove:', arr.filter((x) => x !== 2));      // => [ 1, 3 ]
console.log('update:', arr.map((x) => (x === 2 ? 20 : x))); // => [ 1, 20, 3 ]
console.log('original unchanged:', arr);                 // => [ 1, 2, 3 ]

// ES2023 copying methods (non-mutating variants)
const data = [3, 1, 2];
console.log('toSorted:', data.toSorted()); // => [ 1, 2, 3 ]
console.log('with:', data.with(0, 99));    // => [ 99, 1, 2 ]
console.log('data still:', data);          // => [ 3, 1, 2 ]

// --- Nested immutable update (spread is shallow — rebuild each level) -------
const agent = {
  id: 'a1',
  memory: { shortTerm: ['hi'], profile: { name: 'Ada', tokens: 0 } },
};
const next = {
  ...agent,
  memory: {
    ...agent.memory,
    profile: { ...agent.memory.profile, tokens: 100 },
  },
};
console.log('orig tokens:', agent.memory.profile.tokens); // => 0
console.log('next tokens:', next.memory.profile.tokens);  // => 100
console.log('new reference:', agent.memory !== next.memory); // => true

// --- Object.freeze (shallow) -----------------------------------------------
// In strict mode (all ESM modules are strict), writing to a frozen property
// THROWS. In sloppy mode it is silently ignored. We catch it to keep going.
const frozen = Object.freeze({ a: 1 });
try {
  frozen.a = 2;
} catch (err) {
  console.log('freeze blocked write:', err.constructor.name); // => TypeError
}
console.log('frozen:', frozen.a); // => 1

// --- Reducer-style agent state loop ----------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'INCREMENT_TOKENS':
      return { ...state, usage: { ...state.usage, tokens: state.usage.tokens + action.n } };
    default:
      return state; // unknown action → same reference (cheap "no change")
  }
}

let state = { messages: [], usage: { tokens: 0 } };
state = reducer(state, { type: 'ADD_MESSAGE', message: { role: 'user', content: 'hi' } });
state = reducer(state, { type: 'INCREMENT_TOKENS', n: 5 });
console.log('final state:', JSON.stringify(state));
// => final state: {"messages":[{"role":"user","content":"hi"}],"usage":{"tokens":5}}
