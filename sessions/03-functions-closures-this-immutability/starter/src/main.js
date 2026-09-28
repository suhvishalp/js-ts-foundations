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
  // TODO(lab-3.13): the reference check. Count the change, compare prevLines === nextLines,
  // count how many line objects were reused, show the result in #ref-summary and logRef() it.
  renderAll();
}

function logRef(message) {
  const entries = [message, ...els.refLog.textContent.split("\n").filter(Boolean)].slice(0, 8);
  els.refLog.textContent = entries.join("\n");
}

// The mutation trap: change a line in place, the way you must NOT.
els.mutate.addEventListener("click", () => {
  // TODO(lab-3.14): grab cart.getState(), bump lines[0].qty in place inside try/catch,
  // and logRef() what happened (or the error, once lab 3.15 freezes the lines).
  logRef("mutate: not wired yet (lab 3.14)");
});

// ---------- search, filters, sort ----------

const keystrokes = makeCounter();
const searches = makeCounter();

// TODO(lab-3.4): Session 2 searches on EVERY keystroke. Wrap the search in debounce(…, 250),
// count keystrokes and searches with the two counters, and call renderMeter() on input.
els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderAll();
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
