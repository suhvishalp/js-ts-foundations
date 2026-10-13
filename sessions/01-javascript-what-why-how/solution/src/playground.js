/**
 * The JS Playground: small experiments that prove (or disprove) what people believe about JavaScript.
 * Each one has the code you would type, a function that really runs it, and why the result is what it is.
 */
export const experiments = [
  {
    code: "typeof null",
    run: () => typeof null,
    why: "A bug from JavaScript's first version in 1995. Fixing it would break existing websites, so it stays.",
  },
  {
    code: "0.1 + 0.2",
    run: () => 0.1 + 0.2,
    why: "Numbers are binary floating point (IEEE 754), as in Python, Java and C. 0.1 has no exact binary form.",
  },
  {
    code: "0.1 + 0.2 === 0.3",
    run: () => 0.1 + 0.2 === 0.3,
    why: "So never compare money as decimals. Work in cents, or round before you compare.",
  },
  {
    code: '"5" == 5',
    run: () => "5" == 5,
    why: "== converts the types first (coercion), then compares. The rules are long and surprising.",
  },
  {
    code: '"5" === 5',
    run: () => "5" === 5,
    why: "=== compares type AND value, with no conversion. Use === every time.",
  },
  {
    code: "[] + {}",
    run: () => [] + {},
    why: '+ turns objects into strings first: "" + "[object Object]". Not a bug; a rule worth knowing.',
  },
  {
    code: "typeof function () {}",
    run: () => typeof function () {},
    why: "Functions are objects you can call. typeof gives them their own label, and you can pass them around like any value.",
  },
  {
    code: 'typeof "shop"',
    run: () => typeof "shop",
    why: 'Not everything is an object. Strings, numbers and booleans are primitives; "shop".toUpperCase() borrows a temporary wrapper.',
  },
  {
    code: '[false, 0, -0, 0n, "", null, undefined, NaN].map(Boolean)',
    run: () => [false, 0, -0, 0n, "", null, undefined, NaN].map(Boolean),
    why: "The complete list of falsy values. Everything else is truthy.",
  },
  {
    code: 'Boolean("0") && Boolean([]) && Boolean({})',
    run: () => Boolean("0") && Boolean([]) && Boolean({}),
    why: 'The string "0", an empty array and an empty object are all truthy. Check .length when you mean "empty".',
  },
  {
    code: 'setTimeout(() => order.push("B"), 0); order.push("A")',
    run: () =>
      new Promise((resolve) => {
        const order = [];
        setTimeout(() => {
          order.push("B");
          resolve(order);
        }, 0);
        order.push("A");
      }),
    why: "One thread, never blocked: the timer callback waits in a queue until the current code finishes. Session 4 goes deep.",
  },
];

/** Shows a value the way the console would: strings in quotes, arrays with brackets. */
function show(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
  return String(value);
}

function createEntry(experiment, result, index) {
  const entry = document.createElement("div");
  entry.className = "entry";
  entry.style.setProperty("--i", index); // staggers the fade-in, see style.css

  const code = document.createElement("div");
  code.className = "entry-code";
  code.textContent = `> ${experiment.code}`;

  const output = document.createElement("div");
  output.className = "entry-result";
  output.textContent = `← ${result}`;

  const why = document.createElement("div");
  why.className = "entry-why";
  why.textContent = `// ${experiment.why}`;

  entry.append(code, output, why);
  return entry;
}

/** Runs every experiment, in order, and prints each result into the log element. */
export async function runPlayground(logEl) {
  logEl.replaceChildren();
  for (const [index, experiment] of experiments.entries()) {
    const result = await experiment.run(); // await: the setTimeout experiment finishes later
    logEl.append(createEntry(experiment, show(result), index));
  }
}
