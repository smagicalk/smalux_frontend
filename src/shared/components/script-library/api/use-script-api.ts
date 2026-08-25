import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScriptItem, ScriptGroup, CreateScriptInput, UpdateScriptInput } from "../types";

const INITIAL_GROUPS: ScriptGroup[] = [
  { key: "system", label: "系统/磁盘" },
  { key: "network", label: "网络诊断" },
  { key: "docker", label: "容器" },
  { key: "service", label: "服务管理" },
  { key: "security", label: "安全时钟" }
];

const INITIAL_SCRIPTS: ScriptItem[] = [
  {
    id: "sp-docker-prune",
    category: "docker",
    title: "清理 Docker 废弃容器与镜像",
    desc: "深度回收已废弃容器、无用镜像和孤立网络卷",
    command: "docker system prune -af --volumes",
    risk: "medium"
  },
  {
    id: "sp-nginx-reload",
    category: "service",
    title: "平滑重载 Nginx 配置",
    desc: "语法测试无误后平滑重载 Web 服务，不中断现有连接",
    command: "nginx -t && systemctl reload nginx",
    risk: "low"
  },
  {
    id: "sp-sys-diagnosis",
    category: "system",
    title: "系统资源水位与瞬时负载",
    desc: "快速获取各分区挂载点磁盘容量、内存占用与系统 uptime",
    command: "df -hT && echo '---' && free -h && echo '---' && uptime",
    risk: "low"
  },
  {
    id: "sp-service-status",
    category: "service",
    title: "检查核心服务运行状态",
    desc: "查看监控代理守护进程与 Docker 服务的实时状态",
    command: "systemctl status smalux-agent docker --no-pager",
    risk: "low"
  },
  {
    id: "sp-net-latency",
    category: "network",
    title: "网络链路连通性与跳点测试",
    desc: "测试公网主流 DNS 连通性并输出路由追踪汇总",
    command: "ping -c 4 8.8.8.8 && traceroute -w 2 1.1.1.1",
    risk: "low"
  },
  {
    id: "sp-tcp-conntrack",
    category: "network",
    title: "查询网络连接与端口监听",
    desc: "汇总当前系统正在 LISTEN 的端口与 ESTABLISHED 连接",
    command: "ss -tulpn && echo '---' && netstat -nat | awk '{print $6}' | sort | uniq -c | sort -n",
    risk: "low"
  },
  {
    id: "sp-sec-openssl",
    category: "security",
    title: "安全关键补丁热升级 (OpenSSL)",
    desc: "在线检测并升级系统关键加解密组件修复 CVE 漏洞",
    command: "apt-get update && apt-get --only-upgrade install -y libssl3",
    risk: "high"
  },
  {
    id: "sp-time-sync",
    category: "security",
    title: "NTP 集群物理时钟对齐",
    desc: "向全球 NTP 公共授时池发起物理时钟瞬时校准",
    command: "chronyc makestep || ntpdate pool.ntp.org",
    risk: "medium"
  },
  {
    id: "sp-memory-flush",
    category: "system",
    title: "释放内核 PageCache 缓存",
    desc: "在内存极度紧张时手动刷盘并释放 Linux 内核缓存",
    command: "sync && echo 3 > /proc/sys/vm/drop_caches",
    risk: "medium"
  }
];

// 本地存储兜底辅助
function getStoredScripts(): ScriptItem[] {
  try {
    const raw = localStorage.getItem("smalux_http_scripts");
    return raw ? JSON.parse(raw) : INITIAL_SCRIPTS;
  } catch {
    return INITIAL_SCRIPTS;
  }
}

function setStoredScripts(data: ScriptItem[]) {
  try {
    localStorage.setItem("smalux_http_scripts", JSON.stringify(data));
  } catch {}
}

function getStoredGroups(): ScriptGroup[] {
  try {
    const raw = localStorage.getItem("smalux_http_script_groups");
    return raw ? JSON.parse(raw) : INITIAL_GROUPS;
  } catch {
    return INITIAL_GROUPS;
  }
}

function setStoredGroups(data: ScriptGroup[]) {
  try {
    localStorage.setItem("smalux_http_script_groups", JSON.stringify(data));
  } catch {}
}

/**
 * 获取脚本库列表 Hook（HTTP GET）
 */
export function useScripts(category?: string) {
  return useQuery<ScriptItem[]>({
    queryKey: ["scripts", category || "all"],
    queryFn: async () => {
      try {
        const url = category && category !== "all" 
          ? `/api/scripts?category=${encodeURIComponent(category)}`
          : "/api/scripts";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.scripts || [];
        }
      } catch {
        // HTTP 接口未就绪时平滑降级至本地缓存
      }
      const all = getStoredScripts();
      if (category && category !== "all") {
        return all.filter((s) => s.category === category);
      }
      return all;
    },
    staleTime: 60 * 1000
  });
}

/**
 * 获取分组列表 Hook（HTTP GET）
 */
export function useScriptGroups() {
  return useQuery<ScriptGroup[]>({
    queryKey: ["script-groups"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/script-groups");
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.groups || [];
        }
      } catch {
        // HTTP 降级
      }
      return getStoredGroups();
    },
    staleTime: 5 * 60 * 1000
  });
}

/**
 * 创建新脚本 Hook（HTTP POST）
 */
export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScriptInput): Promise<ScriptItem> => {
      const newScript: ScriptItem = {
        id: `script_${Date.now()}`,
        ...input,
        updatedAt: Date.now()
      };

      try {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // HTTP 降级本地写入
      }

      const current = getStoredScripts();
      const next = [newScript, ...current];
      setStoredScripts(next);
      return newScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    }
  });
}

/**
 * 更新脚本 Hook（HTTP PUT / POST）
 */
export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateScriptInput): Promise<ScriptItem> => {
      try {
        const res = await fetch(`/api/scripts/${input.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // HTTP 降级本地写入
      }

      const current = getStoredScripts();
      let updatedItem: ScriptItem | null = null;
      const next = current.map((item) => {
        if (item.id === input.id) {
          updatedItem = { ...item, ...input, updatedAt: Date.now() };
          return updatedItem;
        }
        return item;
      });
      setStoredScripts(next);
      return updatedItem || (input as ScriptItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    }
  });
}

/**
 * 删除脚本 Hook（HTTP DELETE）
 */
export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        const res = await fetch(`/api/scripts/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          return id;
        }
      } catch {
        // HTTP 降级
      }

      const current = getStoredScripts();
      const next = current.filter((item) => item.id !== id);
      setStoredScripts(next);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    }
  });
}

/**
 * 保存/更新分组列表 Hook（HTTP POST）
 */
export function useSaveScriptGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groups: ScriptGroup[]): Promise<ScriptGroup[]> => {
      try {
        const res = await fetch("/api/script-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
      setStoredGroups(groups);
      return groups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["script-groups"] });
    }
  });
}
