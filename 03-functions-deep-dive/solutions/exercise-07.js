// solutions/exercise-07.js — Recursive tree flattener (with iterative version)
// Run with:  node exercise-07.js

// Recursive flatten (pre-order): record this node, then recurse into children.
//   base case: a node with no children contributes just its own name.
//   recursive case: concat this name with the flattened children.
function flattenNames(node) {
  const names = [node.name]; // visit current node first (pre-order)
  for (const child of node.children) {
    names.push(...flattenNames(child)); // recurse
  }
  return names;
}

// Iterative version using an explicit stack — no recursion depth limit.
// Push children in REVERSE so they pop in original (left-to-right) order,
// preserving the same pre-order sequence as the recursive version.
function flattenNamesIterative(root) {
  const names = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    names.push(node.name);
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
  return names;
}

// --- Demonstration ---------------------------------------------------------
const callTree = {
  name: "root",
  children: [
    { name: "search", children: [] },
    {
      name: "plan",
      children: [
        { name: "fetch", children: [] },
        { name: "summarize", children: [] },
      ],
    },
  ],
};

const a = flattenNames(callTree);
const b = flattenNamesIterative(callTree);

console.log("recursive:", a);
// => [ 'root', 'search', 'plan', 'fetch', 'summarize' ]
console.log("iterative:", b);
// => [ 'root', 'search', 'plan', 'fetch', 'summarize' ]

console.log("match:", JSON.stringify(a) === JSON.stringify(b)); // => true

// Show the iterative version survives a deep tree that could risk the stack.
let deep = { name: "n0", children: [] };
let cursor = deep;
for (let i = 1; i < 20000; i++) {
  const child = { name: `n${i}`, children: [] };
  cursor.children.push(child);
  cursor = child;
}
console.log("deep tree leaf count via iteration:", flattenNamesIterative(deep).length);
// => 20000  (no stack overflow)

module.exports = { flattenNames, flattenNamesIterative };
