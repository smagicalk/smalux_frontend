import { AlertCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "./types";
import { TextControl } from "./controls/text-control";
import { NumberControl } from "./controls/number-control";
import { SwitchControl } from "./controls/switch-control";
import { PillSelectControl } from "./controls/pill-select-control";
import { SelectControl } from "./controls/select-control";
import { SliderControl } from "./controls/slider-control";
import { KeyValueControl } from "./controls/key-value-control";
import { TagsControl } from "./controls/tags-control";

export interface FormFieldRendererProps {
  field: FormFieldSchema;
  value: any;
  formValues: Record<string, any>;
  error?: string;
  onChange: (val: any) => void;
  disabled?: boolean;
}

/** 栅格跨列映射表 */
const COL_SPAN_MAP: Record<number, string> = {
  1: "col-span-12 sm:col-span-1",
  2: "col-span-12 sm:col-span-2",
  3: "col-span-12 sm:col-span-3",
  4: "col-span-12 sm:col-span-4",
  5: "col-span-12 sm:col-span-5",
  6: "col-span-12 sm:col-span-6",
  7: "col-span-12 sm:col-span-7",
  8: "col-span-12 sm:col-span-8",
  9: "col-span-12 sm:col-span-9",
  10: "col-span-12 sm:col-span-10",
  11: "col-span-12 sm:col-span-11",
  12: "col-span-12"
};

export function FormFieldRenderer({
  field,
  value,
  formValues,
  error,
  onChange,
  disabled: globalDisabled
}: FormFieldRendererProps) {
  // 动态联动计算隐藏与禁用
  const isHidden = typeof field.hidden === "function" ? field.hidden(formValues) : Boolean(field.hidden);
  if (isHidden) return null;

  const isFieldDisabled = typeof field.disabled === "function" ? field.disabled(formValues) : Boolean(field.disabled);
  const isDisabled = globalDisabled || isFieldDisabled;
  const isRequired = Boolean(field.validation?.required);
  const colSpanClass = COL_SPAN_MAP[field.colSpan || 12] || "col-span-12";

  // 开关控件自带内置 Label，使用自包含渲染
  if (field.type === "switch") {
    return (
      <div className={cn(colSpanClass, "space-y-1")}>
        <SwitchControl field={field} value={value} onChange={onChange} disabled={isDisabled} />
        {error && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-mono pt-0.5 animate-in fade-in">
            <AlertCircle className="size-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(colSpanClass, "space-y-1.5")}>
      {/* 字段 Label 头部 */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>{field.label}</span>
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
          {field.badge && (
            <Badge variant={field.badge.variant || "outline"} className="text-[9px] px-1.5 py-0 h-3.5 font-mono">
              {field.badge.text}
            </Badge>
          )}
        </label>

        {field.description && (
          <div className="flex items-center text-muted-foreground/60 hover:text-muted-foreground transition-colors" title={field.description}>
            <HelpCircle className="size-3.5" />
          </div>
        )}
      </div>

      {/* 控件渲染分发 */}
      <div>
        {field.type === "text" || field.type === "password" || field.type === "email" || field.type === "url" || field.type === "textarea" ? (
          <TextControl field={field} value={value} onChange={onChange} disabled={isDisabled} hasError={Boolean(error)} />
        ) : field.type === "number" ? (
          <NumberControl field={field} value={value} onChange={onChange} disabled={isDisabled} hasError={Boolean(error)} />
        ) : field.type === "pill-select" ? (
          <PillSelectControl field={field} value={value} onChange={onChange} disabled={isDisabled} />
        ) : field.type === "select" ? (
          <SelectControl field={field} value={value} onChange={onChange} disabled={isDisabled} hasError={Boolean(error)} />
        ) : field.type === "slider" ? (
          <SliderControl field={field} value={value} onChange={onChange} disabled={isDisabled} />
        ) : field.type === "key-value" ? (
          <KeyValueControl field={field} value={value} onChange={onChange} disabled={isDisabled} />
        ) : field.type === "tags" ? (
          <TagsControl field={field} value={value} onChange={onChange} disabled={isDisabled} />
        ) : field.type === "custom" && field.render ? (
          field.render({
            value,
            onChange,
            values: formValues,
            error,
            disabled: isDisabled
          })
        ) : (
          <TextControl field={field} value={value} onChange={onChange} disabled={isDisabled} hasError={Boolean(error)} />
        )}
      </div>

      {/* 辅助副文案（如果不是通过 tooltip 展示，则下方小字补充） */}
      {field.description && field.type !== "slider" && (
        <p className="text-[11px] text-muted-foreground leading-tight">
          {field.description}
        </p>
      )}

      {/* 校验错误提示 */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-mono pt-0.5 animate-in fade-in">
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
