import './base.css';
import './style.css';
import { isAbortError, toApiError, withRetry } from './api/client';
import { describeQuery, getCatalog, getCategories } from './api/products';
import { $ } from './lib/dom';
import { byId, debounce } from './lib/fn';
import { createStore } from './store/createStore';
import { cartTotals, createCartStore } from './store/cart';
import { renderCart, renderCategories, renderLog, renderProducts, statusText } from './ui/render';
import type { CatalogQuery, LogEntry, Product, RequestState } from './types';

// ---------- the DOM, typed once ----------
// Each element type is named once here; from then on `els.search.value` is a checked string.
const els = {
  search: $<HTMLInputElement>('#search'),
  category: $<HTMLSelectElement>('#category'),
  fail: $<HTMLInputElement>('#simulate-failure'),
  count: $('#count'),
  grid: $('#grid'),
  cart: $<HTMLUListElement>('#cart'),
  cartTotal: $('#cart-total'),
  cartCount: $('#cart-count'),
  clearCart: $<HTMLButtonElement>('#clear-cart'),
  log: $('#log'),
  clearLog: $<HTMLButtonElement>('#clear-log'),
};

// ---------- state: the SAME generic store, three different T's ----------
const catalog = createStore<RequestState<Product[]>>({ status: 'idle' });
const cart = createCartStore();
const log = createStore<readonly LogEntry[]>([]);

let query: CatalogQuery = { q: '', category: 'all' };
let controller: AbortController | undefined;
let nextLogId = 1;

/** Omit: the caller supplies kind and text; id and time are filled in here. */
function addLog(entry: Omit<LogEntry, 'id' | 'at'>): void {
  log.setState((entries) => [...entries.slice(-49), { ...entry, id: nextLogId++, at: new Date() }]);
}

// ---------- loading, with cancellation and retries ----------
/** Awaited<ReturnType<…>>: what getCatalog resolves to (Product[]), derived instead of repeated. */
type CatalogResult = Awaited<ReturnType<typeof getCatalog>>;

/** Partial: pass only what changed, e.g. `load({ q: 'phone' })`. */
async function load(patch: Partial<CatalogQuery> = {}): Promise<void> {
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
    const products: CatalogResult = await withRetry(() => getCatalog(query, { signal: ctrl.signal, simulateFailure }), {
      signal: ctrl.signal,
      onRetry: (attempt, error) => addLog({ kind: 'retry', text: `retry ${attempt} after ${error.message}` }),
    });
    const ms = Math.round(performance.now() - started);
    addLog({ kind: 'success', text: `200 ${label} · ${products.length} items · ${ms} ms` });
    catalog.setState(() => ({ status: 'success', data: products }));
  } catch (err: unknown) {
    // `err` is unknown: TypeScript makes you find out what it is before you use it.
    if (isAbortError(err)) {
      addLog({ kind: 'abort', text: `aborted ${label}` });
      return; // a newer request owns the screen now
    }
    const error = toApiError(err, label);
    addLog({ kind: 'error', text: `${error.status || 'network'} ${label} · ${error.message}` });
    catalog.setState(() => ({ status: 'error', error }));
  }
}

/** Only the parameter type is written; debounce<[string]> is inferred from it. */
const searchSoon = debounce((q: string) => void load({ q: q.trim() }), 300);

// ---------- rendering: subscribe once, render on every change ----------
catalog.subscribe((state) => {
  renderProducts(els.grid, state, { onRetry: () => void load() });
  els.count.textContent = statusText(state);
});

cart.subscribe((state) => {
  const { count, total } = cartTotals(state);
  renderCart(els.cart, els.cartTotal, state, total);
  els.cartCount.textContent = String(count);
  els.clearCart.disabled = count === 0;
});

log.subscribe((entries) => renderLog(els.log, entries));

// ---------- events ----------
// No annotations needed: from the event name, TypeScript infers `event` as Event, MouseEvent or KeyboardEvent.
els.search.addEventListener('input', () => searchSoon(els.search.value));
els.category.addEventListener('change', () => void load({ category: els.category.value }));
els.fail.addEventListener('change', () => void load());

els.grid.addEventListener('click', (event) => {
  // event.target is `EventTarget | null`: it could be text, the window, anything. Narrow it.
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-add]');
  if (!button) return;
  const state = catalog.getState();
  if (state.status !== 'success') return; // narrowing: after this line, state.data exists
  const product = byId(state.data, Number(button.dataset.add));
  if (product) cart.dispatch({ type: 'add', product });
});

els.cart.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const { inc, dec } = event.target.dataset; // dataset values are `string | undefined`
  if (inc) cart.dispatch({ type: 'increment', id: Number(inc) });
  if (dec) cart.dispatch({ type: 'decrement', id: Number(dec) });
});

els.clearCart.addEventListener('click', () => cart.dispatch({ type: 'clear' }));
els.clearLog.addEventListener('click', () => log.setState(() => []));

document.addEventListener('keydown', (event) => {
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
  .catch((err: unknown) => addLog({ kind: 'error', text: `categories · ${toApiError(err).message}` }));

void load();
