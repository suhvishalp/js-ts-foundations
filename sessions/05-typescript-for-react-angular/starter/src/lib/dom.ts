/**
 * `document.querySelector` returns `Element | null`: the element may not exist.
 */

// TODO(lab-5.4): return `any` hides both problems: the null and the element type.
// Make it $<T extends Element = HTMLElement>(selector, root: ParentNode = document): T,
// use root.querySelector<T>(selector), and throw a clear Error when nothing matches.
export function $(selector: string): any {
  return document.querySelector(selector);
}
