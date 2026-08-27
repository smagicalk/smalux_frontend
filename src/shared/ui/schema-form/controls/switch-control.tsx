import { Switch } from "@/shared/ui/switch";
import type { FormFieldSchema } from "../types";

export interface SwitchControlProps {
  field: FormFieldSchema;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function SwitchControl({ field, value = false, onChange, disabled }: SwitchControlProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="space-y-0.5 pr-4 min-w-0">
        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>{field.label}</span>
          <span className={`text-[10px] font-mono font-normal px-1.5 py-0.2 rounded ${value ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {value ? "已启用" : "已停用"}
          </span>
        </div>
        {field.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {field.description}
          </p>
        )}
      </div>
      <Switch
        checked={Boolean(value)}
        onCheckedChange={onChange}
        disabled={disabled}
        className="cursor-pointer shrink-0"
      />
    </div>
  );
}
