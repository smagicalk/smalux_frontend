import { useMemo, useState } from "react";
import {
  Sliders,
  Check,
  RotateCcw,
  Info,
  Layers,
  Code2,
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  FileJson
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { toast } from "@/shared/ui/toaster";
import type { AgentTaskSchema, SchemaField } from "../../types/task-schema";

interface DynamicSchemaFormProps {
  schema: AgentTaskSchema;
  values: Record<string, unknown>;
  onChange: (newValues: Record<string, unknown>) => void;
  onReset: () => void;
  isSaving?: boolean;
  onSave?: () => void;
  onDispatchNow?: () => void;
  isDispatching?: boolean;
}

export function DynamicSchemaForm({
  schema,
  values,
  onChange,
  onReset,
  isSaving,
  onSave,
  onDispatchNow,
  isDispatching
}: DynamicSchemaFormProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  // Group fields by their `group` property
  const groupedFields = useMemo(() => {
    const map = new Map<string, SchemaField[]>();
    for (const field of schema.fields) {
      const groupName = field.group || "基础参数设置";
      if (!map.has(groupName)) {
        map.set(groupName, []);
      }
      map.get(groupName)!.push(field);
    }
    return Array.from(map.entries()).map(([groupName, fields]) => ({
      groupName,
      fields
    }));
  }, [schema.fields]);

  // Handle single field change
  const handleFieldChange = (fieldId: string, value: unknown) => {
    onChange({
      ...values,
      [fieldId]: value
    });
  };

  // Handle multi-checkbox toggle
  const handleCheckboxToggle = (fieldId: string, optionValue: string | number) => {
    const currentList = Array.isArray(values[fieldId]) ? (values[fieldId] as Array<string | number>) : [];
    const exists = currentList.includes(optionValue);
    const updated = exists
      ? currentList.filter((v) => v !== optionValue)
      : [...currentList, optionValue];
    handleFieldChange(fieldId, updated);
  };

  // Evaluate dependsOn condition
  const shouldRenderField = (field: SchemaField): boolean => {
    if (!field.dependsOn) return true;
    const parentValue = values[field.dependsOn.field];
    return parentValue === field.dependsOn.equals;
  };

  const copyJsonPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    toast.success("已复制当前任务的下发 Payload JSON 到剪贴板");
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Groups Rendering */}
      {groupedFields.map(({ groupName, fields }) => {
        const visibleFields = fields.filter(shouldRenderField);
        if (visibleFields.length === 0) return null;

        return (
          <div
            key={groupName}
            className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Layers className="size-4 text-primary" />
                <span>{groupName}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {visibleFields.length} 项参数配置
              </Badge>
            </div>

            <div className="space-y-4 text-xs">
              {visibleFields.map((field) => {
                const val = values[field.id] !== undefined ? values[field.id] : field.defaultValue;

                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-2 hover:border-border transition-colors"
                  >
                    {/* Header: Label + Description */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-rose-500 font-bold">*</span>
                          )}
                          <span className="text-[10px] font-mono text-muted-foreground/80 px-1 py-0.2 rounded bg-muted/50">
                            {field.id}
                          </span>
                        </div>
                        {field.description && (
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            {field.description}
                          </div>
                        )}
                      </div>

                      {/* Switch widget rendered on the right top */}
                      {field.type === "switch" && (
                        <div className="shrink-0 pt-0.5">
                          <Switch
                            checked={Boolean(val)}
                            onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Field Content by Type */}
                    <div className="pt-1">
                      {/* 1. Slider / Range with Stepper */}
                      {field.type === "slider" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">设定数值:</span>
                            <span className="font-mono font-bold text-primary">
                              {Number(val)} {field.unit || ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={field.min ?? 1}
                              max={field.max ?? 100}
                              step={field.step ?? 1}
                              value={Number(val)}
                              onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                              className="flex-1 accent-primary cursor-pointer"
                            />
                            <div className="flex items-center h-7 w-20 rounded-md border border-border/80 bg-background px-1.5 focus-within:border-primary">
                              <input
                                type="number"
                                min={field.min ?? 1}
                                max={field.max ?? 100}
                                step={field.step ?? 1}
                                value={Number(val)}
                                onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                                className="w-full text-right font-mono font-bold text-xs bg-transparent outline-none text-foreground"
                              />
                              {field.unit && (
                                <span className="text-[10px] font-mono text-muted-foreground ml-1">{field.unit}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Number Input */}
                      {field.type === "number" && (
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={Number(val)}
                            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                            className="h-8.5 flex-1 rounded-lg border border-border/80 bg-background px-3 text-xs font-mono font-medium outline-none focus:border-primary text-foreground transition-colors"
                          />
                          {field.unit && (
                            <span className="text-xs font-mono text-muted-foreground bg-muted/40 border border-border/60 px-2.5 h-8.5 flex items-center rounded-lg">
                              {field.unit}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3. Text Input */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={String(val || "")}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full h-8.5 rounded-lg border border-border/80 bg-background px-3 text-xs outline-none focus:border-primary text-foreground transition-colors"
                        />
                      )}

                      {/* 4. Textarea */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={String(val || "")}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-border/80 bg-background p-2.5 text-xs font-mono outline-none focus:border-primary text-foreground transition-colors resize-y"
                        />
                      )}

                      {/* 5. Select Dropdown */}
                      {field.type === "select" && (
                        <select
                          value={String(val)}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full h-8.5 rounded-lg border border-border/80 bg-background px-3 text-xs font-medium outline-none focus:border-primary text-foreground transition-colors cursor-pointer"
                        >
                          {field.options?.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 6. Checkbox Group (Multi-select) */}
                      {field.type === "checkbox-group" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {field.options?.map((opt) => {
                            const checked = Array.isArray(val) && (val as Array<string | number>).includes(opt.value);

                            return (
                              <label
                                key={String(opt.value)}
                                onClick={() => handleCheckboxToggle(field.id, opt.value)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                  checked
                                    ? "bg-primary/10 border-primary text-primary font-medium shadow-2xs"
                                    : "bg-background/60 border-border/70 text-foreground hover:bg-muted/40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {}} // Handled by label click
                                  className="size-3.5 accent-primary rounded cursor-pointer pointer-events-none"
                                />
                                <span className="flex-1">{opt.label}</span>
                                {opt.badge && (
                                  <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                                    {opt.badge}
                                  </Badge>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* JSON Payload Inspector Box */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <FileJson className="size-4 text-purple-400" />
            <span>实时下发 Payload JSON 预览 ({Object.keys(values).length} 项参数)</span>
            {showRawJson ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={copyJsonPayload}
            className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
          >
            <Copy className="size-3" />
            <span>复制 JSON</span>
          </Button>
        </div>

        {showRawJson && (
          <pre className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
            {JSON.stringify(
              {
                taskId: schema.id,
                taskCategory: schema.category,
                parameters: values
              },
              null,
              2
            )}
          </pre>
        )}
      </div>

      {/* Form Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/70">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-xs h-8 px-3.5 cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          <span>恢复 Schema 默认值</span>
        </Button>

        <div className="flex items-center gap-2.5">
          {onDispatchNow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDispatching}
              onClick={onDispatchNow}
              className="text-xs h-8 px-3.5 cursor-pointer gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500"
            >
              <Check className="size-3.5" />
              <span>{isDispatching ? "指令发送中..." : "向 Agent 单次下发测试"}</span>
            </Button>
          )}

          {onSave && (
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={onSave}
              className="text-xs h-8 px-5 font-bold cursor-pointer gap-1.5 shadow-sm"
            >
              <Check className="size-3.5" />
              <span>{isSaving ? "保存同步中..." : "保存并下发调度参数"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
