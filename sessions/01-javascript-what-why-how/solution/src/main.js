import "./base.css";
import "./style.css";
import { products } from "./data/products.js";
import { formatPrice, discountedPrice, stockStatus } from "./lib/format.js";
import { renderGrid } from "./ui/render.js";
import { runPlayground } from "./playground.js";

// ---- Find the elements index.html gave us ----
const grid = document.querySelector("#grid");
const productCount = document.querySelector("#product-count");
const wishlistCount = document.querySelector("#wishlist-count");
const logEl = document.querySelector("#log");

// ---- A self-check for format.js: open DevTools → Console ----
console.table([
  { call: "formatPrice(1899.99)", result: formatPrice(1899.99) },
  { call: "discountedPrice(9.99, 10.48)", result: discountedPrice(9.99, 10.48) },
  { call: "stockStatus(3).label", result: stockStatus(3).label },
]);

// ---- Render the catalogue ----
renderGrid(grid, products);
productCount.textContent = `${products.length} products`;

// ---- The wishlist: our state lives in one place, and we update the screen ourselves ----
const saved = new Set(); // product ids; a Set never holds the same id twice

function updateWishlistCount() {
  wishlistCount.textContent = `♥ ${saved.size} saved`;
  wishlistCount.classList.toggle("has-items", saved.size > 0);
}

// ONE listener on the grid handles every heart, including hearts added later (event delegation).
grid.addEventListener("click", (event) => {
  const heart = event.target.closest(".heart");
  if (!heart) return; // the click was somewhere else on the grid

  const id = Number(heart.dataset.id); // dataset values are always strings
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
  }

  const isSaved = saved.has(id);
  heart.setAttribute("aria-pressed", String(isSaved));
  heart.textContent = isSaved ? "♥" : "♡";
  heart.closest(".card").classList.toggle("is-saved", isSaved);
  updateWishlistCount();
});

// ---- The JS Playground ----
document.querySelector("#run-playground").addEventListener("click", () => runPlayground(logEl));
document.querySelector("#clear-playground").addEventListener("click", () => logEl.replaceChildren());
runPlayground(logEl);
