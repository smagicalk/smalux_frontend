/**
 * Resolve a CSS custom property to a concrete `#rrggbb` hex color.
 *
 * The design tokens are stored as `oklch(...)` strings, and uPlot / ECharts
 * draw on a canvas. Two things break if we hand them oklch:
 *   1. canvas `fillStyle`/`strokeStyle` can't take `var(...)`, and older
 *      color parsers (zrender) don't parse oklch at all;
 *   2. gradient helpers append a 2-digit alpha hex (e.g. `${color}55`), which
 *      turns `oklch(...)` into the invalid `oklch(...)55`.
 *
 * We let the browser convert: set the token as a probe element's `color`,
 * read the computed `color` (normalized to `rgb(...)`), then re-serialize as
 * `#rrggbb` so the alpha-hex suffix is valid (`#rrggbb55`).
 *
 * Accepts either a bare token name ("--cyan") or any css color string — if the
 * input already looks like a concrete color (hex/rgb/oklch), it is resolved
 * through the same probe so callers can pass `var(--cyan)` or `--cyan` or
 * `#fff` uniformly.
 */
export function resolveTokenColor(input: string, fallback = "#3b82f6"): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  const cssValue = input.startsWith("var(") ? input : input.startsWith("--") ? `var(${input})` : input;
  const probe = document.createElement("span");
  probe.style.color = cssValue;
  probe.style.display = "none";
  document.documentElement.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return rgbToHex(computed) || fallback;
}

/** Normalize any `rgb()`/`rgba()` string the browser emits to `#rrggbb`. */
function rgbToHex(color: string): string | null {
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b] = parts;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
