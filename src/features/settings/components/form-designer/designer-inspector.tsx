import { useState } from "react";
import { Sliders, Settings2, Trash2, Plus, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import type { FormFieldSchema, FormSectionSchema, SelectOption } from "@/shared/ui/schema-form";

export interface DesignerInspectorProps {
  selectedField: FormFieldSchema | null;
  selectedSection: FormSectionSchema | null;
  onUpdateField: (updated: FormFieldSchema) => void;
  onUpdateSection: (updated: FormSectionSchema) => void;
  onDeleteField: (fieldName: string) => void;
  onDeleteSection: (sectionId: string) => void;
}

export function DesignerInspector({
  selectedField,
  selectedSection,
  onUpdateField,
  onUpdateSection,
  onDeleteField,
  onDeleteSection
}: DesignerInspectorProps) {
  // 若未选中任何内容
  if (!selectedField && !selectedSection) {
    return (
      <div className="w-80 shrink-0 flex flex-col items-center justify-center p-6 text-center border-l border-border/80 bg-card/40 backdrop-blur-md text-muted-foreground space-y-2">
        <Sliders className="size-8 text-muted-foreground/40 stroke-1" />
        <div className="text-xs font-semibold text-foreground">属性配置面板</div>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          点击画布中的任意分块卡片或字段控件，即可在此实时调整属性、排版栅格与校验规则。
        </p>
      </div>
    );
  }

  // ─── 1. 字段属性编辑视图 ───
  if (selectedField) {
    const isOptionsSupported = selectedField.type === "select" || selectedField.type === "pill-select" || selectedField.type === "multi-select";
    const isNumberSupported = selectedField.type === "number" || selectedField.type === "slider";

    const handleOptionChange = (index: number, key: keyof SelectOption, val: any) => {
      const currentOptions = [...(selectedField.options || [])];
      currentOptions[index] = { ...currentOptions[index], [key]: val };
      onUpdateField({ ...selectedField, options: currentOptions });
    };

    const handleAddOption = () => {
      const currentOptions = [...(selectedField.options || [])];
      const count = currentOptions.length + 1;
      currentOptions.push({
        label: `选项 ${count}`,
        value: `option_${count}`
      });
      onUpdateField({ ...selectedField, options: currentOptions });
    };

    const handleRemoveOption = (index: number) => {
      const currentOptions = (selectedField.options || []).filter((_, i) => i !== index);
      onUpdateField({ ...selectedField, options: currentOptions });
    };

    return (
      <div className="w-80 shrink-0 flex flex-col border-l border-border/80 bg-card/40 backdrop-blur-md overflow-hidden">
        {/* 头部 */}
        <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <Settings2 className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground truncate block">
                {selectedField.label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                类型: {selectedField.type}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteField(selectedField.name)}
            className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="删除此字段"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {/* 属性表单 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 基础配置 */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
              基础属性 (Basic)
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">字段键名 (Field Key)</label>
              <input
                type="text"
                value={selectedField.name}
                onChange={(e) => onUpdateField({ ...selectedField, name: e.target.value })}
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">显示标题 (Label)</label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => onUpdateField({ ...selectedField, label: e.target.value })}
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">占位提示 (Placeholder)</label>
              <input
                type="text"
                value={selectedField.placeholder || ""}
                onChange={(e) => onUpdateField({ ...selectedField, placeholder: e.target.value })}
                placeholder="请输入占位文本..."
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">说明文案 (Description)</label>
              <textarea
                rows={2}
                value={selectedField.description || ""}
                onChange={(e) => onUpdateField({ ...selectedField, description: e.target.value })}
                placeholder="描述字段用途..."
                className="w-full rounded-lg border border-border/80 bg-muted/30 p-2 text-xs outline-none focus:border-primary text-foreground resize-none"
              />
            </div>
          </div>

          {/* 栅格排版 */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                栅格列宽 (Layout Width)
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">
                {selectedField.colSpan || 12}/12 ({(Math.round(((selectedField.colSpan || 12) / 12) * 100))}%)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {[
                { label: "1/1 全宽", span: 12 },
                { label: "3/4 宽", span: 9 },
                { label: "2/3 宽", span: 8 },
                { label: "1/2 半宽", span: 6 },
                { label: "1/3 宽", span: 4 },
                { label: "1/4 宽", span: 3 },
                { label: "1/6 宽", span: 2 }
              ].map((g) => (
                <button
                  key={g.span}
                  type="button"
                  onClick={() => onUpdateField({ ...selectedField, colSpan: g.span as any })}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    (selectedField.colSpan || 12) === g.span
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="text-[10px] block truncate">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 数值度量类特有属性 */}
          {isNumberSupported && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                度量配置 (Metrics)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">单位后缀 (Unit)</label>
                  <input
                    type="text"
                    value={selectedField.unit || ""}
                    onChange={(e) => onUpdateField({ ...selectedField, unit: e.target.value })}
                    placeholder="如 ms, MB, %"
                    className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">步进增量 (Step)</label>
                  <input
                    type="number"
                    value={selectedField.step ?? 1}
                    onChange={(e) => onUpdateField({ ...selectedField, step: parseFloat(e.target.value) || 1 })}
                    className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 选项类特有属性 */}
          {isOptionsSupported && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                  候选项配置 (Options)
                </span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-[11px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="size-3" /> 添加
                </button>
              </div>

              <div className="space-y-1.5">
                {(selectedField.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border/80 bg-muted/20">
                    <input
                      type="text"
                      placeholder="标签"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(i, "label", e.target.value)}
                      className="w-1/2 h-7 rounded border border-border/60 bg-background px-2 text-[11px] outline-none text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="值"
                      value={String(opt.value)}
                      onChange={(e) => handleOptionChange(i, "value", e.target.value)}
                      className="flex-1 h-7 rounded border border-border/60 bg-background px-2 text-[11px] font-mono outline-none text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="p-1 text-muted-foreground hover:text-rose-400 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 校验规则 */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
              校验规则 (Validation)
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border border-border/80 bg-muted/20">
              <span className="text-xs font-medium text-foreground">必填字段 (Required)</span>
              <Switch
                checked={Boolean(selectedField.validation?.required)}
                onCheckedChange={(c) =>
                  onUpdateField({
                    ...selectedField,
                    validation: { ...(selectedField.validation || {}), required: c }
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">最小值 / 最短 (Min)</label>
                <input
                  type="number"
                  value={selectedField.validation?.min ?? ""}
                  onChange={(e) =>
                    onUpdateField({
                      ...selectedField,
                      validation: {
                        ...(selectedField.validation || {}),
                        min: e.target.value ? parseFloat(e.target.value) : undefined
                      }
                    })
                  }
                  placeholder="无限制"
                  className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">最大值 / 最长 (Max)</label>
                <input
                  type="number"
                  value={selectedField.validation?.max ?? ""}
                  onChange={(e) =>
                    onUpdateField({
                      ...selectedField,
                      validation: {
                        ...(selectedField.validation || {}),
                        max: e.target.value ? parseFloat(e.target.value) : undefined
                      }
                    })
                  }
                  placeholder="无限制"
                  className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. 分块属性编辑视图 ───
  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-border/80 bg-card/40 backdrop-blur-md overflow-hidden">
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="size-4 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground truncate block">
              {selectedSection.title}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              分块卡片 ID: {selectedSection.id}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDeleteSection(selectedSection.id)}
          className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="删除此分块"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
            分块卡片属性
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">分块主标题 (Title)</label>
            <input
              type="text"
              value={selectedSection.title}
              onChange={(e) => onUpdateSection({ ...selectedSection, title: e.target.value })}
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">副标题说明 (Description)</label>
            <textarea
              rows={2}
              value={selectedSection.description || ""}
              onChange={(e) => onUpdateSection({ ...selectedSection, description: e.target.value })}
              className="w-full rounded-lg border border-border/80 bg-muted/30 p-2 text-xs outline-none focus:border-primary text-foreground resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">右上角徽章文案 (Badge Text)</label>
            <input
              type="text"
              value={selectedSection.badge?.text || ""}
              onChange={(e) =>
                onUpdateSection({
                  ...selectedSection,
                  badge: e.target.value ? { text: e.target.value, variant: selectedSection.badge?.variant || "primary" } : undefined
                })
              }
              placeholder="如 必填项 / 高级选项"
              className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg border border-border/80 bg-muted/20">
            <span className="text-xs font-medium text-foreground">允许卡片折叠/展开</span>
            <Switch
              checked={Boolean(selectedSection.collapsible)}
              onCheckedChange={(c) => onUpdateSection({ ...selectedSection, collapsible: c })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
