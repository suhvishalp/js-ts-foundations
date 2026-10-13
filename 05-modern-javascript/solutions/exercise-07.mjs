// solutions/exercise-07.mjs — Immutable agent-state reducer
// Run: node solutions/exercise-07.mjs

// Every case returns a NEW state object, spreading each level that changes so
// no original object (or nested object) is ever mutated. Unknown actions
// return the SAME reference — a cheap "nothing changed" signal for callers.
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };

    case 'ADD_USAGE':
      return {
        ...state,
        usage: {
          ...state.usage,
          promptTokens: state.usage.promptTokens + (action.prompt ?? 0),
          completionTokens: state.usage.completionTokens + (action.completion ?? 0),
        },
      };

    case 'SET_TOOL':
      return { ...state, tools: { ...state.tools, [action.name]: action.enabled } };

    default:
      return state; // same reference — no change
  }
}

function initialState() {
  return { messages: [], usage: { promptTokens: 0, completionTokens: 0 }, tools: {} };
}

// --- checks ---
const s = initialState();

const s1 = reducer(s, { type: 'ADD_MESSAGE', message: { role: 'user', content: 'hi' } });
console.log('original messages:', s.messages.length);  // => 0  (untouched)
console.log('new messages:', s1.messages.length);      // => 1
console.log('new object:', s !== s1);                  // => true

const s2 = reducer(s1, { type: 'ADD_USAGE', prompt: 10, completion: 4 });
console.log('usage:', s2.usage);                       // => { promptTokens: 10, completionTokens: 4 }
console.log('usage untouched on s1:', s1.usage.promptTokens); // => 0
console.log('nested new reference:', s1.usage !== s2.usage);  // => true

const s3 = reducer(s2, { type: 'SET_TOOL', name: 'search', enabled: true });
console.log('tools:', s3.tools);                       // => { search: true }

const s4 = reducer(s3, { type: 'UNKNOWN' });
console.log('unknown returns same reference:', s3 === s4); // => true

export { reducer, initialState };
