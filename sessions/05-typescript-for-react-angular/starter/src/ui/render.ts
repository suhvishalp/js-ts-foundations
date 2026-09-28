/**
 * Rendering, by hand, from typed state. The same visuals as Session 4; the difference is
 * that the compiler now knows every shape these functions receive.
 */
import { categoryLabel, discountedPrice, formatPrice, STOCK_LABELS, stockLevel } from '../lib/format';
import type { ApiError } from '../api/client';
import type { CartState } from '../store/cart';
import type { Category, LogEntry, Product, RequestState } from '../types';

/** A typed wrapper around createElement: `el('button')` is an HTMLButtonElement, `el('img')` an HTMLImageElement. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function message(text: string, extraClass = ''): HTMLElement {
  return el('div', `state ${extraClass}`.trim(), text);
}

function skeletons(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => el('div', 'skeleton'));
}

function productCard(product: Product): HTMLElement {
  const card = el('article', 'card');

  const thumb = el('div', 'thumb');
  const img = el('img');
  img.src = product.thumbnail;
  img.alt = product.title;
  img.loading = 'lazy';
  thumb.append(img);

  const body = el('div', 'body');
  body.append(el('span', 'brand', product.brand ?? categoryLabel(product.category)));
  body.append(el('h3', '', product.title));

  const price = el('span', 'price', formatPrice(discountedPrice(product.price, product.discountPercentage)));
  if (product.discountPercentage > 0) price.append(el('s', '', formatPrice(product.price)));
  body.append(price);

  const level = stockLevel(product.stock);
  const row = el('div', 'row');
  const add = el('button', 'btn primary', 'Add to cart');
  add.type = 'button';
  add.dataset.add = String(product.id);
  add.disabled = level === 'out';
  row.append(el('span', `badge ${level}`, STOCK_LABELS[level] ?? level), add); // the `?? level` fallback goes away in Lab 4
  body.append(row);

  card.append(thumb, body);
  return card;
}

function errorState(error: ApiError, onRetry: () => void): HTMLElement {
  const box = message('', 'error');
  box.append(el('strong', '', 'Could not load products.'), el('p', '', `${error.message} · ${error.url || 'network'}`));
  const retry = el('button', 'btn primary', 'Try again');
  retry.type = 'button';
  retry.addEventListener('click', onRetry);
  box.append(retry);
  return box;
}

export interface ProductHandlers {
  onRetry: () => void;
}

// TODO(lab-5.2): with `status: string`, a typo like 'sucess' compiles, `data` might be undefined
// (hence the `?? []`), and nothing tells you when a state is not handled. Once RequestState is a
// discriminated union, rewrite both functions below as a `switch (state.status)` with one `case`
// per state and `default: assertNever(state)` (import it from '../lib/assert').
export function renderProducts(root: HTMLElement, state: RequestState<Product[]>, handlers: ProductHandlers): void {
  root.setAttribute('aria-busy', String(state.status === 'loading'));
  if (state.status === 'loading') {
    root.replaceChildren(...skeletons(8));
  } else if (state.status === 'success') {
    const data = state.data ?? [];
    root.replaceChildren(...(data.length === 0 ? [message('No products match your search.', 'empty')] : data.map(productCard)));
  } else if (state.status === 'error') {
    root.replaceChildren(errorState(state.error, handlers.onRetry));
  } else {
    root.replaceChildren(message('Pick a category or start typing to search the catalogue.'));
  }
}

/** The toolbar counter, derived from the same state. */
export function statusText(state: RequestState<Product[]>): string {
  if (state.status === 'loading') return 'Loading…';
  if (state.status === 'success') {
    const count = state.data?.length ?? 0;
    return `${count} ${count === 1 ? 'product' : 'products'}`;
  }
  if (state.status === 'error') return `Error ${state.error?.status || ''}`.trim();
  return 'Ready';
}

export function renderCategories(select: HTMLSelectElement, categories: readonly Category[]): void {
  const options = categories.map((slug) => {
    const option = el('option', '', categoryLabel(slug));
    option.value = slug;
    return option;
  });
  const all = el('option', '', 'All categories');
  all.value = 'all';
  select.replaceChildren(all, ...options);
}

export function renderCart(root: HTMLElement, totalEl: HTMLElement, state: CartState, total: number): void {
  if (state.lines.length === 0) {
    root.replaceChildren(el('p', 'cart-empty', 'Your cart is empty. Add something you like.'));
  } else {
    root.replaceChildren(
      ...state.lines.map((line) => {
        const item = el('li', 'cart-line');
        const img = el('img');
        img.src = line.thumbnail;
        img.alt = '';
        const info = el('div', 'cart-info');
        info.append(el('span', 'cart-title', line.title), el('span', 'cart-price', formatPrice(line.price * line.qty)));
        const qty = el('div', 'qty');
        const minus = el('button', 'qty-btn', '−');
        minus.type = 'button';
        minus.dataset.dec = String(line.id);
        minus.setAttribute('aria-label', `Remove one ${line.title}`);
        const plus = el('button', 'qty-btn', '+');
        plus.type = 'button';
        plus.dataset.inc = String(line.id);
        plus.setAttribute('aria-label', `Add one ${line.title}`);
        qty.append(minus, el('span', 'qty-n', String(line.qty)), plus);
        item.append(img, info, qty);
        return item;
      }),
    );
  }
  totalEl.textContent = formatPrice(total);
}

const LOG_ICONS = { request: '→', success: '✓', retry: '↻', abort: '✕', error: '!' } satisfies Record<LogEntry['kind'], string>;

export function renderLog(root: HTMLElement, entries: readonly LogEntry[]): void {
  if (entries.length === 0) {
    root.textContent = 'No requests yet.';
    return;
  }
  root.replaceChildren(
    ...entries.map((entry) => {
      const line = el('div', `log-line ${entry.kind}`);
      const time = entry.at.toLocaleTimeString('en-GB', { hour12: false });
      line.textContent = `${time} ${LOG_ICONS[entry.kind]} ${entry.text}`;
      return line;
    }),
  );
  root.scrollTop = root.scrollHeight;
}
