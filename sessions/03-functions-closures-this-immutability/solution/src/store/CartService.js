/**
 * Cart store, "Angular service style": a class with private fields and methods.
 * Same interface as createCartStore, so the UI cannot tell them apart.
 *
 * Methods live on CartService.prototype and look up `this` when they are
 * CALLED, not where they were written. The UI passes them around as plain
 * callbacks (onAdd: cart.add), which loses `this`, so the constructor binds them.
 */
import { addLine, changeQty, removeLine, freezeLines } from "../lib/cart.js";

export class CartService {
  #lines;
  #listeners = new Set();

  constructor(initialLines = []) {
    this.#lines = freezeLines(initialLines);

    // Explicit binding: each instance gets its own copies with `this` fixed to it.
    this.add = this.add.bind(this);
    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
    this.remove = this.remove.bind(this);
    this.clear = this.clear.bind(this);
  }

  getState() {
    return this.#lines;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    // An arrow function has no `this` of its own: it uses subscribe's `this`, the service.
    return () => this.#listeners.delete(listener);
  }

  add(product) {
    const next = addLine(this.#lines, product); // pure: work out the new lines
    this.#set(next); // side effect: store them and notify
  }

  increment(id) {
    const next = changeQty(this.#lines, id, +1);
    this.#set(next);
  }

  decrement(id) {
    const next = changeQty(this.#lines, id, -1);
    this.#set(next);
  }

  remove(id) {
    const next = removeLine(this.#lines, id);
    this.#set(next);
  }

  clear() {
    const next = this.#lines.length === 0 ? this.#lines : [];
    this.#set(next);
  }

  // A private method: callable only from inside the class body.
  #set(next) {
    if (next === this.#lines) {
      return;
    }
    const prev = this.#lines;
    this.#lines = freezeLines(next);
    this.#listeners.forEach((listener) => listener(this.#lines, prev));
  }
}
