import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Globe2,
  CheckSquare,
  Square,
  RotateCw,
  Link2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import type { AgentInstallCommand } from "../types";

interface AgentInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installCommand: AgentInstallCommand;
}

// Generate dynamic unique mock token
function createDynamicToken() {
  const rand1 = Math.random().toString(36).substring(2, 8);
  const rand2 = Math.random().toString(36).substring(2, 8);
  return `smalux_tok_${rand1}_${rand2}`;
}

export function AgentInstallDialog({
  open,
  onOpenChange,
  installCommand
}: AgentInstallDialogProps) {
  // Determine default domain/origin endpoint
  const defaultEndpoint = useMemo(() => {
    if (installCommand.endpoint) return installCommand.endpoint;
    if (typeof window !== "undefined" && window.location.host) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return "https://api.smalux.com";
  }, [installCommand.endpoint]);

  const [customEndpoint, setCustomEndpoint] = useState(defaultEndpoint);
  const [networkMode, setNetworkMode] = useState<"direct" | "proxy">("direct");
  const [allowRemoteExec, setAllowRemoteExec] = useState(true);
  const [enableAutoUpdate, setEnableAutoUpdate] = useState(true);

  // Token is requested on-demand so no wasteful tokens are pre-generated
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Real-time reactive command synthesis from current options once token is active
  const generatedCommand = useMemo(() => {
    if (!activeToken) return null;

    const targetEndpoint = customEndpoint.trim() || defaultEndpoint;
    const flags = `${allowRemoteExec ? " --enable-remote" : ""}${enableAutoUpdate ? " --auto-update" : ""}`;
    const scriptUrl =
      networkMode === "proxy"
        ? "https://ghfast.top/https://raw.githubusercontent.com/smalux/agent/main/install.sh"
        : `${targetEndpoint}/install.sh`;

    return `curl -fsSL ${scriptUrl} | bash -s -- --endpoint ${targetEndpoint} --token ${activeToken}${flags}`;
  }, [activeToken, customEndpoint, defaultEndpoint, networkMode, allowRemoteExec, enableAutoUpdate]);

  // Handle Initial Token Generation + Immediate Copy
  const handleGenerateTokenAndCopy = () => {
    const freshToken = createDynamicToken();
    setActiveToken(freshToken);

    const targetEndpoint = customEndpoint.trim() || defaultEndpoint;
    const flags = `${allowRemoteExec ? " --enable-remote" : ""}${enableAutoUpdate ? " --auto-update" : ""}`;
    const scriptUrl =
      networkMode === "proxy"
        ? "https://ghfast.top/https://raw.githubusercontent.com/smalux/agent/main/install.sh"
        : `${targetEndpoint}/install.sh`;
    const cmd = `curl -fsSL ${scriptUrl} | bash -s -- --endpoint ${targetEndpoint} --token ${freshToken}${flags}`;

    navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success("已生成专属 Token 并将安装指令复制到剪贴板！");
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Regenerate Token
  const handleRegenerateToken = () => {
    const freshToken = createDynamicToken();
    setActiveToken(freshToken);

    const targetEndpoint = customEndpoint.trim() || defaultEndpoint;
    const flags = `${allowRemoteExec ? " --enable-remote" : ""}${enableAutoUpdate ? " --auto-update" : ""}`;
    const scriptUrl =
      networkMode === "proxy"
        ? "https://ghfast.top/https://raw.githubusercontent.com/smalux/agent/main/install.sh"
        : `${targetEndpoint}/install.sh`;
    const cmd = `curl -fsSL ${scriptUrl} | bash -s -- --endpoint ${targetEndpoint} --token ${freshToken}${flags}`;

    navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success("已生成新 Token 并更新剪贴板指令");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyExistingCommand = () => {
    if (!generatedCommand) return;
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    toast.success("已复制安装指令到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Terminal className="size-4.5 text-primary" />
            <DialogTitle className="text-base">安装并纳管新主机 Agent</DialogTitle>
          </div>
          <DialogDescription>
            配置通信端点、网络源与功能参数，点击生成专属安装指令并在目标主机执行。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* 1. Endpoint Input Field (Default domain) */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <div className="flex items-center gap-1.5">
                <Link2 className="size-3.5 text-primary" />
                <span>服务通信端点 (Endpoint)</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono font-normal">默认当前域名</span>
            </div>
            <input
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="如: https://api.smalux.com"
              className="w-full h-8 rounded-lg border border-border/80 bg-card/60 px-3 text-xs font-mono outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>

          {/* 2. Download Network Source */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Globe2 className="size-3.5 text-primary" />
              <span>下载网络源</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setNetworkMode("direct")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 border transition-colors cursor-pointer ${
                  networkMode === "direct"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border/70 bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`size-2 rounded-full ${networkMode === "direct" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                直连 (官方源)
              </button>
              <button
                type="button"
                onClick={() => setNetworkMode("proxy")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 border transition-colors cursor-pointer ${
                  networkMode === "proxy"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold shadow-2xs"
                    : "border-border/70 bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`size-2 rounded-full ${networkMode === "proxy" ? "bg-cyan-400" : "bg-muted-foreground/40"}`} />
                GitHub 代理 (国内加速)
              </button>
            </div>
          </div>

          {/* 3. Feature Checkboxes */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
            <div className="font-semibold text-foreground">功能选项</div>
            <div className="space-y-2.5 pt-0.5">
              <label
                onClick={() => setAllowRemoteExec(!allowRemoteExec)}
                className="flex items-center gap-2.5 cursor-pointer select-none text-foreground hover:text-primary transition-colors"
              >
                {allowRemoteExec ? (
                  <CheckSquare className="size-4 text-primary shrink-0" />
                ) : (
                  <Square className="size-4 text-muted-foreground shrink-0" />
                )}
                <span>允许远程操作 (支持 Web 终端与命令下发)</span>
              </label>

              <label
                onClick={() => setEnableAutoUpdate(!enableAutoUpdate)}
                className="flex items-center gap-2.5 cursor-pointer select-none text-foreground hover:text-primary transition-colors"
              >
                {enableAutoUpdate ? (
                  <CheckSquare className="size-4 text-primary shrink-0" />
                ) : (
                  <Square className="size-4 text-muted-foreground shrink-0" />
                )}
                <span>启用自动更新 (守护进程自动跟随最新版本发布)</span>
              </label>
            </div>
          </div>

          {/* 4. Action / Generated Area */}
          {!activeToken ? (
            /* Pre-generation state */
            <div className="pt-1">
              <Button
                onClick={handleGenerateTokenAndCopy}
                className="w-full cursor-pointer font-medium h-9 text-xs gap-1.5 shadow-sm"
              >
                <Sparkles className="size-3.5" />
                生成安装指令
              </Button>
            </div>
          ) : (
            /* Post-generation state */
            <div className="space-y-2.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-400 font-medium font-mono">
                  <KeyRound className="size-3" /> 一次性安装 Token
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="flex items-center gap-1 text-primary hover:underline cursor-pointer font-sans"
                >
                  <RotateCw className="size-3" /> 重新生成 Token
                </button>
              </div>

              {/* Generated Command Box */}
              <div className="relative rounded-xl border border-border/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-sans">
                    已就绪指令 (修改上方端点或选项会自动实时更新)
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyExistingCommand}
                    className="h-6 gap-1 px-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    {copied ? "已复制" : "复制指令"}
                  </Button>
                </div>

                <pre className="whitespace-pre-wrap break-all leading-relaxed select-all text-emerald-300 font-mono">
                  {generatedCommand}
                </pre>
              </div>
            </div>
          )}

          {/* Security tips */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-muted-foreground">
              <div className="font-semibold text-foreground">安全审计与通信加密</div>
              <div>
                Agent 默认以只读与最小特权模式运行，所有数据上报均经由 TLS / WSS 双向加密通道传输，绝不外泄宿主机敏感私钥。
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
