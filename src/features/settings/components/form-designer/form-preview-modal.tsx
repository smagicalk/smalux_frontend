import { useState } from "react";
import {
  Eye,
  CheckCircle2,
  Copy,
  Download,
  Check,
  Code2,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { SchemaForm, type FormSectionSchema } from "@/shared/ui/schema-form";
import { toast } from "@/shared/ui/toaster";
import { Badge } from "@/shared/ui/badge";

export interface FormPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: FormSectionSchema[];
  formMeta: {
    id: string;
    name: string;
    version?: string;
    description?: string;
  };
}

export function FormPreviewModal({ open, onOpenChange, sections, formMeta }: FormPreviewModalProps) {
  // 纯粹的业务表单提交数据（仅字段键值对）
  const [submittedValues, setSubmittedValues] = useState<Record<string, any> | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 表单提交处理：直接提取纯业务数据并弹出 JSON 结果弹窗
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 过滤掉 undefined 的未输入项，只保留有效业务数据
    const cleanValues: Record<string, any> = {};
    Object.keys(data || {}).forEach((key) => {
      if (data[key] !== undefined) {
        cleanValues[key] = data[key];
      }
    });

    setSubmittedValues(cleanValues);
    setIsSubmitting(false);
    setResultModalOpen(true);
    toast.success(`表单「${formMeta.name}」校验通过，已生成提交 JSON！`);
  };

  // 复制纯 JSON 数据到剪贴板
  const handleCopyJson = () => {
    if (!submittedValues) return;
    navigator.clipboard.writeText(JSON.stringify(submittedValues, null, 2));
    setCopied(true);
    toast.success("表单提交数据已复制到剪贴板！");
    setTimeout(() => setCopied(false), 2000);
  };

  // 下载纯 JSON 文件
  const handleDownloadJson = () => {
    if (!submittedValues) return;
    const jsonStr = JSON.stringify(submittedValues, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formMeta.id || "form-data"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已下载表单提交数据 JSON");
  };

  return (
    <>
      {/* ─── 1. 表单填写与实时运行弹窗 ─── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl">
          {/* 弹窗头部 */}
          <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-2xs">
                <Eye className="size-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm font-bold text-foreground truncate">
                    {formMeta.name}
                  </DialogTitle>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0">
                    ID: {formMeta.id}
                  </Badge>
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0">
                    v{formMeta.version || "1.0.0"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground pt-0.5 truncate">
                  {formMeta.description || "直接由 SchemaForm 实时渲染，所有输入、联动与校验规则已完全生效。"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* 弹窗主体可滚动区 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <SchemaForm
              sections={sections}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitText="提交表单并查看 JSON"
              resetText="重置表单数据"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── 2. 提交成功的纯 JSON 结果弹窗 ─── */}
      {submittedValues && (
        <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-emerald-500/30 shadow-2xl animate-in zoom-in-95">
            {/* 头部 */}
            <DialogHeader className="px-6 py-4 border-b border-border/60 bg-emerald-500/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-2xs">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-sm font-bold text-foreground">
                      表单提交成功 (Form Submitted)
                    </DialogTitle>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                      {Object.keys(submittedValues).length} 个字段
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                    提交的纯业务表单数据 JSON 对象（各字段键值对）：
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* JSON 代码展示区 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-1">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4 text-primary" />
                  <span>Submitted Form Data</span>
                </div>
                <span className="text-[11px] text-muted-foreground/70 font-mono">
                  {formMeta.id}
                </span>
              </div>

              <pre className="p-4 rounded-xl border border-border/80 bg-muted/40 text-xs font-mono text-foreground overflow-x-auto max-h-[380px] leading-relaxed select-all">
                {JSON.stringify(submittedValues, null, 2)}
              </pre>
            </div>

            {/* 底部操作工具栏 */}
            <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadJson}
                className="text-xs font-mono cursor-pointer"
              >
                <Download className="size-3.5 mr-1.5" />
                下载 .json 文件
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResultModalOpen(false)}
                  className="text-xs cursor-pointer font-mono"
                >
                  <ArrowLeft className="size-3.5 mr-1.5" />
                  返回表单
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyJson}
                  className="text-xs font-bold px-4 cursor-pointer font-mono"
                >
                  {copied ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Check className="size-3.5" /> 已复制 JSON
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Copy className="size-3.5" /> 复制提交数据
                    </span>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
