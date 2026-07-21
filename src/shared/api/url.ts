export function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath) {
    return normalizedBase || "/";
  }

  return `${normalizedBase}/${normalizedPath}`;
}

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
 * Build an absolute ws(s):// URL for a path under the configured ws base.
 * Upgrades http(s) origins to ws(s) so the same base can serve both.
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
