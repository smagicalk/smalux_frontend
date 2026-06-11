export type DeploymentTarget = {
  id: string;
  name: string;
  description: string;
  status: "ready" | "planned";
  strengths: string[];
  checklist: string[];
};

export const mockDeploymentTargets: DeploymentTarget[] = [
  {
    id: "static",
    name: "独立静态部署",
    description: "构建为 dist 静态资源，可放到任意静态文件服务或对象存储。",
    status: "ready",
    strengths: ["部署简单", "缓存友好", "与后端解耦"],
    checklist: ["pnpm build", "上传 dist/", "配置 public/app-config.json"]
  },
  {
    id: "nginx",
    name: "Nginx 部署",
    description: "由 Nginx 托管前端，并反向代理 HTTP、WebSocket 与 JSON-RPC。",
    status: "ready",
    strengths: ["TLS 终止", "静态缓存", "WSS 代理"],
    checklist: ["try_files 回退到 index.html", "代理 /api", "代理 /ws"]
  },
  {
    id: "rust",
    name: "Rust Web 内置",
    description: "将前端产物嵌入 Rust Web 服务，适合单二进制交付。",
    status: "planned",
    strengths: ["单文件分发", "版本一致", "内网部署友好"],
    checklist: ["include_dir 或 rust-embed", "运行时配置注入", "静态缓存头"]
  },
  {
    id: "headless",
    name: "Headless Dashboard",
    description: "前端单独部署，后端主控只暴露受控 HTTP、WSS 与 JSON-RPC 接入。",
    status: "planned",
    strengths: ["前后端隔离", "适合多主控", "Token Scope 清晰"],
    checklist: ["配置 app-config.json", "限制 Origin", "启用 HTTPS/WSS-only"]
  },
  {
    id: "container",
    name: "容器镜像交付",
    description: "将 dist 与轻量静态服务打包进镜像，用于测试、演示和内网预览。",
    status: "ready",
    strengths: ["环境一致", "便于回滚", "预览稳定"],
    checklist: ["构建 dist", "复制 public/app-config.json", "配置健康检查"]
  }
];
