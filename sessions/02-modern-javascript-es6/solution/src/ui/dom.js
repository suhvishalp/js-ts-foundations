/**
 * h(tag, props, ...children): build one element in one expression.
 * The same shape as React.createElement(type, props, ...children), which is what JSX compiles to.
 *
 *   h("button", { className: "filter-chip", dataset: { category: "beauty" } }, "Beauty")
 */
export function h(tag, props = {}, ...children) {
  const { dataset = {}, ...rest } = props; // pull dataset out; everything else stays in `rest`
  const el = document.createElement(tag);
  Object.assign(el, rest); // className, textContent, type, ariaPressed…
  Object.assign(el.dataset, dataset); // { category: "beauty" } → data-category="beauty"
  el.append(...children); // spread: append(a, b, c), not append([a, b, c])
  return el;
}
