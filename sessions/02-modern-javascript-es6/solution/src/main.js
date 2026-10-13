import "./base.css";
import "./style.css";
import { products } from "./data/products.js";
import { computeStats, countByCategory, filterProducts, getCategories, sortProducts } from "./lib/catalog.js";
import { loadSaved, saveSaved } from "./lib/storage.js";
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
let state = { ...initialFilters, saved: loadSaved() };

function setState(changes) {
  state = { ...state, ...changes }; // a NEW object: the old state, overwritten by the changes
  update();
}

// ---- update(): state in, whole view out. Exactly what React does on every render. ----
function update() {
  const { sort, saved, ...filters } = state; // rest: filters is { query, category }
  const visible = sortProducts(filterProducts(products, filters), sort);
  const matching = filterProducts(products, { query: filters.query }); // chip counts ignore the category
  const counts = countByCategory(matching).set("all", matching.length);

  renderCategoryChips(els.chips, ["all", ...categories], filters.category, counts);
  renderGrid(els.grid, visible, saved);
  renderStats(els.stats, computeStats(visible));
  els.count.textContent = `${visible.length} of ${products.length} products`;
  els.saved.textContent = `♥ ${saved.length} saved`;
  els.saved.classList.toggle("has-items", saved.length > 0);

  // The controls show state too, so Reset can never leave them out of sync.
  if (els.search.value !== filters.query) els.search.value = filters.query;
  els.sort.value = sort;

  els.inspector.textContent = JSON.stringify(state, null, 2);
  saveSaved(saved);
}

// ---- Events only say WHAT changed. update() decides what the page looks like. ----
els.search.addEventListener("input", (event) => setState({ query: event.target.value }));
els.sort.addEventListener("change", (event) => setState({ sort: event.target.value }));

els.chips.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category]")?.dataset.category;
  if (category) setState({ category });
});

els.grid.addEventListener("click", (event) => {
  const idText = event.target.closest(".heart")?.dataset.id;
  if (idText === undefined) return; // the click was somewhere else on the grid

  const id = Number(idText); // dataset values are always strings
  const { saved } = state;
  setState({ saved: saved.includes(id) ? saved.filter((savedId) => savedId !== id) : [...saved, id] });
});

els.reset.addEventListener("click", () => setState(initialFilters));

update();
