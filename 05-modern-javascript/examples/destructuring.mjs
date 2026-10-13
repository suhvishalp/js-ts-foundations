// examples/destructuring.mjs
// Run with: node examples/destructuring.mjs
//
// Demonstrates array/object destructuring, nesting, defaults, aliasing,
// destructuring in params, and swapping — with an LLM-response example.

// --- Array destructuring ---------------------------------------------------
const coords = [10, 20, 30];
const [x, y, z] = coords;
console.log('array:', x, y, z); // => array: 10 20 30

const [first, , third] = coords; // skip the middle element
console.log('skip:', first, third); // => skip: 10 30

const [a = 1, b = 2, c = 3] = [100]; // defaults for missing
console.log('defaults:', a, b, c); // => defaults: 100 2 3

// Swap without a temp variable
let m = 1, n = 2;
[m, n] = [n, m];
console.log('swap:', m, n); // => swap: 2 1

// --- Object destructuring --------------------------------------------------
const user = { id: 42, name: 'Ada', role: 'admin' };

const { name, role } = user;
console.log('obj:', name, role); // => obj: Ada admin

const { name: userName } = user; // alias
console.log('alias:', userName); // => alias: Ada

const { locale: lang = 'en' } = user; // alias + default
console.log('alias+default:', lang); // => alias+default: en

// --- Nested destructuring on a mock chat-completion response ----------------
const response = {
  id: 'chatcmpl-123',
  choices: [
    { index: 0, message: { role: 'assistant', content: 'Hello there!' } },
  ],
  usage: { prompt_tokens: 12, completion_tokens: 8 },
};

const {
  choices: [{ message: { content } }],
  usage: { completion_tokens },
} = response;
console.log('content:', content); // => content: Hello there!
console.log('completion_tokens:', completion_tokens); // => completion_tokens: 8

// --- Destructuring in function parameters ----------------------------------
function createCompletion({ model = 'gpt-4o', temperature = 0.7, maxTokens = 256 } = {}) {
  return `model=${model} temp=${temperature} max=${maxTokens}`;
}
console.log(createCompletion()); // => model=gpt-4o temp=0.7 max=256
console.log(createCompletion({ temperature: 0 })); // => model=gpt-4o temp=0 max=256

// --- Nested params: handling a tool-use event ------------------------------
const event = {
  type: 'tool_use',
  tool: { name: 'get_weather', arguments: { city: 'Berlin', unit: 'c' } },
};
function handleToolCall({ tool: { name, arguments: args } }) {
  const { city, unit = 'c' } = args;
  return `Calling ${name} for ${city} in ${unit}`;
}
console.log(handleToolCall(event)); // => Calling get_weather for Berlin in c
