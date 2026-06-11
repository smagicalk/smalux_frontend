# 部署设计

## 总体原则

前端只产出静态文件：

```txt
pnpm build -> dist/
```

三种部署方式共用同一份 `dist/`。

## 运行时配置

配置文件：

```txt
public/app-config.json
```

构建后产物：

```txt
dist/app-config.json
```

示例：

```json
{
  "appName": "smalux",
  "apiBaseUrl": "/api",
  "wsBaseUrl": "/ws",
  "rpcBaseUrl": "/rpc",
  "theme": "system"
}
```

原则：

- 不只依赖 `VITE_API_URL`。
- 同一份前端产物可在不同环境调整后端地址。
- `index.html` 不强缓存。
- `assets/*` 长缓存。

## 独立静态部署

适合：

- CDN。
- 对象存储。
- Cloudflare Pages。
- 独立静态服务。

配置：

```json
{
  "apiBaseUrl": "https://api.example.com/api",
  "wsBaseUrl": "wss://api.example.com/ws",
  "rpcBaseUrl": "https://api.example.com/rpc"
}
```

注意：

- 后端需要配置 CORS。
- Cookie 跨域需要正确的 SameSite 和 Secure 策略。
- 优先同站部署，降低 Cookie 和 CSRF 复杂度。

## Nginx 部署

推荐生产形态：

- Nginx 负责 TLS。
- Nginx 提供静态资源。
- Nginx 反代 `/api`、`/ws`、`/rpc`。
- Rust 后端只处理业务。

示例：

```nginx
server {
  listen 443 ssl http2;
  server_name smalux.example.com;

  root /var/www/smalux/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /rpc {
    proxy_pass http://127.0.0.1:8080/rpc;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /ws/ {
    proxy_pass http://127.0.0.1:8080/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }
}
```

安全响应头应在 Nginx 或后端统一设置。

## Rust Web 内置

适合：

- 单二进制交付。
- 小型自托管部署。
- 无独立静态服务环境。

方式：

- 直接 serve `dist/`。
- 或 embed `dist/` 到二进制。

Rust 路由要求：

- `/api` 走后端 API。
- `/rpc` 走 JSON-RPC。
- `/ws` 走 WebSocket。
- 其他路径回退到 `index.html`。

注意：

- 内置静态资源方便交付，但前端更新通常需要重新发布后端。
- TLS 证书管理通常仍建议交给 Nginx/Caddy。

## 缓存策略

推荐：

```txt
index.html: no-cache
app-config.json: no-cache
assets/*: public, immutable, 1 year
```

原因：

- Vite assets 带 hash，可以长缓存。
- `index.html` 需要及时引用新 assets。
- `app-config.json` 是运行时配置，不能被长期缓存。

## 健康检查

建议端点：

```txt
GET /api/health
GET /api/version
```

前端展示：

- 后端版本。
- 前端构建版本。
- API 可用状态。
- WS 可用状态。
