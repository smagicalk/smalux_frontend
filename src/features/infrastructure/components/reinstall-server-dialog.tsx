import { useState, useMemo, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  ShieldCheck,
  RotateCw,
  Clock,
  Terminal,
  Layers,
  Sparkles,
  Server,
  Zap,
  Globe2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";
import type { HostServer } from "../types";

interface ReinstallServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: HostServer | null;
}

// Generate temporary secure token
function createTemporaryToken(serverId?: string) {
  const nodePrefix = (serverId || "node").replace("srv-", "");
  const rand = Math.random().toString(36).substring(2, 10);
  return `smx_tok_${nodePrefix}_${rand}`;
}

export function ReinstallServerDialog({
  open,
  onOpenChange,
  server
}: ReinstallServerDialogProps) {
  const [method, setMethod] = useState<"curl" | "wget" | "powershell">("curl");
  const [allowRemoteExec, setAllowRemoteExec] = useState(false);
  const [enableAutoUpdate, setEnableAutoUpdate] = useState(true);
  const [useProxyCdn, setUseProxyCdn] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize with server properties when dialog opens or server changes
  useEffect(() => {
    if (open && server) {
      setAllowRemoteExec(Boolean(server.allowRemoteExec));
      setTempToken(createTemporaryToken(server.id));
      const defaultHost = typeof window !== "undefined" && window.location.host
        ? `${window.location.protocol}//${window.location.host}`
        : "https://api.smalux.com";
      setCustomEndpoint(defaultHost);
      setCopied(false);
    }
  }, [open, server]);

  const defaultEndpoint = useMemo(() => {
    if (typeof window !== "undefined" && window.location.host) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return "https://api.smalux.com";
  }, []);

  const effectiveEndpoint = customEndpoint.trim() || defaultEndpoint;

  // Generate dynamic command snippet based on all current options
  const generatedCommand = useMemo(() => {
    if (!server) return "";
    const endpoint = effectiveEndpoint;
    const token = tempToken || "smx_tok_sample";
    const remoteFlag = allowRemoteExec ? " --enable-remote" : "";
    const updateFlag = enableAutoUpdate ? " --auto-update" : "";
    const nodeIdFlag = ` --id ${server.id}`;

    const scriptUrl = useProxyCdn
      ? "https://ghfast.top/https://raw.githubusercontent.com/smalux/agent/main/install.sh"
      : `${endpoint}/install.sh`;

    switch (method) {
      case "curl":
        return `curl -fsSL ${scriptUrl} | bash -s -- --endpoint ${endpoint} --token ${token}${nodeIdFlag}${remoteFlag}${updateFlag}`;
      case "wget":
        return `wget -qO- ${scriptUrl} | bash -s -- --endpoint ${endpoint} --token ${token}${nodeIdFlag}${remoteFlag}${updateFlag}`;
      case "powershell": {
        const psScriptUrl = useProxyCdn
          ? "https://ghfast.top/https://raw.githubusercontent.com/smalux/agent/main/install.ps1"
          : `${endpoint}/install.ps1`;
        return `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; &([scriptblock]::Create((iwr -useb '${psScriptUrl}'))) -Endpoint '${endpoint}' -Token '${token}' -NodeId '${server.id}'${allowRemoteExec ? " -EnableRemote" : ""}${enableAutoUpdate ? " -AutoUpdate" : ""}`;
      }
      default:
        return `curl -fsSL ${scriptUrl} | bash -s -- --endpoint ${endpoint} --token ${token}${nodeIdFlag}${remoteFlag}${updateFlag}`;
    }
  }, [server, effectiveEndpoint, tempToken, allowRemoteExec, enableAutoUpdate, useProxyCdn, method]);

  const handleCopyCommand = () => {
    if (!generatedCommand) return;
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    toast.success("已复制安装与重连命令到剪贴板！");
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRegenerateToken = () => {
    const newToken = createTemporaryToken(server?.id);
    setTempToken(newToken);
    toast.info("已生成新临时认证 Token");
  };

  if (!server) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Code2 className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base">节点重新安装 / 重新连接命令生成</DialogTitle>
              <DialogDescription className="text-xs">
                为目标节点 <strong className="text-foreground">{server.name}</strong> ({server.id}) 生成最新配置的一键接入命令。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Method Tabs */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Terminal className="size-3.5 text-primary" /> 安装执行方式
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg border border-border/80 bg-muted/30">
              {[
                { key: "curl" as const, label: "cURL (推荐)" },
                { key: "wget" as const, label: "Wget" },
                { key: "powershell" as const, label: "PowerShell" }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMethod(item.key)}
                  className={`py-1.5 px-2 rounded-md font-medium text-xs transition-all cursor-pointer text-center ${
                    method === item.key
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
            {/* Allow Remote Exec Toggle (Defaulted from existing server state) */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="size-3 text-amber-400" />
                  <span>开启远程命令执行</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  附带 <code className="font-mono text-foreground">--enable-remote</code> 权限标志
                </div>
              </div>
              <Switch checked={allowRemoteExec} onCheckedChange={setAllowRemoteExec} />
            </div>

            {/* Auto Update Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-emerald-400" />
                  <span>自动保持更新</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  附带 <code className="font-mono text-foreground">--auto-update</code> 自动热升级
                </div>
              </div>
              <Switch checked={enableAutoUpdate} onCheckedChange={setEnableAutoUpdate} />
            </div>

            {/* Domestic Proxy CDN Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Globe2 className="size-3 text-sky-400" />
                  <span>国内下载加速镜像</span>
                </div>
                <div className="text-[10px] text-muted-foreground">使用 GitHub Fast CDN 代理脚本</div>
              </div>
              <Switch checked={useProxyCdn} onCheckedChange={setUseProxyCdn} />
            </div>

            {/* Temporary Token Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3 text-primary" />
                  <span>时效性安全认证凭证</span>
                </div>
                <div className="text-[10px] text-muted-foreground">每次生成为动态全新鉴权 Token</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRegenerateToken}
                className="h-7 px-2 text-[11px] text-primary hover:bg-primary/15 cursor-pointer"
                title="重新生成 Token"
              >
                <RotateCw className="size-3 mr-1" /> 刷新
              </Button>
            </div>
          </div>

          {/* Endpoint Custom Input */}
          <div className="space-y-1">
            <label className="text-muted-foreground font-medium">主控服务上报端点 (Endpoint)</label>
            <input
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder={defaultEndpoint}
              className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary font-mono text-foreground"
            />
          </div>

          {/* Generated Command Box */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5 text-emerald-400" /> 一键执行命令
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">在目标机器执行此单行指令</span>
            </div>
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-emerald-400 font-mono text-xs overflow-hidden shadow-inner flex flex-col gap-2">
              <code className="text-zinc-200 select-all break-all whitespace-pre-wrap leading-relaxed text-[11px] font-mono">
                {generatedCommand}
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 text-xs cursor-pointer"
            >
              关闭
            </Button>
            <Button
              type="button"
              onClick={handleCopyCommand}
              className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copied ? "已复制指令" : "复制安装命令"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
