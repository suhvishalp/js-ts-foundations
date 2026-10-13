import './base.css';
import './style.css';
import { isAbortError, toApiError, withRetry } from './api/client';
import { describeQuery, getCatalog, getCategories } from './api/products';
import { $ } from './lib/dom';
import { byId, debounce } from './lib/fn';
import { createStore } from './store/createStore';
import { cartTotals, createCartStore } from './store/cart';
import { renderCart, renderCategories, renderLog, renderProducts, statusText } from './ui/render';
import type { CatalogQuery } from './types';

// TODO(lab-5.4): type this file. Once $ is generic (lib/dom.ts), name each element type here:
// $<HTMLInputElement>('#search'), $<HTMLSelectElement>('#category'), $<HTMLButtonElement>('#clear-cart')…
// Then: type addLog with Omit and load with Partial, catch `unknown` instead of `any`, and delete
// every `: any` on a callback parameter so TypeScript infers it (and you narrow event.target).
// ---------- the DOM ----------
const els = {
  search: $('#search'),
  category: $('#category'),
  fail: $('#simulate-failure'),
  count: $('#count'),
  grid: $('#grid'),
  cart: $('#cart'),
  cartTotal: $('#cart-total'),
  cartCount: $('#cart-count'),
  clearCart: $('#clear-cart'),
  log: $('#log'),
  clearLog: $('#clear-log'),
};

// ---------- state: the same store, three different jobs ----------
// Lab 3 (createStore<T>) gives these stores their type arguments.
const catalog = createStore({ status: 'idle' });
const cart = createCartStore();
const log = createStore([]);

let query: CatalogQuery = { q: '', category: 'all' };
let controller: AbortController | undefined;
let nextLogId = 1;

/** The caller supplies kind and text; id and time are filled in here. */
function addLog(entry: any): void {
  log.setState((entries) => [...entries.slice(-49), { ...entry, id: nextLogId++, at: new Date() }]);
}

// ---------- loading, with cancellation and retries ----------
/** Pass only what changed, e.g. `load({ q: 'phone' })`. */
async function load(patch: any = {}): Promise<void> {
  query = { ...query, ...patch };
  const simulateFailure = els.fail.checked;
  const label = describeQuery(query, simulateFailure);

  controller?.abort(); // cancel the previous request: its answer is no longer wanted
  const ctrl = new AbortController();
  controller = ctrl;

  catalog.setState(() => ({ status: 'loading' }));
  addLog({ kind: 'request', text: `GET ${label}` });
  const started = performance.now();

  try {
    const products = await withRetry(() => getCatalog(query, { signal: ctrl.signal, simulateFailure }), {
      signal: ctrl.signal,
      onRetry: (attempt, error) => addLog({ kind: 'retry', text: `retry ${attempt} after ${error.message}` }),
    });
    const ms = Math.round(performance.now() - started);
    addLog({ kind: 'success', text: `200 ${label} · ${products.length} items · ${ms} ms` });
    catalog.setState(() => ({ status: 'success', data: products }));
  } catch (err: any) {
    if (isAbortError(err)) {
      addLog({ kind: 'abort', text: `aborted ${label}` });
      return; // a newer request owns the screen now
    }
    const error = toApiError(err, label);
    addLog({ kind: 'error', text: `${error.status || 'network'} ${label} · ${error.message}` });
    catalog.setState(() => ({ status: 'error', error }));
  }
}

const searchSoon = debounce((q: string) => void load({ q: q.trim() }), 300);

// ---------- rendering: subscribe once, render on every change ----------
catalog.subscribe((state: any) => {
  renderProducts(els.grid, state, { onRetry: () => void load() });
  els.count.textContent = statusText(state);
});

cart.subscribe((state: any) => {
  const { count, total } = cartTotals(state);
  renderCart(els.cart, els.cartTotal, state, total);
  els.cartCount.textContent = String(count);
  els.clearCart.disabled = count === 0;
});

log.subscribe((entries: any) => renderLog(els.log, entries));

// ---------- events ----------
els.search.addEventListener('input', () => searchSoon(els.search.value));
els.category.addEventListener('change', () => void load({ category: els.category.value }));
els.fail.addEventListener('change', () => void load());

els.grid.addEventListener('click', (event: any) => {
  const button = event.target.closest('button[data-add]');
  if (!button) return;
  const state = catalog.getState();
  if (state.status !== 'success') return;
  const product = byId(state.data, Number(button.dataset.add));
  if (product) cart.dispatch({ type: 'add', product });
});

els.cart.addEventListener('click', (event: any) => {
  const { inc, dec } = event.target.dataset;
  if (inc) cart.dispatch({ type: 'increment', id: Number(inc) });
  if (dec) cart.dispatch({ type: 'decrement', id: Number(dec) });
});

els.clearCart.addEventListener('click', () => cart.dispatch({ type: 'clear' }));
els.clearLog.addEventListener('click', () => log.setState(() => []));

document.addEventListener('keydown', (event: any) => {
  if (event.key === '/' && document.activeElement !== els.search) {
    event.preventDefault();
    els.search.focus();
  }
});

// ---------- start ----------
renderCart(els.cart, els.cartTotal, cart.getState(), 0);
renderLog(els.log, []);
renderProducts(els.grid, catalog.getState(), { onRetry: () => void load() });

getCategories()
  .then((categories) => renderCategories(els.category, categories))
  .catch((err: any) => addLog({ kind: 'error', text: `categories · ${toApiError(err).message}` }));

void load();
