/**
 * ShopScope Lite — cart & store.
 * Session 2's search, filter and sort, plus a cart implemented twice:
 * a closure-based store (React-hook style) and a class service (Angular service style).
 * main.js is the "glue": it owns the state, wires events and re-renders.
 */
import "./base.css";
import "./style.css";
import { products } from "./data/products.js";
import { filterProducts, sortProducts, getCategories, computeStats } from "./lib/catalog.js";
import { debounce, makeCounter, memoize } from "./lib/fn.js";
import { cartCount } from "./lib/cart.js";
import { renderGrid, renderCategoryChips, renderStats } from "./ui/render.js";
import { renderCart } from "./ui/cart.js";
import { createCartStore } from "./store/createCartStore.js";
import { CartService } from "./store/CartService.js";

const els = {
  search: document.querySelector("#search"),
  sort: document.querySelector("#sort"),
  chips: document.querySelector("#chips"),
  count: document.querySelector("#count"),
  meter: document.querySelector("#search-meter"),
  grid: document.querySelector("#grid"),
  stats: document.querySelector("#stats"),
  cart: document.querySelector("#cart"),
  cartCount: document.querySelector("#cart-count"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  refSummary: document.querySelector("#ref-summary"),
  refLog: document.querySelector("#ref-log"),
  mutate: document.querySelector("#mutate"),
};

// Session 2's page state. `saved` holds wishlist ids and is replaced, never mutated.
const state = { query: "", category: "all", sort: "featured", saved: [] };
const categories = getCategories(products);

// memoize: the second lookup of the same id is a Map hit, not a scan of the array.
const findProduct = memoize((id) => products.find((product) => product.id === id));

// ---------- the cart: two implementations, one interface ----------

const MODES = {
  closure: { label: "createCartStore (React-hook style)", create: (lines) => createCartStore(lines) },
  service: { label: "CartService (Angular service style)", create: (lines) => new CartService(lines) },
};

let mode = "closure";
let cart = MODES[mode].create([]);
let unsubscribe = cart.subscribe(onCartChange);
let changeNumber = 0;

function switchMode(nextMode) {
  if (nextMode === mode) {
    return;
  }
  // The lines are frozen and never mutated, so handing the SAME array to the new store is safe.
  const lines = cart.getState();
  unsubscribe();
  mode = nextMode;
  cart = MODES[mode].create(lines);
  unsubscribe = cart.subscribe(onCartChange);
  logRef(`switched to ${MODES[mode].label}, same ${lines.length}-line array handed over`);
  renderModeToggle();
  renderAll();
}

function onCartChange(nextLines, prevLines) {
  // Immutable updates mean "did anything change?" is one === check, not a deep comparison.
  changeNumber += 1;
  const same = prevLines === nextLines;
  const reused = nextLines.filter((line) => prevLines.includes(line)).length;
  els.refSummary.innerHTML = `prevLines === nextLines → <code class="${same}">${same}</code>`;
  logRef(`#${changeNumber}  prev === next → ${same}  ·  ${reused} of ${nextLines.length} line objects reused`);
  renderAll();
}

function logRef(message) {
  const entries = [message, ...els.refLog.textContent.split("\n").filter(Boolean)].slice(0, 8);
  els.refLog.textContent = entries.join("\n");
}

// The mutation trap: change a line in place, the way you must NOT.
els.mutate.addEventListener("click", () => {
  const lines = cart.getState();
  if (lines.length === 0) {
    logRef("mutate: add something to the cart first");
    return;
  }
  try {
    lines[0].qty += 1;
    logRef(`mutate: lines[0].qty is now ${lines[0].qty}, but no new reference, no listener ran, the screen is stale`);
  } catch (error) {
    logRef(`mutate blocked → ${error.constructor.name}: ${error.message}`);
  }
});

// ---------- search, filters, sort ----------

const keystrokes = makeCounter();
const searches = makeCounter();

// debounce: wait until typing pauses for 250 ms, then search once with the latest text.
const runSearch = debounce((query) => {
  state.query = query;
  searches.increment();
  renderAll();
}, 250);

els.search.addEventListener("input", (event) => {
  keystrokes.increment();
  runSearch(event.target.value);
  renderMeter();
});

els.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderAll();
});

function selectCategory(category) {
  state.category = category;
  renderAll();
}

function toggleSaved(id) {
  state.saved = state.saved.includes(id) ? state.saved.filter((savedId) => savedId !== id) : [...state.saved, id];
  renderAll();
}

// ---------- rendering ----------

function renderMeter() {
  els.meter.textContent = `${keystrokes.value()} keystrokes · ${searches.value()} searches run`;
}

function renderModeToggle() {
  els.modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
}

els.modeButtons.forEach((button) => button.addEventListener("click", () => switchMode(button.dataset.mode)));

function renderAll() {
  const lines = cart.getState();
  const visible = sortProducts(filterProducts(products, state), state.sort);

  renderGrid(els.grid, visible, {
    saved: state.saved,
    quantities: new Map(lines.map((line) => [line.id, line.qty])),
    onToggleSave: toggleSaved,
    onAdd: cart.add, // a method passed as a callback, like onAdd={cart.add} in React
  });
  renderCategoryChips(els.chips, categories, state.category, selectCategory);
  renderStats(els.stats, computeStats(visible));
  els.count.textContent = `${visible.length} of ${products.length} products`;

  renderCart(els.cart, lines, {
    onIncrement: cart.increment,
    onDecrement: cart.decrement,
    onRemove: cart.remove,
    onClear: cart.clear,
  });
  els.cartCount.textContent = String(cartCount(lines));
  renderMeter();
}

renderModeToggle();
renderAll();
