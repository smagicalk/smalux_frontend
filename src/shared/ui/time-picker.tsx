import React, { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

interface TimePickerProps {
  value: string; // e.g. "03:00"
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({
  value = "03:00",
  onChange,
  className = ""
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hour, min] = (value || "03:00").split(":");
  const currentHour = hour || "03";
  const currentMin = min || "00";

  // 点击外部自动关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelectHour = (h: string) => {
    onChange(`${h}:${currentMin}`);
  };

  const handleSelectMin = (m: string) => {
    onChange(`${currentHour}:${m}`);
  };

  const handleSetCurrentTime = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* 触发按钮 / 输入卡片 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
          open
            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
            : "border-border/80 bg-background hover:bg-muted/40 text-foreground"
        }`}
      >
        <Clock className="size-3.5 text-primary opacity-85" />
        <span>{value || "03:00"}</span>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>

      {/* 悬浮弹出面板 (Popover Floating Panel - 纯粹专注的时分双列) */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl p-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* 小时与分钟选择列 */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* 小时 (00 - 23) */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground pb-0.5 border-b border-border/40 font-mono">
                小时 (Hour)
              </div>
              <div className="h-32 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                {Array.from({ length: 24 }).map((_, i) => {
                  const val = String(i).padStart(2, "0");
                  const isSelected = val === currentHour;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectHour(val)}
                      className={`w-full py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "hover:bg-muted text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <span>{val}</span>
                      {isSelected && <Check className="size-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 分钟 (00 - 55 常用刻度) */}
            <div className="space-y-1 border-l border-border/40 pl-2">
              <div className="text-[10px] font-semibold text-muted-foreground pb-0.5 border-b border-border/40 font-mono">
                分钟 (Minute)
              </div>
              <div className="h-32 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((val) => {
                  const isSelected = val === currentMin;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectMin(val)}
                      className={`w-full py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "hover:bg-muted text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <span>{val}</span>
                      {isSelected && <Check className="size-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 底部操作区 */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/60 text-[11px]">
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              此刻 (Now)
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold cursor-pointer hover:bg-primary/90 shadow-2xs"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
