export function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath) {
    return normalizedBase || "/";
  }

  return `${normalizedBase}/${normalizedPath}`;
}
