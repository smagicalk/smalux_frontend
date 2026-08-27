import { Code2, Terminal } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface CodeControlProps {
  field: FormFieldSchema;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function CodeControl({ field, value = "", onChange, disabled }: CodeControlProps) {
  const language = field.language || "yaml";
  const rows = field.rows || 5;

  return (
    <div className="rounded-xl border border-border/80 bg-muted/40 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/60 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Terminal className="size-3.5 text-primary" />
          <span className="text-[11px] font-bold text-foreground uppercase">{language}</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">{value ? `${value.split("\n").length} 行` : "空脚本"}</span>
      </div>

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || `# 在此编写 ${language.toUpperCase()} 代码或脚本配置...`}
        className={cn(
          "w-full bg-transparent p-3 text-xs font-mono text-foreground leading-relaxed outline-none resize-y",
          "placeholder:text-muted-foreground/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        spellCheck={false}
      />
    </div>
  );
}
