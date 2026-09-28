import "./base.css";
import "./style.css";
import { products } from "./data/products.js";
import { computeStats, countByCategory, filterProducts, getCategories, sortProducts } from "./lib/catalog.js";
// TODO(lab-2.15): import loadSaved and saveSaved from "./lib/storage.js" (you create that file in Lab 5).
import { renderCategoryChips, renderGrid, renderStats } from "./ui/render.js";

// ---- The elements index.html gave us ----
const els = {
  search: document.querySelector("#search"),
  sort: document.querySelector("#sort"),
  reset: document.querySelector("#reset"),
  chips: document.querySelector("#categories"),
  grid: document.querySelector("#grid"),
  count: document.querySelector("#product-count"),
  saved: document.querySelector("#wishlist-count"),
  stats: document.querySelector("#stats"),
  inspector: document.querySelector("#state"),
};

const categories = getCategories(products); // computed once: the catalogue itself never changes
const initialFilters = { query: "", category: "all", sort: "featured" };

// ---- ONE object holds everything that can change. The DOM is never the source of truth. ----
// TODO(lab-2.15): start `saved` from loadSaved() instead of an empty array.
let state = { ...initialFilters, saved: [] };

function setState(changes) {
  // TODO(lab-2.4): replace `state` with a NEW object: everything in the old state, overwritten by `changes`.
  update();
}

// ---- update(): state in, whole view out. ----
function update() {
  const { saved } = state;
  // TODO(lab-2.8): derive `visible` from state: filterProducts by { query, category }, then sortProducts by state.sort.
  const visible = products;

  renderCategoryChips(els.chips, ["all", ...categories], state.category, countByCategory(products).set("all", products.length));
  renderGrid(els.grid, visible, saved);
  renderStats(els.stats, computeStats(visible));
  els.count.textContent = `${visible.length} of ${products.length} products`;
  els.saved.textContent = `♥ ${saved.length} saved`;
  els.saved.classList.toggle("has-items", saved.length > 0);

  // TODO(lab-2.16): rewrite update() in its final form: rest destructuring, chip counts that follow the search,
  //                 controls that show state, the state inspector, and saveSaved(saved).
}

// ---- Events ----
// TODO(lab-2.9): listen for "input" on els.search, "change" on els.sort, and clicks on els.chips
//                (event delegation with closest("[data-category]")?.dataset.category). Each one calls setState.

// ONE listener on the grid handles every heart (event delegation).
els.grid.addEventListener("click", (event) => {
  // TODO(lab-2.5): use ?. to read the heart's id in one line, then setState({ saved: … }) with a NEW array:
  //                filter the id out if it is saved, or [...saved, id] if it is not. No push, no splice.
  const heart = event.target.closest(".heart");
  if (!heart) return; // the click was somewhere else on the grid

  const id = Number(heart.dataset.id); // dataset values are always strings
  const index = state.saved.indexOf(id);
  if (index === -1) {
    state.saved.push(id);
  } else {
    state.saved.splice(index, 1);
  }
  update();
});

// TODO(lab-2.16): wire els.reset so a click puts the filters back to initialFilters (the wishlist stays).

update();
