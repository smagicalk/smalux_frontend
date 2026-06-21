export type DeploymentChartDatum = {
  label: string;
  value: number;
};

export type DeploymentSeries = {
  name: string;
  color: string;
  values: readonly number[];
};

export const runtimeInjectionItems = [
  ["静态部署", "public/app-config.json 由静态服务直接托管"],
  ["Nginx", "config 短缓存，/api 与 /ws 反向代理"],
  ["Rust 内置", "环境变量或配置文件生成 app-config 响应"]
] as const;

export const rustEmbedNotes = [
  "将 dist/assets 使用长缓存，index.html 和 app-config.json 使用短缓存",
  "支持从环境变量或配置文件注入 public/app-config.json",
  "后台与公开主题使用不同 Cookie 与 CSP 策略",
  "WebSocket 路径需要在 Rust 路由层明确升级处理"
] as const;

export const nginxSnippet = `location / {
  try_files $uri $uri/ /index.html;
}

location /api/ {
  proxy_pass http://smalux-backend;
}

location /ws {
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}`;
