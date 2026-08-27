import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { FormFieldSchema, KeyValuePair } from "../types";

export interface KeyValueControlProps {
  field: FormFieldSchema;
  value: KeyValuePair[] | Record<string, string>;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export function KeyValueControl({ field, value, onChange, disabled }: KeyValueControlProps) {
  // 规范化为 KeyValuePair 数组
  const items: KeyValuePair[] = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.entries(value).map(([k, v], idx) => ({ id: String(idx), key: k, value: String(v) }))
      : [];

  const handleAdd = () => {
    if (disabled) return;
    const newItem: KeyValuePair = { id: `kv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, key: "", value: "" };
    onChange([...items, newItem]);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleItemChange = (index: number, keyOrVal: "key" | "value", text: string) => {
    if (disabled) return;
    const updated = items.map((item, i) => {
      if (i === index) {
        return { ...item, [keyOrVal]: text };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
      {items.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground/70 font-mono">
          暂未配置任何键值对
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key (如 Authorization)"
                value={item.key}
                onChange={(e) => handleItemChange(idx, "key", e.target.value)}
                disabled={disabled}
                className="w-1/3 h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <span className="text-muted-foreground/60 font-mono text-xs">:</span>
              <input
                type="text"
                placeholder="Value (如 Bearer token_xxx)"
                value={item.value}
                onChange={(e) => handleItemChange(idx, "value", e.target.value)}
                disabled={disabled}
                className="flex-1 h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                disabled={disabled}
                className="size-8 rounded-lg border border-border/80 hover:border-rose-500/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full h-8 text-xs font-mono cursor-pointer border-dashed border-border hover:border-primary/60"
      >
        <Plus className="size-3.5 mr-1" />
        添加新项 ({field.label})
      </Button>
    </div>
  );
}
