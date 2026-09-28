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
// TODO(lab-1.11): create the wishlist state (a Set of product ids) and an updateWishlistCount()
//                 function that writes "♥ N saved" into wishlistCount.

// TODO(lab-1.12): add ONE click listener on the grid (event delegation). Find the clicked .heart with
//                 closest(), toggle its id in the Set, update aria-pressed, the icon, the card, and the count.

// ---- The JS Playground ----
document.querySelector("#run-playground").addEventListener("click", () => runPlayground(logEl));
document.querySelector("#clear-playground").addEventListener("click", () => logEl.replaceChildren());
runPlayground(logEl);
