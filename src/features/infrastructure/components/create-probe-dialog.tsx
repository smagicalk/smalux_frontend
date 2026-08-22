import { useState } from "react";
import { Activity, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import type { CreatePingTargetParams } from "../types";

interface CreateProbeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProbe?: (params: CreatePingTargetParams) => void;
}

export function CreateProbeDialog({
  open,
  onOpenChange,
  onCreateProbe
}: CreateProbeDialogProps) {
  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState<CreatePingTargetParams["protocol"]>("HTTPS");
  const [address, setAddress] = useState("");
  const [group, setGroup] = useState<CreatePingTargetParams["group"]>("public");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("请填写完整的探针名称与探测目标地址");
      return;
    }

    if (onCreateProbe) {
      onCreateProbe({
        name: name.trim(),
        protocol,
        address: address.trim(),
        group
      });
    }

    toast.success(`已成功创建拨测探针「${name}」`);
    onOpenChange(false);
    setName("");
    setAddress("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-4.5 text-primary" />
            <DialogTitle className="text-base">新建拨测探针目标 (Create Probe)</DialogTitle>
          </div>
          <DialogDescription>
            配置边缘探活节点对目标服务的可用性与响应延迟探测规则。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Probe Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">探针名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：生产环境核心 API 网关"
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-3 outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Protocol Select */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">探测协议</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as CreatePingTargetParams["protocol"])}
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="HTTPS">HTTPS (带 SSL 证书有效期校验)</option>
              <option value="HTTP">HTTP (普通 Web 状态码校验)</option>
              <option value="TCP">TCP (指定主机端口连通性)</option>
              <option value="ICMP">ICMP (Ping 丢包率与网络延迟)</option>
            </select>
          </div>

          {/* Target Address */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">探测目标地址 (Endpoint / Host / Port)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                protocol === "TCP"
                  ? "db.internal.smalux:5432"
                  : protocol === "ICMP"
                  ? "1.1.1.1"
                  : "https://api.smalux.com/healthz"
              }
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-3 outline-none focus:border-primary text-foreground font-mono placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Group */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">探测分组</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as CreatePingTargetParams["group"])}
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="public">公网开放服务 (Public)</option>
              <option value="control">控制面与管理端 (Control Plane)</option>
              <option value="notify">通知与告警通道 (Notify Channels)</option>
              <option value="private">内网专线服务 (Private VPC)</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              取消
            </Button>
            <Button type="submit" className="cursor-pointer font-medium">
              <Plus className="size-3.5 mr-1" /> 确认创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
