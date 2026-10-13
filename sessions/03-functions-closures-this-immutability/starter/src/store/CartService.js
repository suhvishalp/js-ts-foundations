/**
 * Cart store, "Angular service style": a class with private fields and methods.
 * Same interface as createCartStore, so the UI cannot tell them apart.
 *
 * Methods live on CartService.prototype and look up `this` when they are
 * CALLED, not where they were written. The UI passes them around as plain
 * callbacks (onAdd: cart.add), which loses `this`...
 */
import { addLine, changeQty, removeLine, freezeLines } from "../lib/cart.js";

export class CartService {
  #lines;
  #listeners = new Set();

  constructor(initialLines = []) {
    this.#lines = freezeLines(initialLines);

    // TODO(lab-3.12): the `this` bug. Switch the panel to "CartService" and click "Add to cart":
    // TypeError: Cannot read properties of undefined (reading '#lines'). Fix it here by binding
    // add, increment, decrement, remove and clear to this instance.
  }

  getState() {
    return this.#lines;
  }

  subscribe(listener) {
    // TODO(lab-3.10): add the listener to #listeners and return an unsubscribe arrow function.
    return () => {};
  }

  // TODO(lab-3.11): implement the five actions with #set and the pure helpers from lib/cart.js.
  // The stubs already read `this`, so the lab-3.12 bug shows up before they do anything useful.
  add(product) {
    const next = this.#lines;
    this.#set(next);
  }

  increment(id) {
    const next = this.#lines;
    this.#set(next);
  }

  decrement(id) {
    const next = this.#lines;
    this.#set(next);
  }

  remove(id) {
    const next = this.#lines;
    this.#set(next);
  }

  clear() {
    const next = this.#lines;
    this.#set(next);
  }

  // A private method: callable only from inside the class body.
  #set(next) {
    // TODO(lab-3.10): skip same-reference updates, swap #lines (frozen), and notify every
    // listener with (this.#lines, prev), exactly like setLines in createCartStore.
  }
}
