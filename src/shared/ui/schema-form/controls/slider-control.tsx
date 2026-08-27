import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface SliderControlProps {
  field: FormFieldSchema;
  value: number | undefined;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function SliderControl({ field, value, onChange, disabled }: SliderControlProps) {
  const min = field.validation?.min ?? 0;
  const max = field.validation?.max ?? 100;
  const step = field.step || 1;
  const currentVal = typeof value === "number" ? value : min;
  const percentage = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));

  return (
    <div className="space-y-2 p-3 rounded-xl border border-border/80 bg-muted/20">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground text-[11px]">{min}{field.unit}</span>
        <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
          {currentVal}{field.unit || ""}
        </span>
        <span className="text-muted-foreground text-[11px]">{max}{field.unit}</span>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={cn(
            "w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            background: `linear-gradient(to right, var(--color-primary, #3b82f6) ${percentage}%, var(--color-muted, #27272a) ${percentage}%)`
          }}
        />
      </div>
    </div>
  );
}
