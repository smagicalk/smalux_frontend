import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  Layers,
  FolderPlus,
  HelpCircle,
  Eye,
  Sliders,
  Settings
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { FormSectionSchema, FormFieldSchema } from "@/shared/ui/schema-form";

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
  onAddSection: () => void;
}

/** 栅格宽度映射 */
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
  onAddSection
}: DesignerCanvasProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-background/50">
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/80 rounded-2xl text-center space-y-3 bg-muted/10">
          <Layers className="size-10 text-muted-foreground/40 stroke-1" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">画布当前为空</h4>
            <p className="text-xs text-muted-foreground">
              点击左侧物料库的控件，或点击下方按钮新建您的第一个分块卡片。
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
                    {sec.fields.length} 个字段
                  </span>
                </div>

                {/* 字段列表容器 */}
                <div className="p-5 sm:p-6">
                  {sec.fields.length === 0 ? (
                    <div className="p-6 border border-dashed border-border/80 rounded-xl text-center text-xs text-muted-foreground/60 font-mono">
                      👈 点击左侧物料库控件，将字段添加至此分块
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-4">
                      {sec.fields.map((field, idx) => {
                        const isFieldSelected = selectedField?.name === field.name;
                        const colClass = COL_SPAN_MAP[field.colSpan || 12] || "col-span-12";

                        return (
                          <div
                            key={field.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectField(field, sec);
                            }}
                            className={cn(
                              colClass,
                              "group relative rounded-xl border p-3 transition-all cursor-pointer select-none",
                              isFieldSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/40"
                            )}
                          >
                            {/* 字段悬浮操作按钮组 */}
                            <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-background/90 backdrop-blur-xs border border-border/80 p-0.5 rounded-lg shadow-xs z-10">
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

                            {/* 字段模拟外观 */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                  <span>{field.label}</span>
                                  {field.validation?.required && <span className="text-rose-500 font-bold">*</span>}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/60">
                                  {field.type} · {field.colSpan || 12}/12
                                </span>
                              </div>

                              {/* 模拟输入框骨架 */}
                              <div className="h-8 rounded-lg border border-border/60 bg-background/80 px-2.5 flex items-center text-xs text-muted-foreground/50 font-mono truncate">
                                {field.placeholder || `${field.label} 输入区域...`}
                              </div>

                              {field.description && (
                                <p className="text-[10px] text-muted-foreground/70 truncate">
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
