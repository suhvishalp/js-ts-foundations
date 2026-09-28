/**
 * The two dark .log panels: the Network log and the Event loop output.
 * Each line is a <div> with a tone class that picks its colour.
 */
import { el } from "./render.js";

/** Adds one coloured line and keeps the panel scrolled to the newest line. */
export function appendLogLine(logEl, text, tone = "") {
  logEl.append(el("div", { className: `log-line ${tone}`.trim() }, text));
  logEl.scrollTop = logEl.scrollHeight;
}

/** "https://dummyjson.com/products/search?q=ph&limit=24&…" → "search?q=ph" */
function shortUrl(url) {
  const { pathname, searchParams } = new URL(url);
  const path = pathname.replace(/^\/products\/?/, "") || "products";
  const q = searchParams.get("q");
  return q === null ? path : `${path}?q=${q}`;
}

/** Turns a network event from api/client.js into { text, tone }. */
export function formatNetworkEvent(event) {
  const where = `#${event.id} ${shortUrl(event.url)}`;
  switch (event.type) {
    case "start":
      return { tone: "start", text: `→ ${where}` };
    case "success":
      return { tone: "ok", text: `✓ ${where}  ${event.status} · ${event.ms} ms` };
    case "abort":
      return { tone: "abort", text: `✕ ${where}  aborted · ${event.ms} ms` };
    default: {
      const reason = event.error?.status ?? event.error?.name ?? "error";
      return { tone: "err", text: `! ${where}  ${reason} · ${event.ms} ms` };
    }
  }
}
