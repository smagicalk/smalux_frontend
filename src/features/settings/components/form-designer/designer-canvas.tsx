import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Layers,
  FolderPlus,
  Settings,
  GripVertical,
  Minus,
  Plus,
  KeyRound
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { FormSectionSchema, FormFieldSchema } from "@/shared/ui/schema-form";
import type { PaletteItem } from "./designer-palette";

export interface DesignerCanvasProps {
  sections: FormSectionSchema[];
  selectedField: FormFieldSchema | null;
  selectedSection: FormSectionSchema | null;
  activeSectionId: string | null;
  onSelectField: (field: FormFieldSchema, section: FormSectionSchema) => void;
  onSelectSection: (section: FormSectionSchema) => void;
  onMoveField: (sectionId: string, fieldIndex: number, direction: "up" | "down") => void;
  onDuplicateField: (sectionId: string, fieldIndex: number) => void;
  onDeleteField: (fieldName: string) => void;
  onDropFieldReorder?: (sourceSectionId: string, sourceIndex: number, targetSectionId: string, targetIndex: number) => void;
  onDropNewField?: (item: PaletteItem, targetSectionId: string, targetIndex?: number) => void;
  onAddSection: () => void;
}

/** 栅格宽度映射表 */
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

/**
 * 计算字段在画布中的真实渲染高度
 */
function getFieldVisualHeight(field: FormFieldSchema): string | undefined {
  if (field.customHeight) return field.customHeight;
  const unit = field.heightUnit || 1;
  const size = field.size || "md";
  const baseH = size === "sm" ? 30 : size === "lg" ? 42 : 36;
  if (unit > 1) {
    return `${baseH * unit + (unit - 1) * 8}px`;
  }
  return undefined;
}

/**
 * 真实控件高颜值外观预览（支持根据 size 与 customHeight / heightUnit 实时调整高度）
 */
function CanvasFieldVisualPreview({ field }: { field: FormFieldSchema }) {
  const size = field.size || "md";
  const computedHeight = getFieldVisualHeight(field);
  const heightClass = size === "sm" ? "h-7 text-[10px]" : size === "lg" ? "h-10 text-xs" : "h-8 text-xs";

  if (field.type === "switch") {
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className={cn(
          "flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60",
          !computedHeight && heightClass
        )}
      >
        <span className="text-[11px] text-muted-foreground font-mono">
          {field.defaultValue ? "已启用 (Enabled)" : "已停用 (Disabled)"}
        </span>
        <Switch checked={Boolean(field.defaultValue ?? true)} disabled className="scale-75 origin-right" />
      </div>
    );
  }

  if (field.type === "pill-select") {
    const options = field.options || [{ label: "选项 1", value: "1" }, { label: "选项 2", value: "2" }];
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className={cn(
          "flex flex-wrap items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/60",
          !computedHeight && "min-h-8"
        )}
      >
        {options.slice(0, 3).map((opt, i) => (
          <span
            key={i}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-mono",
              i === 0 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground"
            )}
          >
            {opt.label}
          </span>
        ))}
        {options.length > 3 && (
          <span className="text-[10px] text-muted-foreground/60 self-center">+{options.length - 3}</span>
        )}
      </div>
    );
  }

  if (field.type === "slider") {
    const val = field.defaultValue ?? 75;
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className="flex flex-col justify-center space-y-1 p-2 rounded-lg bg-muted/30 border border-border/60"
      >
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>0{field.unit}</span>
          <span className="font-bold text-primary">{val}{field.unit || "%"}</span>
          <span>100{field.unit}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }} />
        </div>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className={cn(
          "flex items-center rounded-lg border border-border/60 bg-muted/30 overflow-hidden font-mono",
          !computedHeight && heightClass
        )}
      >
        <div className="px-2 bg-muted/60 text-muted-foreground flex items-center h-full"><Minus className="size-2.5" /></div>
        <div className="flex-1 text-center text-[11px] text-foreground">{field.defaultValue ?? 100} {field.unit}</div>
        <div className="px-2 bg-muted/60 text-muted-foreground flex items-center h-full"><Plus className="size-2.5" /></div>
      </div>
    );
  }

  if (field.type === "key-value") {
    const pairs = Array.isArray(field.defaultValue) ? field.defaultValue : [{ key: "X-Key", value: "Value" }];
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className="space-y-1 p-1.5 rounded-lg border border-border/60 bg-muted/30 font-mono text-[10px] overflow-hidden"
      >
        {pairs.slice(0, 3).map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-1 text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-background border border-border/60 text-foreground font-bold">{p.key || "key"}</span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-background border border-border/60 text-muted-foreground truncate">{p.value || "val"}</span>
          </div>
        ))}
      </div>
    );
  }

  if (field.type === "tags") {
    const tags = Array.isArray(field.defaultValue) && field.defaultValue.length > 0 ? field.defaultValue : ["tag-1", "tag-2"];
    return (
      <div
        style={computedHeight ? { height: computedHeight } : undefined}
        className="flex flex-wrap items-center gap-1 p-1.5 rounded-lg border border-border/60 bg-muted/30"
      >
        {tags.map((t: string, i: number) => (
          <span key={i} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono">
            #{t}
          </span>
        ))}
      </div>
    );
  }

  if (field.type === "textarea") {
    const defaultRowsHeight = (field.rows || 3) * 22 + 16;
    return (
      <div
        style={{ height: computedHeight || `${defaultRowsHeight}px` }}
        className="rounded-lg border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground/60 font-mono resize-none overflow-hidden"
      >
        {field.placeholder || "多行长文本输入区域..."}
      </div>
    );
  }

  // 默认普通输入框
  return (
    <div
      style={computedHeight ? { height: computedHeight } : undefined}
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 px-2.5 flex items-center justify-between font-mono truncate",
        !computedHeight && heightClass
      )}
    >
      <span className="truncate">{field.placeholder || `输入${field.label}...`}</span>
      {field.type === "password" && <KeyRound className="size-3 text-muted-foreground/50 shrink-0" />}
    </div>
  );
}

