import { useState } from "react";
import {
  Sparkles,
  Eye,
  Download,
  Upload,
  RotateCcw,
  Code2,
  FolderPlus,
  Trash2
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import type { FormSectionSchema, FormFieldSchema, FormSchemaDefinition } from "@/shared/ui/schema-form";
import { DEFAULT_DESIGNER_SECTIONS, DEFAULT_FORM_DEFINITION } from "./default-designer-schema";
import { DesignerPalette, type PaletteItem } from "./designer-palette";
import { DesignerCanvas } from "./designer-canvas";
import { DesignerInspector } from "./designer-inspector";
import { SchemaImportExportModal } from "./schema-import-export-modal";
import { FormPreviewModal } from "./form-preview-modal";

export function FormDesignerTab() {
  // 当前全局表单元数据（必填 id 与 name）
  const [formMeta, setFormMeta] = useState({
    id: DEFAULT_FORM_DEFINITION.id,
    name: DEFAULT_FORM_DEFINITION.name,
    version: DEFAULT_FORM_DEFINITION.version || "1.0.0",
    description: DEFAULT_FORM_DEFINITION.description || ""
  });

  // 当前设计中的表单分块列表
  const [sections, setSections] = useState<FormSectionSchema[]>(() => DEFAULT_DESIGNER_SECTIONS);

  // 选中状态
  const [selectedField, setSelectedField] = useState<FormFieldSchema | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSectionSchema | null>(null);

  // 导入/导出弹窗
  const [modalMode, setModalMode] = useState<"export" | "import" | null>(null);

  // 实时预览弹窗开关
  const [previewOpen, setPreviewOpen] = useState(false);

  // 辅助函数：根据物料生成标准 FormFieldSchema
  const createFieldFromPaletteItem = (item: PaletteItem): FormFieldSchema => {
    const timestamp = Date.now().toString().slice(-4);
    const baseField: FormFieldSchema = {
      name: `${item.type}_${timestamp}`,
      type: item.type,
      label: `${item.label} ${timestamp}`,
      description: item.description,
      colSpan: item.defaultColSpan,
      placeholder: `请输入${item.label}...`,
      validation: { required: false }
    };

    if (item.type === "pill-select" || item.type === "select") {
      baseField.options = [
        { label: "选项 A", value: "opt_a" },
        { label: "选项 B", value: "opt_b" },
        { label: "选项 C", value: "opt_c" }
      ];
      baseField.defaultValue = "opt_a";
      if (item.type === "pill-select") baseField.align = "justify";
    } else if (item.type === "checkbox-group") {
      baseField.options = [
        { label: "自动备份", value: "auto_backup" },
        { label: "高可用容灾", value: "ha_cluster" },
        { label: "告警推送", value: "alert_push" }
      ];
      baseField.defaultValue = ["auto_backup", "alert_push"];
    } else if (item.type === "radio-group") {
      baseField.options = [
        { label: "标准生产模式", value: "standard", description: "推荐普通业务及边缘节点使用" },
        { label: "高性能加速模式", value: "performance", description: "开启内核级并发加速与持久缓存" }
      ];
      baseField.defaultValue = "standard";
    } else if (item.type === "number") {
      baseField.defaultValue = 100;
      baseField.unit = "";
    } else if (item.type === "slider") {
      baseField.defaultValue = 50;
      baseField.unit = "%";
    } else if (item.type === "date") {
      baseField.defaultValue = "2026-08-28";
    } else if (item.type === "time") {
      baseField.defaultValue = "14:30";
    } else if (item.type === "datetime") {
      baseField.defaultValue = "2026-08-28T14:30";
    } else if (item.type === "color") {
      baseField.defaultValue = "#3b82f6";
    } else if (item.type === "rate") {
      baseField.defaultValue = 4;
      baseField.maxRate = 5;
    } else if (item.type === "code") {
      baseField.language = "yaml";
      baseField.rows = 5;
      baseField.defaultValue = "# 集群初始化脚本配置\nnode:\n  id: worker-01\n  region: ap-east-1\n  replicas: 3";
    } else if (item.type === "alert") {
      baseField.alertType = "info";
      baseField.label = "环境安全注意事项";
      baseField.description = "在下发生产环境配置前，请确保网络防火墙与安全组已按规范正确开放。";
    } else if (item.type === "divider") {
      baseField.label = "扩展高级配置";
    } else if (item.type === "key-value") {
      baseField.defaultValue = [
        { key: "X-Trace-Id", value: "trace_alpha_01" },
        { key: "X-Node-Env", value: "production" }
      ];
    } else if (item.type === "tags") {
      baseField.defaultValue = ["production", "v2-core"];
    }

    return baseField;
  };

  // ─── 1. 添加控件到当前分块 ───
  const handleAddField = (item: PaletteItem) => {
    if (sections.length === 0) {
      handleAddSection();
    }

    const targetSection = selectedSection || sections[0];
    const newField = createFieldFromPaletteItem(item);

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

    const nextSections = sections.map((sec) => {
      if (sec.id === sourceSectionId) {
        const fields = [...sec.fields];
        movedField = fields.splice(sourceIndex, 1)[0] || null;
        return { ...sec, fields };
      }
      return sec;
    });

    if (!movedField) return;

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
    const newField = createFieldFromPaletteItem(item);

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

  // 组装完整的 FormSchemaDefinition 对象
  const fullFormDefinition: FormSchemaDefinition = {
    id: formMeta.id || "form_schema",
    name: formMeta.name || "未命名表单",
    version: formMeta.version || "1.0.0",
    description: formMeta.description,
    sections
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-border/80 bg-background overflow-hidden shadow-md">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/80 bg-card/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">可视化 Schema 表单设计器</span>
              <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                ID: {formMeta.id || "未设置"}
              </Badge>
              <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                Low-Code Studio
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              拖拽/点击物料自动生成 Schema，支持带全局 ID 的规范定义导出与运行预览
            </p>
          </div>
        </div>

        {/* 右侧操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 实时预览按钮 */}
          <Button
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="h-8 text-xs font-bold font-mono px-3.5 shadow-sm cursor-pointer"
          >
            <Eye className="size-3.5 mr-1.5" />
            实时运行预览
          </Button>

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* 导入 Schema */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalMode("import")}
            className="h-8 text-xs cursor-pointer font-mono shadow-2xs"
            title="导入包含 id、name 与 sections 的标准 JSON Schema"
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
            title="导出当前表单的完整 FormSchemaDefinition JSON 代码"
          >
            <Code2 className="size-3.5 mr-1 text-emerald-400" />
            导出代码
          </Button>

          {/* 一键清空画布 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (sections.length === 0) {
                toast.info("画布当前已经是清空状态");
                return;
              }
              if (window.confirm("确定要全部清空当前画布中的所有分块与控件吗？")) {
                setSections([]);
                setSelectedField(null);
                setSelectedSection(null);
                toast.success("画布已全部清空，您可以重新设计或添加新分块");
              }
            }}
            className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 font-mono transition-colors"
            title="一键全部删除/清空所有分块与控件"
          >
            <Trash2 className="size-3.5 mr-1 text-rose-400" />
            清空画布
          </Button>

          {/* 重置为预设 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFormMeta({
                id: DEFAULT_FORM_DEFINITION.id,
                name: DEFAULT_FORM_DEFINITION.name,
                version: DEFAULT_FORM_DEFINITION.version || "1.0.0",
                description: DEFAULT_FORM_DEFINITION.description || ""
              });
              setSections(DEFAULT_DESIGNER_SECTIONS);
              setSelectedSection(null);
              setSelectedField(null);
              toast.success("已恢复官方预设模板");
            }}
            className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground font-mono"
            title="重置为官方预设模板"
          >
            <RotateCcw className="size-3.5 mr-1" />
            预设模板
          </Button>
        </div>
      </div>

      {/* 主体三栏工作区 */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* 左侧：物料库 */}
        <DesignerPalette onAddField={handleAddField} onAddSection={handleAddSection} />

        {/* 中间：画布 */}
        <DesignerCanvas
          sections={sections}
          selectedField={selectedField}
          selectedSection={selectedSection}
          formMeta={formMeta}
          activeSectionId={selectedSection?.id || null}
          onSelectField={(f, s) => {
            setSelectedField(f);
            setSelectedSection(s);
          }}
          onSelectSection={(s) => {
            setSelectedSection(s);
            setSelectedField(null);
          }}
          onSelectGlobal={() => {
            setSelectedField(null);
            setSelectedSection(null);
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
          formMeta={formMeta}
          onUpdateFormMeta={setFormMeta}
          onUpdateField={handleUpdateField}
          onUpdateSection={handleUpdateSection}
          onDeleteField={handleDeleteField}
          onDeleteSection={handleDeleteSection}
        />

        {/* 🌟 画布内右下角高颜值悬浮 FAB 预览按钮 */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="absolute bottom-6 right-84 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary/30 backdrop-blur-md select-none group"
          title="点击打开实时表单测试弹窗"
        >
          <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <Eye className="size-4 group-hover:rotate-6 transition-transform" />
          <span>实时运行预览</span>
        </button>
      </div>

      {/* 导入与导出模态框 */}
      {modalMode && (
        <SchemaImportExportModal
          open={Boolean(modalMode)}
          onOpenChange={(o) => !o && setModalMode(null)}
          mode={modalMode}
          formDefinition={fullFormDefinition}
          onImport={(importedDefinition) => {
            setFormMeta({
              id: importedDefinition.id,
              name: importedDefinition.name,
              version: importedDefinition.version || "1.0.0",
              description: importedDefinition.description || ""
            });
            setSections(importedDefinition.sections);
            setSelectedSection(null);
            setSelectedField(null);
          }}
        />
      )}

      {/* 🌟 实时表单运行预览弹窗 */}
      <FormPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sections={sections}
        formMeta={formMeta}
      />
    </div>
  );
}
