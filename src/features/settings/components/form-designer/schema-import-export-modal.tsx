import { useState } from "react";
import { Code2, Copy, Download, Upload, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import type { FormSectionSchema } from "@/shared/ui/schema-form";

export interface SchemaImportExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "export" | "import";
  sections: FormSectionSchema[];
  onImport: (sections: FormSectionSchema[]) => void;
}

export function SchemaImportExportModal({
  open,
  onOpenChange,
  mode,
  sections,
  onImport
}: SchemaImportExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [parseError, setParseError] = useState("");

  const jsonCode = JSON.stringify(sections, null, 2);

  // 复制 Schema 到剪贴板
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonCode);
    setCopied(true);
    toast.success("Schema JSON 代码已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  // 下载 Schema 为 json 文件
  const handleDownload = () => {
    const blob = new Blob([jsonCode], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smalux-form-schema-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已下载 Schema 配置文件");
  };

  // 执行导入并解析
  const handlePerformImport = () => {
    setParseError("");
    if (!importCode.trim()) {
      setParseError("请输入或粘贴要导入的 Schema JSON 代码");
      return;
    }

    try {
      const parsed = JSON.parse(importCode);
      if (!Array.isArray(parsed)) {
        setParseError("导入的 Schema 必须为数组结构 (FormSectionSchema[])");
        return;
      }
      onImport(parsed);
      toast.success("Schema 成功解析，表单已全量还原！");
      onOpenChange(false);
    } catch (err: any) {
      setParseError(`JSON 语法解析失败: ${err?.message || "请检查格式"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              {mode === "export" ? <Code2 className="size-4" /> : <Upload className="size-4" />}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {mode === "export" ? "导出表单 Schema 代码" : "导入 Schema 还原表单"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                {mode === "export"
                  ? "当前可视画布中设计的表单结构已转换为标准 JSON Schema 规范，可直接复制或下载使用。"
                  : "粘贴任意合法的 FormSectionSchema 规范 JSON 代码，一键将表单结构完整还原至画布中。"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {mode === "export" ? (
            <div className="relative">
              <pre className="p-4 rounded-xl border border-border/80 bg-muted/40 text-xs font-mono text-foreground overflow-x-auto max-h-[380px] leading-relaxed select-all">
                {jsonCode}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={12}
                value={importCode}
                onChange={(e) => {
                  setImportCode(e.target.value);
                  setParseError("");
                }}
                placeholder="在此粘贴 [ { id: 'sec-1', title: '...', fields: [ ... ] } ] 格式的 JSON Schema 代码..."
                className="w-full rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
              />
              {parseError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-mono">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-border/60">
          {mode === "export" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
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
                  onClick={() => onOpenChange(false)}
                  className="text-xs cursor-pointer"
                >
                  关闭
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs font-bold px-4 cursor-pointer"
                >
                  {copied ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Check className="size-3.5" /> 已复制
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Copy className="size-3.5" /> 复制代码
                    </span>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs cursor-pointer"
              >
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePerformImport}
                className="text-xs font-bold px-5 cursor-pointer"
              >
                <Upload className="size-3.5 mr-1.5" />
                解析并还原表单
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
