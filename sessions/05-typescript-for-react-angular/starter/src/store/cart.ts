/**
 * The cart, built on createStore. Changes go through ACTIONS and a pure reducer:
 * the same shape as React's useReducer and an NgRx reducer.
 */
import { createStore } from './createStore';
import { discountedPrice } from '../lib/format';
import type { CartLine } from '../types';

export interface CartState {
  readonly lines: readonly CartLine[];
}

// TODO(lab-5.2): one loose shape for every action means { type: 'ad' } compiles, and so does
// { type: 'add' } with no product. Make CartAction a discriminated union of
// add (product: Product) | increment (id) | decrement (id) | remove (id) | clear,
// then replace `default: return state` with `default: return assertNever(action)` (from ../lib/assert).
export type CartAction = { type: string; product?: any; id?: any };

export const emptyCart: CartState = { lines: [] };

/** Pure and immutable: returns a new state, never edits the old one. */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { id, title, thumbnail, price, discountPercentage } = action.product;
      const existing = state.lines.find((line) => line.id === id);
      return existing
        ? { lines: state.lines.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line)) }
        : { lines: [...state.lines, { id, title, thumbnail, price: discountedPrice(price, discountPercentage), qty: 1 }] };
    }
    case 'increment':
      return { lines: state.lines.map((line) => (line.id === action.id ? { ...line, qty: line.qty + 1 } : line)) };
    case 'decrement':
      return {
        lines: state.lines
          .map((line) => (line.id === action.id ? { ...line, qty: line.qty - 1 } : line))
          .filter((line) => line.qty > 0),
      };
    case 'remove':
      return { lines: state.lines.filter((line) => line.id !== action.id) };
    case 'clear':
      return emptyCart;
    default:
      return state;
  }
}

export function cartTotals(state: CartState): { count: number; total: number } {
  return state.lines.reduce(
    (acc, line) => ({ count: acc.count + line.qty, total: acc.total + line.qty * line.price }),
    { count: 0, total: 0 },
  );
}

export function createCartStore() {
  const store = createStore(emptyCart);
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    dispatch(action: CartAction): void {
      store.setState((state) => cartReducer(state, action));
    },
  };
}

/** The type of the object above, derived instead of written twice. */
export type CartStore = ReturnType<typeof createCartStore>;
