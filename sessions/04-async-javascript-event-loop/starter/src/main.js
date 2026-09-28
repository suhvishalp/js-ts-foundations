/**
 * ShopScope Lite — live catalogue.
 * Session 3's cart and cards, with the products now coming from the network.
 * main.js is the "glue": it owns the state, starts requests, wires events and re-renders.
 */
import "./base.css";
import "./style.css";
import { getProducts, getCategories, searchProducts, getByCategory } from "./api/products.js";
import { network, onNetworkEvent, withRetry, isAbortError } from "./api/client.js";
import { filterProducts, describeQuery } from "./lib/catalog.js";
import { debounce } from "./lib/fn.js";
import { cartCount } from "./lib/cart.js";
import { fromEvent } from "./lib/observable.js";
import { renderGrid, renderSkeletons, renderState, renderCategoryOptions } from "./ui/render.js";
import { renderCart } from "./ui/cart.js";
import { appendLogLine, formatNetworkEvent } from "./ui/log.js";
import { createCartStore } from "./store/createCartStore.js";
import { runEventLoopPuzzle, MY_PREDICTION, EXPLANATION } from "./eventloop.js";

const els = {
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  slow: document.querySelector("#slow"),
  cancelStale: document.querySelector("#cancel-stale"),
  fail: document.querySelector("#fail"),
  count: document.querySelector("#count"),
  grid: document.querySelector("#grid"),
  cart: document.querySelector("#cart"),
  cartCount: document.querySelector("#cart-count"),
  netlog: document.querySelector("#netlog"),
  clearLog: document.querySelector("#clear-log"),
  runLoop: document.querySelector("#run-loop"),
  loopLog: document.querySelector("#loop-log"),
};

// ---------- state: one object, one status ----------

/**
 * status is exactly one of "loading" | "success" | "error" | "empty".
 * One field instead of isLoading + hasError booleans means impossible
 * combinations ("loading AND error") cannot happen.
 */
let state = {
  status: "loading",
  products: [],
  error: null,
  query: "",
  category: "all",
  shown: "all products", // what the grid is showing right now, in words
  saved: [], // wishlist ids, from Session 2
};
let haveCategories = false;

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

const cart = createCartStore(); // Session 3's closure store, unchanged
cart.subscribe(() => render());

function render() {
  const lines = cart.getState();

  switch (state.status) {
    case "loading":
      renderSkeletons(els.grid, 8);
      els.count.textContent = "Loading…";
      break;
    case "error":
      renderState(els.grid, {
        tone: "error",
        title: "Could not load products",
        message: `${state.error.message}. Check your connection, then try again.`,
        onRetry: () => refresh(),
      });
      els.count.textContent = "—";
      break;
    case "empty":
      renderState(els.grid, {
        title: "No products match",
        message: `Nothing found for ${state.shown}. Try another word or category.`,
      });
      els.count.textContent = `0 products · ${state.shown}`;
      break;
    case "success":
      renderGrid(els.grid, state.products, {
        saved: state.saved,
        quantities: new Map(lines.map((line) => [line.id, line.qty])),
        onToggleSave: toggleSaved,
        onAdd: cart.add,
      });
      els.count.textContent = `${state.products.length} products · ${state.shown}`;
      break;
  }

  renderCart(els.cart, lines, {
    onIncrement: cart.increment,
    onDecrement: cart.decrement,
    onRemove: cart.remove,
    onClear: cart.clear,
  });
  els.cartCount.textContent = String(cartCount(lines));
}

function toggleSaved(id) {
  const saved = state.saved.includes(id) ? state.saved.filter((savedId) => savedId !== id) : [...state.saved, id];
  setState({ saved });
}

// ---------- loading data ----------

/** First load: two independent requests, started together. */
async function loadCatalogue(signal) {
  // TODO(lab-3.1): these two requests do not depend on each other, yet the second
  // waits for the first to finish. Start both at once with Promise.all.
  const products = await getProducts({ signal });
  const categories = await getCategories({ signal });
  renderCategoryOptions(els.category, categories);
  haveCategories = true;
  return products;
}

/** Picks the endpoint for the current query and category. Returns (signal) => Promise<products>. */
function requestFor({ query, category }) {
  if (query) {
    // The search endpoint cannot filter by category, so narrow its results here.
    return (signal) => searchProducts(query, { signal }).then((list) => filterProducts(list, { category }));
  }
  if (category !== "all") return (signal) => getByCategory(category, { signal });
  return haveCategories ? (signal) => getProducts({ signal }) : loadCatalogue;
}

let controller = null;

async function refresh(patch = {}) {
  state = { ...state, ...patch };

  // TODO(lab-3.3): a new request makes the previous one stale: abort it
  // (only when the "Cancel stale requests" box is ticked).
  controller = new AbortController();
  const { signal } = controller;

  const request = requestFor(state);
  const shown = describeQuery(state);
  // TODO(lab-2.3): make this a state machine: "loading" first, then "success" or
  // "empty", or "error" in a catch (ignoring AbortError). Right now it is always "success".
  // TODO(lab-4.3): wrap request(signal) in withRetry(), logging each retry.
  const products = await request(signal);
  setState({ status: "success", products, shown });
}

// ---------- toolbar ----------

// TODO(lab-3.4): search as you type, debounced. Right now a search only runs when
// you press Enter (the "change" event).
// TODO(lab-5.3): swap both addEventListener calls for fromEvent(...).subscribe(...).
els.search.addEventListener("change", (event) => refresh({ query: event.target.value.trim() }));
els.category.addEventListener("change", (event) => refresh({ category: event.target.value }));

els.slow.addEventListener("change", () => {
  network.slow = els.slow.checked;
});
els.fail.addEventListener("change", () => {
  network.fail = els.fail.checked;
});

// ---------- network log ----------

onNetworkEvent((event) => {
  const { text, tone } = formatNetworkEvent(event);
  appendLogLine(els.netlog, text, tone);
});
els.clearLog.addEventListener("click", () => els.netlog.replaceChildren());

// ---------- event loop puzzle ----------

const toneFor = (line) => (line.includes("microtask") ? "micro" : line.includes("task") ? "task" : "sync");

els.runLoop.addEventListener("click", async () => {
  els.loopLog.replaceChildren();
  const actual = [];

  await runEventLoopPuzzle((line) => {
    actual.push(line[0]); // the letter
    appendLogLine(els.loopLog, line, toneFor(line));
  });

  const correct = actual.join("") === MY_PREDICTION.join("");
  appendLogLine(els.loopLog, "");
  appendLogLine(els.loopLog, `Actual order:    ${actual.join(" ")}`, "ok");
  appendLogLine(els.loopLog, `Your prediction: ${MY_PREDICTION.join(" ")} ${correct ? "✓" : "✕"}`, correct ? "ok" : "err");
  appendLogLine(els.loopLog, "");
  EXPLANATION.forEach((line) => appendLogLine(els.loopLog, line, "note"));
});

// ---------- go ----------

refresh();
