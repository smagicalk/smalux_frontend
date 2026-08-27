import { Palette } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface ColorControlProps {
  field: FormFieldSchema;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#64748b"  // Slate
];

export function ColorControl({ field, value = "#3b82f6", onChange, disabled }: ColorControlProps) {
  const currentColor = value || "#3b82f6";

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-xl border border-border/80 bg-muted/20">
      {/* 拾色器与色块 */}
      <div className="relative flex items-center gap-2">
        <label
          className={cn(
            "relative size-8 rounded-lg border border-border/80 shadow-xs cursor-pointer overflow-hidden shrink-0 flex items-center justify-center transition-transform hover:scale-105",
            disabled && "cursor-not-allowed opacity-50"
          )}
          style={{ backgroundColor: currentColor }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        <input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="#3b82f6"
          className="w-24 h-8 rounded-lg border border-border/80 bg-background px-2 text-xs font-mono uppercase text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="h-4 w-px bg-border/60" />

      {/* 预设色板快速点选 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => !disabled && onChange(color)}
            disabled={disabled}
            style={{ backgroundColor: color }}
            className={cn(
              "size-5 rounded-full border transition-all cursor-pointer",
              currentColor.toLowerCase() === color.toLowerCase()
                ? "border-primary scale-110 ring-2 ring-primary/30"
                : "border-transparent hover:scale-110",
              disabled && "cursor-not-allowed opacity-50"
            )}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
