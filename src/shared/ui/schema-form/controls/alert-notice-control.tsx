import { Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface AlertNoticeControlProps {
  field: FormFieldSchema;
}

export function AlertNoticeControl({ field }: AlertNoticeControlProps) {
  const alertType = field.alertType || "info";

  const config = {
    info: {
      icon: Info,
      border: "border-sky-500/30",
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      labelColor: "text-sky-300"
    },
    success: {
      icon: CheckCircle2,
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      labelColor: "text-emerald-300"
    },
    warning: {
      icon: AlertTriangle,
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      labelColor: "text-amber-300"
    },
    danger: {
      icon: AlertCircle,
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      labelColor: "text-rose-300"
    }
  }[alertType];

  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-xl border", config.border, config.bg)}>
      <Icon className={cn("size-4 shrink-0 mt-0.5", config.text)} />
      <div className="space-y-0.5 text-xs">
        {field.label && <div className={cn("font-semibold", config.labelColor)}>{field.label}</div>}
        {field.description && (
          <div className="text-muted-foreground leading-relaxed text-[11px]">{field.description}</div>
        )}
      </div>
    </div>
  );
}
