/**
 * The wishlist survives a page reload. localStorage only stores strings, so we store JSON.
 * Two named exports: the importing file asks for exactly these names.
 */
const KEY = "shopscope-lite:saved";

export function loadSaved() {
  try {
    // getItem gives null when nothing was saved yet; JSON.parse(null) is null; ?? turns that into [].
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return []; // storage blocked, or the stored text was not valid JSON
  }
}

export function saveSaved(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}
