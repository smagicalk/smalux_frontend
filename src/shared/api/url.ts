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
