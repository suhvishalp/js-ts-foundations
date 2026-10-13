// Exercise 2 — Type an LLM message and conversation
// Run: npx tsx exercise-02-chat-message.ts

// A literal union: only these four strings are valid roles.
// Typos like "usr" become compile errors, and editors autocomplete the options.
type Role = "system" | "user" | "assistant" | "tool";

// The canonical chat message shape used by most LLM APIs.
interface ChatMessage {
  role: Role;
  content: string;
  name?: string; // optional: used for tool/function messages
}

const conversation: ChatMessage[] = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What is a vector embedding?" },
];

// Immutable append: return a NEW array rather than mutating the input.
// Pure functions like this are easier to test and reason about.
function addUserMessage(convo: ChatMessage[], text: string): ChatMessage[] {
  return [...convo, { role: "user", content: text }];
}

const next = addUserMessage(conversation, "Explain it simply.");

console.log("Original length:", conversation.length); // 2 (unchanged)
console.log("New length:", next.length); // 3
console.log("Last message:", next[next.length - 1]);
// { role: 'user', content: 'Explain it simply.' }

// The following would each be a COMPILE error (uncomment to see):
// conversation.push({ role: "usr", content: "hi" });   // 'usr' not a Role
// conversation.push({ role: "user" });                  // missing 'content'

export { Role, ChatMessage, addUserMessage };
