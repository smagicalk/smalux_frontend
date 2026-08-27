import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface TextControlProps {
  field: FormFieldSchema;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function TextControl({ field, value = "", onChange, disabled, hasError }: TextControlProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = field.type === "password";
  const isTextarea = field.type === "textarea";
  const Icon = field.icon;

  if (isTextarea) {
    return (
      <div className="relative">
        <textarea
          rows={field.rows || 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={field.readOnly}
          placeholder={field.placeholder}
          className={cn(
            "w-full rounded-xl border bg-muted/40 px-3.5 py-2.5 text-xs font-mono outline-none transition-all resize-y",
            "placeholder:text-muted-foreground/50 text-foreground",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-60 cursor-not-allowed bg-muted/20",
            hasError ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20" : "border-border/80"
          )}
        />
      </div>
    );
  }

  const inputType = isPassword ? (showPassword ? "text" : "password") : field.type === "number" ? "text" : field.type;

  return (
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none">
          <Icon className="size-3.5" />
        </div>
      )}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={field.readOnly}
        placeholder={field.placeholder}
        className={cn(
          "w-full h-9 rounded-xl border bg-muted/40 px-3.5 text-xs font-mono outline-none transition-all",
          Icon && "pl-9",
          isPassword && "pr-10",
          "placeholder:text-muted-foreground/50 text-foreground",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-60 cursor-not-allowed bg-muted/20",
          hasError ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20" : "border-border/80"
        )}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