export function DesignerCanvas({
  sections,
  selectedField,
  selectedSection,
  activeSectionId,
  onSelectField,
  onSelectSection,
  onMoveField,
  onDuplicateField,
  onDeleteField,
  onDropFieldReorder,
  onDropNewField,
  onAddSection
}: DesignerCanvasProps) {
  // 正在拖拽的源数据
  const [draggingItem, setDraggingItem] = useState<{ sectionId: string; index: number } | null>(null);
  // 拖拽悬浮目标位置（指示线）
  const [dragOverTarget, setDragOverTarget] = useState<{ sectionId: string; index: number } | null>(null);

  // 拖拽放置处理
  const handleDrop = (e: React.DragEvent, targetSectionId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.source === "palette" && data.item && onDropNewField) {
        // 从物料库拖拽新控件
        onDropNewField(data.item, targetSectionId, targetIndex);
      } else if (data.source === "canvas" && onDropFieldReorder) {
        // 画布已有字段移动排序
        onDropFieldReorder(data.sectionId, data.index, targetSectionId, targetIndex);
      }
    } catch {
      // ignore JSON parse error
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-background/50">
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/80 rounded-2xl text-center space-y-3 bg-muted/10">
          <Layers className="size-10 text-muted-foreground/40 stroke-1" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">画布当前为空</h4>
            <p className="text-xs text-muted-foreground">
              拖拽左侧物料库控件到此处，或点击下方按钮新建分块卡片。
            </p>
          </div>
          <button
            type="button"
            onClick={onAddSection}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md cursor-pointer hover:bg-primary/90 transition-all"
          >
            <FolderPlus className="size-3.5" />
            <span>新建分块卡片</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {sections.map((sec) => {
            const isSectionSelected = selectedSection?.id === sec.id && !selectedField;
            const Icon = sec.icon || Settings;

            return (
              <div
                key={sec.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection(sec);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => handleDrop(e, sec.id, sec.fields.length)}
                className={cn(
                  "rounded-2xl border bg-card/70 backdrop-blur-md shadow-xs overflow-hidden transition-all",
                  isSectionSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "border-border/80 hover:border-border"
                )}
              >
                {/* 分块头部 */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-2xs">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">
                          {sec.title}
                        </span>
                        {sec.badge && (
                          <Badge variant={sec.badge.variant || "primary"} className="text-[10px] px-1.5 py-0 h-4 font-mono">
                            {sec.badge.text}
                          </Badge>
                        )}
                      </div>
                      {sec.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {sec.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-md">
                    {sec.fields.length} 个字段 · 支持拖拽调序
                  </span>
                </div>

                {/* 字段列表容器 */}
                <div className="p-4 sm:p-5">
                  {sec.fields.length === 0 ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={(e) => handleDrop(e, sec.id, 0)}
                      className="p-8 border-2 border-dashed border-border/80 rounded-xl text-center text-xs text-muted-foreground/70 font-mono bg-muted/10 hover:bg-primary/5 hover:border-primary/40 transition-colors"
                    >
                      ✨ 拖拽左侧物料控件至此处放入
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-3.5">
                      {sec.fields.map((field, idx) => {
                        const isFieldSelected = selectedField?.name === field.name;
                        const colClass = COL_SPAN_MAP[field.colSpan || 12] || "col-span-12";
                        const isDragOver = dragOverTarget?.sectionId === sec.id && dragOverTarget?.index === idx;

                        return (
                          <div
                            key={field.name}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDraggingItem({ sectionId: sec.id, index: idx });
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({ source: "canvas", sectionId: sec.id, index: idx })
                              );
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingItem(null);
                              setDragOverTarget(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = "move";
                              if (dragOverTarget?.sectionId !== sec.id || dragOverTarget?.index !== idx) {
                                setDragOverTarget({ sectionId: sec.id, index: idx });
                              }
                            }}
                            onDrop={(e) => handleDrop(e, sec.id, idx)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectField(field, sec);
                            }}
                            className={cn(
                              colClass,
                              "group relative rounded-xl border p-2.5 transition-all cursor-pointer select-none",
                              isFieldSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/40",
                              isDragOver && "border-t-2 border-t-primary ring-2 ring-primary/30"
                            )}
                          >
                            {/* 字段悬浮操作按钮组 */}
                            <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center gap-0.5 bg-background/95 backdrop-blur-xs border border-border/80 p-0.5 rounded-lg shadow-sm z-10">
                              <div className="p-1 text-muted-foreground/60 cursor-grab active:cursor-grabbing hover:text-foreground" title="按住拖拽排序">
                                <GripVertical className="size-3" />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveField(sec.id, idx, "up");
                                }}
                                disabled={idx === 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                                title="上移"
                              >
                                <ChevronUp className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveField(sec.id, idx, "down");
                                }}
                                disabled={idx === sec.fields.length - 1}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                                title="下移"
                              >
                                <ChevronDown className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateField(sec.id, idx);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="复制字段"
                              >
                                <Copy className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteField(field.name);
                                }}
                                className="p-1 text-muted-foreground hover:text-rose-400 cursor-pointer"
                                title="删除"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>

                            {/* 字段 Header */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between pr-1">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                  <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-primary cursor-grab" />
                                  <span>{field.label}</span>
                                  {field.validation?.required && <span className="text-rose-500 font-bold">*</span>}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/60">
                                  {field.colSpan || 12}/12
                                </span>
                              </div>

                              {/* 💡 真实高颜值控件外观预览 */}
                              <CanvasFieldVisualPreview field={field} />

                              {field.description && (
                                <p className="text-[10px] text-muted-foreground/70 truncate pt-0.5">
                                  {field.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 底部新增分块按钮 */}
          <button
            type="button"
            onClick={onAddSection}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/10 hover:bg-muted/30 text-xs font-mono text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FolderPlus className="size-4" />
            <span>+ 添加新的表单分块卡片 (Section)</span>
          </button>
        </div>
      )}
    </div>
  );
}
