import { PageHeader } from "@/shared/ui/page-header";
import { FormDesignerTab } from "@/features/settings/components/form-designer";

export function FormDesignerPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="可视化表单设计器 (Schema Form Studio)"
        subtitle="基于 JSON Schema 规范的低代码可视化表单设计工作台，支持左侧物料拖拽添加、画布多列排版、右侧实时属性调试、双向 Schema 导入导出与真实运行预览"
      />

      <div className="flex-1 p-6">
        <FormDesignerTab />
      </div>
    </div>
  );
}

export default FormDesignerPage;
