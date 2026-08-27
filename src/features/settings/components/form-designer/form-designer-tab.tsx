import { useState } from "react";
import {
  Sparkles,
  Eye,
  Edit3,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Code2,
  Layers,
  FolderPlus
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { SchemaForm, type FormSectionSchema, type FormFieldSchema } from "@/shared/ui/schema-form";
import { DEFAULT_DESIGNER_SECTIONS } from "./default-designer-schema";
import { DesignerPalette, type PaletteItem } from "./designer-palette";
import { DesignerCanvas } from "./designer-canvas";
import { DesignerInspector } from "./designer-inspector";
import { SchemaImportExportModal } from "./schema-import-export-modal";

export function FormDesignerTab() {
  // 当前设计中的表单 Schema
  const [sections, setSections] = useState<FormSectionSchema[]>(() => DEFAULT_DESIGNER_SECTIONS);

  // 模式切换："design" | "preview"
  const [viewMode, setViewMode] = useState<"design" | "preview">("design");

  // 选中状态
  const [selectedField, setSelectedField] = useState<FormFieldSchema | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSectionSchema | null>(() => sections[0] || null);

  // 导入/导出弹窗
  const [modalMode, setModalMode] = useState<"export" | "import" | null>(null);

  // 预览模式下的提交数据展示
  const [previewResult, setPreviewResult] = useState<any>(null);

  // ─── 1. 添加控件到当前分块 ───
  const handleAddField = (item: PaletteItem) => {
    if (sections.length === 0) {
      handleAddSection();
    }

    const targetSection = selectedSection || sections[0];
    const timestamp = Date.now().toString().slice(-4);
    const newField: FormFieldSchema = {
      name: `${item.type}_${timestamp}`,
      type: item.type,
      label: `${item.label} ${timestamp}`,
      description: item.description,
      colSpan: item.defaultColSpan,
      placeholder: `请输入${item.label}...`,
      validation: { required: false }
    };

    if (item.type === "pill-select" || item.type === "select") {
      newField.options = [
        { label: "选项 A", value: "opt_a" },
        { label: "选项 B", value: "opt_b" }
      ];
      newField.defaultValue = "opt_a";
    } else if (item.type === "number") {
      newField.defaultValue = 100;
      newField.unit = "";
    } else if (item.type === "slider") {
      newField.defaultValue = 50;
      newField.unit = "%";
    }

    const updatedSections = sections.map((sec) => {
      if (sec.id === targetSection.id) {
        return {
          ...sec,
          fields: [...sec.fields, newField]
        };
      }
      return sec;
    });

    setSections(updatedSections);
    setSelectedField(newField);
    toast.success(`已添加控件「${item.label}」`);
  };

  // ─── 2. 添加新分块卡片 ───
  const handleAddSection = () => {
    const count = sections.length + 1;
    const newSec: FormSectionSchema = {
      id: `sec-${Date.now().toString().slice(-4)}`,
      title: `自定义分块卡片 ${count}`,
      description: "点击右侧面板配置此分块标题与说明",
      badge: { text: "新模块", variant: "primary" },
      collapsible: true,
      fields: []
    };
    setSections([...sections, newSec]);
    setSelectedSection(newSec);
    setSelectedField(null);
    toast.success("已创建新分块卡片");
  };

  // ─── 3. 更新字段 ───
  const handleUpdateField = (updated: FormFieldSchema) => {
    setSelectedField(updated);
    setSections(
      sections.map((sec) => ({
        ...sec,
        fields: sec.fields.map((f) => (f.name === updated.name ? updated : f))
      }))
    );
  };

  // ─── 4. 更新分块 ───
  const handleUpdateSection = (updated: FormSectionSchema) => {
    setSelectedSection(updated);
    setSections(sections.map((sec) => (sec.id === updated.id ? updated : sec)));
  };

  // ─── 5. 删除字段 ───
  const handleDeleteField = (fieldName: string) => {
    setSections(
      sections.map((sec) => ({
        ...sec,
        fields: sec.fields.filter((f) => f.name !== fieldName)
      }))
    );
    if (selectedField?.name === fieldName) {
      setSelectedField(null);
    }
    toast.success("已删除字段");
  };

  // ─── 6. 删除分块 ───
  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
      setSelectedField(null);
    }
    toast.success("已删除分块卡片");
  };

  // ─── 7. 字段上下移动 ───
  const handleMoveField = (sectionId: string, index: number, direction: "up" | "down") => {
    setSections(
      sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sec.fields.length) return sec;
        const newFields = [...sec.fields];
        const temp = newFields[index];
        newFields[index] = newFields[targetIndex];
        newFields[targetIndex] = temp;
        return { ...sec, fields: newFields };
      })
    );
  };

  // ─── 8. 复制字段 ───
  const handleDuplicateField = (sectionId: string, index: number) => {
    setSections(
      sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const source = sec.fields[index];
        const clone: FormFieldSchema = {
          ...source,
          name: `${source.name}_copy`,
          label: `${source.label} (副本)`
        };
        const newFields = [...sec.fields];
        newFields.splice(index + 1, 0, clone);
        return { ...sec, fields: newFields };
      })
    );
    toast.success("字段已复制");
  };

  // ─── 9. 拖拽排序/跨分块移动 ───
  const handleDropFieldReorder = (
    sourceSectionId: string,
    sourceIndex: number,
    targetSectionId: string,
    targetIndex: number
  ) => {
    let movedField: FormFieldSchema | null = null;

    // 先找到并取出该字段
    const nextSections = sections.map((sec) => {
      if (sec.id === sourceSectionId) {
        const fields = [...sec.fields];
        movedField = fields.splice(sourceIndex, 1)[0] || null;
        return { ...sec, fields };
      }
      return sec;
    });

    if (!movedField) return;

    // 插入到目标位置
    const finalSections = nextSections.map((sec) => {
      if (sec.id === targetSectionId) {
        const fields = [...sec.fields];
        const insertIdx = targetIndex >= 0 ? targetIndex : fields.length;
        fields.splice(insertIdx, 0, movedField!);
        return { ...sec, fields };
      }
      return sec;
    });

    setSections(finalSections);
    setSelectedField(movedField);
    toast.success("字段顺序已调整");
  };

  // ─── 10. 从物料库直接拖拽创建新字段 ───
  const handleDropNewField = (item: PaletteItem, targetSectionId: string, targetIndex?: number) => {
    const timestamp = Date.now().toString().slice(-4);
    const newField: FormFieldSchema = {
      name: `${item.type}_${timestamp}`,
      type: item.type,
      label: `${item.label} ${timestamp}`,
      description: item.description,
      colSpan: item.defaultColSpan,
      placeholder: `请输入${item.label}...`,
      validation: { required: false }
    };

    if (item.type === "pill-select" || item.type === "select") {
      newField.options = [
        { label: "选项 A", value: "opt_a" },
        { label: "选项 B", value: "opt_b" }
      ];
      newField.defaultValue = "opt_a";
    } else if (item.type === "number") {
      newField.defaultValue = 100;
      newField.unit = "";
    } else if (item.type === "slider") {
      newField.defaultValue = 50;
      newField.unit = "%";
    }

    const finalSections = sections.map((sec) => {
      if (sec.id === targetSectionId) {
        const fields = [...sec.fields];
        const idx = targetIndex !== undefined && targetIndex >= 0 ? targetIndex : fields.length;
        fields.splice(idx, 0, newField);
        return { ...sec, fields };
      }
      return sec;
    });

    setSections(finalSections);
    setSelectedField(newField);
    toast.success(`已放置控件「${item.label}」`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-border/80 bg-background overflow-hidden shadow-md">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/80 bg-card/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">可视化 Schema 表单设计器</span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                Low-Code Studio
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              拖拽/点击物料自动生成 Schema，支持双向代码导出与真实表单还原
            </p>
          </div>
        </div>

        {/* 右侧模式切换与操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 模式切换 Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/80 font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewMode("design")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "design"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="size-3.5" />
              <span>设计画布</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("preview");
                setPreviewResult(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3.5" />
              <span>实时运行预览</span>
            </button>
          </div>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* 导入 Schema */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalMode("import")}
            className="h-8 text-xs cursor-pointer font-mono shadow-2xs"
            title="导入已有的 JSON Schema 还原表单"
          >
            <Upload className="size-3.5 mr-1 text-primary" />
            导入 Schema
          </Button>

          {/* 导出 Schema */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalMode("export")}
            className="h-8 text-xs cursor-pointer font-mono shadow-2xs"
            title="导出当前表单的 JSON/TS Schema 代码"
          >
            <Code2 className="size-3.5 mr-1 text-emerald-400" />
            导出代码
          </Button>

          {/* 重置为预设 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSections(DEFAULT_DESIGNER_SECTIONS);
              setSelectedSection(DEFAULT_DESIGNER_SECTIONS[0]);
              setSelectedField(null);
              toast.success("已恢复默认模板 Schema");
            }}
            className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
            title="重置为官方预设模板"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 主体区域 */}
      {viewMode === "design" ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左侧：物料库 */}
          <DesignerPalette onAddField={handleAddField} onAddSection={handleAddSection} />

          {/* 中间：画布 */}
          <DesignerCanvas
            sections={sections}
            selectedField={selectedField}
            selectedSection={selectedSection}
            activeSectionId={selectedSection?.id || null}
            onSelectField={(f, s) => {
              setSelectedField(f);
              setSelectedSection(s);
            }}
            onSelectSection={(s) => {
              setSelectedSection(s);
              setSelectedField(null);
            }}
            onMoveField={handleMoveField}
            onDuplicateField={handleDuplicateField}
            onDeleteField={handleDeleteField}
            onDropFieldReorder={handleDropFieldReorder}
            onDropNewField={handleDropNewField}
            onAddSection={handleAddSection}
          />

          {/* 右侧：属性面板 */}
          <DesignerInspector
            selectedField={selectedField}
            selectedSection={selectedSection}
            onUpdateField={handleUpdateField}
            onUpdateSection={handleUpdateSection}
            onDeleteField={handleDeleteField}
            onDeleteSection={handleDeleteSection}
          />
        </div>
      ) : (
        /* ─── 实时预览模式 (Live Preview) ─── */
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Eye className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">真实运行预览中 (Live Form Preview)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    当前表单直接由 <code>&lt;SchemaForm sections=&#123;schema&#125; /&gt;</code> 渲染，所有交互、校验与联动逻辑已完全生效。
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode("design")}
                className="h-8 text-xs cursor-pointer font-mono"
              >
                返回画布编辑
              </Button>
            </div>

            {/* 真实 SchemaForm 渲染 */}
            <SchemaForm
              sections={sections}
              onSubmit={async (values) => {
                setPreviewResult(values);
                toast.success("表单数据校验通过并成功提交！");
              }}
              submitText="提交测试数据"
              resetText="清空表单"
            />

            {/* 提交后输出 JSON */}
            {previewResult && (
              <div className="rounded-2xl border border-emerald-500/30 bg-card p-4 space-y-2 animate-in fade-in zoom-in-95">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="size-4" />
                  <span>表单提交成功 · 输出 JSON 结构数据：</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-muted/60 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                  {JSON.stringify(previewResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 导入与导出模态框 */}
      {modalMode && (
        <SchemaImportExportModal
          open={Boolean(modalMode)}
          onOpenChange={(o) => !o && setModalMode(null)}
          mode={modalMode}
          sections={sections}
          onImport={(importedSections) => {
            setSections(importedSections);
            setSelectedSection(importedSections[0] || null);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
}
