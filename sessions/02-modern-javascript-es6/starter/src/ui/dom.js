/**
 * h(tag, props, ...children): build one element in one expression.
 * The same shape as React.createElement(type, props, ...children), which is what JSX compiles to.
 *
 *   h("button", { className: "filter-chip", dataset: { category: "beauty" } }, "Beauty")
 */
export function h(tag, props, ...children) {
  // TODO(lab-2.3): give props a default of {}, pull `dataset` out of it with destructuring and rest,
  //                Object.assign the rest onto the element and the dataset onto el.dataset, then append
  //                the children with spread. Right now it ignores props and children.
  return document.createElement(tag);
}
