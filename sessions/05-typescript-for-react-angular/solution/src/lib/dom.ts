/**
 * `document.querySelector` returns `Element | null`: the element may not exist.
 * This helper does the null check once, loudly, and lets the caller name the element type.
 */
export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el; // narrowed from T | null to T by the check above
}
