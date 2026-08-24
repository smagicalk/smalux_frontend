/**
 * 规范化拼接基础 URL 与相对路径（确保两者之间仅有且只有一个斜杠）
 * 
 * 若基地址与相对路径均为空，返回 `/`（保证同源相对部署无需在构建时写死 Host）。
 * 
 * @param baseUrl 基础路径（如 "/api" 或 "https://api.example.com"）
 * @param path 相对路径（如 "v1/status"）
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
 * 校验运行时配置的端点地址安全性
 * 
 * 规则：
 * 1. 允许同源相对路径（以 `/` 开头，但禁止协议相对路径 `//`）
 * 2. 允许 http:, https:, ws:, wss: 绝对协议地址
 * 3. 拒绝 javascript: 等潜在脚本注入方案
 * 
 * @param value 待检查的 URL 字符串
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
 * 将配置的 WebSocket 基础地址与相对路径构建为合法的 ws:// 或 wss:// 完整 URL
 * 
 * 自动根据 HTTP(S) 协议升级为 WS(S)（例如 http: -> ws:, https: -> wss:），
 * 允许在生产环境中用同一个域名同时配置 HTTP API 和 WebSocket。
 * 
 * @param baseUrl WebSocket 基础地址
 * @param path 相对路径
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
