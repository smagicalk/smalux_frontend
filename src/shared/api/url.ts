/**
 * Join a configured endpoint and relative path with exactly one separator.
 * An empty base and path resolve to `/`, which keeps same-origin deployments
 * usable without embedding a host in the frontend bundle.
 */
export function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath) {
    return normalizedBase || "/";
  }

  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Validate a runtime-configured endpoint before it is persisted or used.
 *
 * Same-origin paths and HTTP(S)/WS(S) absolute URLs are allowed. Protocol-
 * relative paths (`//host`) and executable schemes are rejected so runtime
 * configuration cannot silently change protocol or introduce script URLs.
 */
export function isSafeRuntimeEndpoint(value: string) {
  if (!value.trim()) {
    return false;
  }

  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    return ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Build an absolute ws(s):// URL for a path under the configured WS base.
 * HTTP(S) origins are upgraded to WS(S), allowing one deployment origin to
 * configure both RPC transports. Relative paths resolve against the browser
 * origin; the localhost base exists only for non-browser evaluation and tests.
 */
export function createWebSocketUrl(baseUrl: string, path: string) {
  const joined = joinUrl(baseUrl, path);
  const url = new URL(joined, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else if (url.protocol === "http:") {
    url.protocol = "ws:";
  }
  return url.toString();
}
