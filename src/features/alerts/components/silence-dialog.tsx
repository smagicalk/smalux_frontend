import { useState, useMemo } from "react";
import { VolumeX, Clock, Sparkles, BellOff, ShieldAlert, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";

interface SilenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  targetName?: string;
  onConfirm: (durationMinutes: number) => void;
}

const SILENCE_PRESETS = [
  { minutes: 30, label: "30 分钟", desc: "临时应急排查" },
  { minutes: 60, label: "1 小时", desc: "常规发版维护" },
  { minutes: 120, label: "2 小时", desc: "深度故障抢修" },
  { minutes: 360, label: "6 小时", desc: "夜间维护窗口" },
  { minutes: 1440, label: "24 小时", desc: "全天临时屏蔽" }
];

export function SilenceDialog({
  open,
  onOpenChange,
  title,
  targetName,
  onConfirm
}: SilenceDialogProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // 计算预计恢复的时间点
  const expireTimeText = useMemo(() => {
    const d = new Date(Date.now() + durationMinutes * 60 * 1000);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const month = d.getMonth() + 1;
    const date = d.getDate();
    return `${month}月${date}日 ${hours}:${mins}`;
  }, [durationMinutes]);

  const handleApply = () => {
    if (durationMinutes <= 0) {
      toast.error("请输入有效的静默时长");
      return;
    }
    onConfirm(durationMinutes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl font-mono">
        {/* 顶部 Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-xs">
              <VolumeX className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>设定临时静默免打扰时间</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                在静默期间系统将暂停外发推送，到期后自动恢复报警
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 目标主体与操作内容 */}
        <div className="p-6 space-y-4 text-xs">
          {/* 目标信息卡片 */}
          <div className="p-3 rounded-xl border border-border/70 bg-card/60 flex items-center gap-2.5">
            <BellOff className="size-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">当前静默目标:</div>
              <div className="text-xs font-bold text-foreground truncate" title={targetName || title}>
                {targetName || title}
              </div>
            </div>
          </div>

          {/* 1. 快捷常用时长预设 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>选择常用静默周期:</span>
              <span className="text-[11px] text-muted-foreground">点击即选即生效</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none">
              {SILENCE_PRESETS.map((p) => {
                const isSelected = durationMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => setDurationMinutes(p.minutes)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/15 text-amber-400 font-bold ring-1 ring-amber-500/30 shadow-2xs"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{p.label}</span>
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 font-normal truncate">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 精确自定义数值输入 */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-foreground">自定义静默时长 (分钟):</label>
            <div className="flex items-center gap-2 p-2 rounded-xl border border-border/80 bg-muted/20">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={43200}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 0);
                    setDurationMinutes(val);
                  }}
                  placeholder="输入分钟数..."
                  className="w-full h-8 px-2.5 rounded-md border border-border/80 bg-background text-xs font-mono text-foreground outline-none focus:border-amber-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                  分钟 (min)
                </span>
              </div>

              {/* 快速累加按钮 */}
              <div className="flex items-center gap-1 select-none">
                {[
                  { label: "+15m", val: 15 },
                  { label: "+30m", val: 30 },
                  { label: "+1h", val: 60 }
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setDurationMinutes((prev) => prev + b.val)}
                    className="px-2 py-1.5 rounded bg-card border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                    title={`累加 ${b.label}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 预计自动恢复提示条 */}
          <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-muted-foreground flex items-center gap-2">
            <Clock className="size-4 text-amber-400 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span>预计将于 </span>
              <strong className="text-amber-400 font-bold font-mono">{expireTimeText}</strong>
              <span> 自动解除静音恢复守护</span>
            </div>
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8.5 px-4 text-xs font-mono cursor-pointer"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-8.5 px-5 text-xs font-mono cursor-pointer bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
          >
            立即生效静默 ({durationMinutes >= 60 && durationMinutes % 60 === 0 ? `${durationMinutes / 60}小时` : `${durationMinutes}分钟`})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
