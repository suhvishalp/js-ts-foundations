// solutions/exercise-01.mjs — Destructure a chat-completion response
// Run: node solutions/exercise-01.mjs

// `extract` pulls the assistant text and token counts out of a raw response.
// Nested destructuring reaches choices[0].message.content in one binding, and
// `usage = {}` plus per-field `= 0` defaults make missing usage safe.
function extract(response) {
  const {
    choices: [{ message: { content: text } }], // dig to the first message's content
    usage: { prompt_tokens: promptTokens = 0, completion_tokens: completionTokens = 0 } = {},
    //     ^ default {} so destructuring `usage` never throws when it's absent
  } = response;

  return { text, promptTokens, completionTokens };
}

// --- checks ---
const full = {
  id: 'chatcmpl-1',
  choices: [{ index: 0, message: { role: 'assistant', content: 'Hi!' } }],
  usage: { prompt_tokens: 10, completion_tokens: 3 },
};
console.log(extract(full));
// => { text: 'Hi!', promptTokens: 10, completionTokens: 3 }

const noUsage = { choices: [{ message: { content: 'x' } }] };
console.log(extract(noUsage));
// => { text: 'x', promptTokens: 0, completionTokens: 0 }
