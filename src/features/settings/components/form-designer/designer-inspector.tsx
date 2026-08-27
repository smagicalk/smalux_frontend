import { useState } from "react";
import { Sliders, Settings2, Trash2, Plus, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import type { FormFieldSchema, FormSectionSchema, SelectOption } from "@/shared/ui/schema-form";

export interface DesignerInspectorProps {
  selectedField: FormFieldSchema | null;
  selectedSection: FormSectionSchema | null;
  formMeta: {
    id: string;
    name: string;
    version?: string;
    description?: string;
  };
  onUpdateFormMeta: (meta: { id: string; name: string; version?: string; description?: string }) => void;
  onUpdateField: (updated: FormFieldSchema) => void;
  onUpdateSection: (updated: FormSectionSchema) => void;
  onDeleteField: (fieldName: string) => void;
  onDeleteSection: (sectionId: string) => void;
}

export function DesignerInspector({
  selectedField,
  selectedSection,
  formMeta,
  onUpdateFormMeta,
  onUpdateField,
  onUpdateSection,
  onDeleteField,
  onDeleteSection
}: DesignerInspectorProps) {
  // 若未选中任何字段或分块，呈现表单全局元数据配置
  if (!selectedField && !selectedSection) {
    return (
      <div className="w-80 shrink-0 flex flex-col border-l border-border/80 bg-card/40 backdrop-blur-md overflow-hidden">
        <div className="p-3.5 border-b border-border/60 flex items-center gap-2 bg-muted/20">
          <Sparkles className="size-4 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground truncate block">
              表单全局配置 (Global Form)
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              用于生成提交 JSON 与导出 Schema
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
              全局必填标识 (Required Metadata)
            </div>

            {/* 必填 Form ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <span>表单唯一标识 (Form ID)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formMeta.id}
                onChange={(e) => onUpdateFormMeta({ ...formMeta, id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                placeholder="如 edge_node_baseline_config"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                API 提交、持久化与检索的唯一主键 (仅小写英文字母/数字/下划线)
              </p>
            </div>

            {/* 必填表单名称 */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <span>表单展示名称 (Form Name)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formMeta.name}
                onChange={(e) => onUpdateFormMeta({ ...formMeta, name: e.target.value })}
                placeholder="如 边缘节点基线安全加固配置"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* 版本号 */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">版本号 (Version)</label>
              <input
                type="text"
                value={formMeta.version || "1.0.0"}
                onChange={(e) => onUpdateFormMeta({ ...formMeta, version: e.target.value })}
                placeholder="如 1.0.0"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* 描述 */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">表单说明 (Description)</label>
              <textarea
                rows={3}
                value={formMeta.description || ""}
                onChange={(e) => onUpdateFormMeta({ ...formMeta, description: e.target.value })}
                placeholder="描述此表单的应用场景与用途..."
                className="w-full rounded-lg border border-border/80 bg-muted/30 p-2 text-xs outline-none focus:border-primary text-foreground resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 1. 字段属性编辑视图 ───
  if (selectedField) {
    const isDisplayOnly = selectedField.type === "divider" || selectedField.type === "alert";
    const isOptionsSupported =
      selectedField.type === "select" ||
      selectedField.type === "pill-select" ||
      selectedField.type === "multi-select" ||
      selectedField.type === "checkbox-group" ||
      selectedField.type === "radio-group";
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
                {selectedField.label || (selectedField.type === "divider" ? "分割线" : "提示条")}
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">
                  类型: {selectedField.type}
                </span>
                {isDisplayOnly && (
                  <Badge variant="neutral" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                    仅展示
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteField(selectedField.name)}
            className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="删除此控件"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {/* 属性表单 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 基础配置 */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
              {isDisplayOnly ? "排版外观属性 (Display Layout)" : "基础属性 (Basic)"}
            </div>

            {/* 仅数据录入类控件需要配置 Field Key */}
            {!isDisplayOnly && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <span>字段键名 (Field Key)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => onUpdateField({ ...selectedField, name: e.target.value })}
                  placeholder="如 user_email, server_port"
                  className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
                <p className="text-[10px] text-muted-foreground">
                  提交生成的 JSON 对象的属性键名
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                {selectedField.type === "divider" ? "分割线标题 (可选)" : selectedField.type === "alert" ? "提示标题 (Title)" : "显示标题 (Label)"}
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => onUpdateField({ ...selectedField, label: e.target.value })}
                placeholder={selectedField.type === "divider" ? "留空则仅展示横线" : "输入显示文本..."}
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            {!isDisplayOnly && (
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
            )}

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

          {/* 高度与尺寸规格 */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                高度网格单位 (Height Units)
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">
                {selectedField.heightUnit || 1}x 单位
              </span>
            </div>

            {/* 1x ~ 4x 快速单位切换 */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {[
                { label: "1x (单行)", unit: 1 },
                { label: "2x (双倍)", unit: 2 },
                { label: "3x (三倍)", unit: 3 },
                { label: "4x (四倍)", unit: 4 }
              ].map((u) => (
                <button
                  key={u.unit}
                  type="button"
                  onClick={() => onUpdateField({ ...selectedField, heightUnit: u.unit, customHeight: undefined })}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    (selectedField.heightUnit || 1) === u.unit && !selectedField.customHeight
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="text-[10px] block truncate">{u.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                控件尺寸规格 (Size Mode)
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {selectedField.size || "md"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              {[
                { label: "紧凑 (Sm · 32px)", key: "sm" },
                { label: "标准 (Md · 36px)", key: "md" },
                { label: "舒适 (Lg · 44px)", key: "lg" }
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onUpdateField({ ...selectedField, size: s.key as any })}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    (selectedField.size || "md") === s.key
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="text-[10px] block truncate">{s.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {selectedField.type === "textarea" ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">显示行数 (Rows)</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={selectedField.rows || 3}
                    onChange={(e) => onUpdateField({ ...selectedField, rows: parseInt(e.target.value) || 3 })}
                    className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">固定像素 (如 120px)</label>
                  <input
                    type="text"
                    placeholder="如 120px"
                    value={selectedField.customHeight || ""}
                    onChange={(e) => onUpdateField({ ...selectedField, customHeight: e.target.value })}
                    className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-foreground">自定义像素高度 (Custom Height)</label>
                <input
                  type="text"
                  placeholder="默认自适应，可输入 50px / 80px / 120px 等"
                  value={selectedField.customHeight || ""}
                  onChange={(e) => onUpdateField({ ...selectedField, customHeight: e.target.value })}
                  className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>
            )}
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

          {/* 对齐方式（适用于 pill-select） */}
          {selectedField.type === "pill-select" && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                  药丸胶囊对齐方式 (Alignment)
                </span>
                <span className="text-[10px] font-mono text-primary font-bold">
                  {selectedField.align === "center" ? "居中" : selectedField.align === "right" ? "靠右" : selectedField.align === "justify" ? "等宽" : "靠左"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                {[
                  { label: "靠左", key: "left" },
                  { label: "居中", key: "center" },
                  { label: "靠右", key: "right" },
                  { label: "等宽", key: "justify" }
                ].map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => onUpdateField({ ...selectedField, align: a.key as any })}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      (selectedField.align || "left") === a.key
                        ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[10px] block truncate">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 代码/脚本语言配置 */}
          {selectedField.type === "code" && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                  脚本语法语言 (Language)
                </span>
                <span className="text-[10px] font-mono text-primary font-bold uppercase">
                  {selectedField.language || "yaml"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                {["yaml", "json", "bash", "javascript"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onUpdateField({ ...selectedField, language: lang })}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      (selectedField.language || "yaml") === lang
                        ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[10px] block truncate">{lang}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 警告提示条类型配置 */}
          {selectedField.type === "alert" && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                  提示条变体类型 (Variant)
                </span>
                <span className="text-[10px] font-mono text-primary font-bold uppercase">
                  {selectedField.alertType || "info"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                {[
                  { label: "通知", key: "info" },
                  { label: "成功", key: "success" },
                  { label: "警告", key: "warning" },
                  { label: "危险", key: "danger" }
                ].map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => onUpdateField({ ...selectedField, alertType: a.key as any })}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      (selectedField.alertType || "info") === a.key
                        ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[10px] block truncate">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 星级评分上限配置 */}
          {selectedField.type === "rate" && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                  最大评星上限 (Max Rate)
                </span>
                <span className="text-[10px] font-mono text-primary font-bold">
                  {selectedField.maxRate || 5} 级
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {[3, 5, 10].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onUpdateField({ ...selectedField, maxRate: m })}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      (selectedField.maxRate || 5) === m
                        ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[10px] block">{m} 颗星</span>
                  </button>
                ))}
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

          {/* 校验规则（仅数据录入类控件显示） */}
          {!isDisplayOnly && (
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
          )}
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
