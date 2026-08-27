import { useState, useEffect, useCallback } from "react";
import { Save, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { SchemaFormProps, FormFieldSchema } from "./types";
import { FormSectionCard } from "./form-section-card";
import { FormFieldRenderer } from "./form-field-renderer";

/**
 * 提取所有字段的默认初始值
 */
function extractDefaultValues(sections: SchemaFormProps["sections"]): Record<string, any> {
  const defaults: Record<string, any> = {};
  sections.forEach((sec) => {
    sec.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else if (field.type === "switch") {
        defaults[field.name] = false;
      } else if (field.type === "tags" || field.type === "multi-select") {
        defaults[field.name] = [];
      } else if (field.type === "key-value") {
        defaults[field.name] = [];
      } else {
        defaults[field.name] = undefined;
      }
    });
  });
  return defaults;
}

export function SchemaForm<T extends Record<string, any> = Record<string, any>>({
  sections,
  initialValues,
  onChange,
  onSubmit,
  isLoading = false,
  submitText = "保存配置",
  showResetButton = true,
  resetText = "恢复默认",
  footerExtra,
  className,
  disabled = false,
  compact = false
}: SchemaFormProps<T>) {
  // 表单状态
  const [formData, setFormData] = useState<Record<string, any>>(() => ({
    ...extractDefaultValues(sections),
    ...(initialValues || {})
  }));

  // 错误信息映射表 (field.name -> 错误信息)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 外部 initialValues 变化时同步
  useEffect(() => {
    if (initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [initialValues]);

  // 单字段校验逻辑
  const validateSingleField = useCallback((field: FormFieldSchema, val: any, allValues: Record<string, any>): string | undefined => {
    const rules = field.validation;
    if (!rules) return undefined;

    // 1. 必填校验
    if (rules.required) {
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        return rules.requiredMessage || `${field.label}为必填项`;
      }
    }

    // 2. 字符串/数组长度或数值大小 min 校验
    if (rules.min !== undefined && val !== undefined && val !== null && val !== "") {
      if (typeof val === "number" && val < rules.min) {
        return rules.minMessage || `${field.label}不能小于 ${rules.min}`;
      }
      if (typeof val === "string" && val.length < rules.min) {
        return rules.minMessage || `${field.label}长度不能少于 ${rules.min} 个字符`;
      }
    }

    // 3. 字符串/数组长度或数值大小 max 校验
    if (rules.max !== undefined && val !== undefined && val !== null && val !== "") {
      if (typeof val === "number" && val > rules.max) {
        return rules.maxMessage || `${field.label}不能大于 ${rules.max}`;
      }
      if (typeof val === "string" && val.length > rules.max) {
        return rules.maxMessage || `${field.label}长度不能超过 ${rules.max} 个字符`;
      }
    }

    // 4. 正则表达式校验
    if (rules.pattern && typeof val === "string" && val) {
      if (!rules.pattern.test(val)) {
        return rules.patternMessage || `${field.label}格式不符合要求`;
      }
    }

    // 5. 自定义函数校验
    if (rules.validate) {
      const customRes = rules.validate(val, allValues);
      if (typeof customRes === "string") return customRes;
      if (customRes === false) return `${field.label}校验未通过`;
    }

    return undefined;
  }, []);

  // 变更字段值并实时触发 onChange 回调与校验清理
  const handleFieldChange = (name: string, value: any, fieldSchema: FormFieldSchema) => {
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // 清除或实时重校验当前字段错误
    if (errors[name]) {
      const errorMsg = validateSingleField(fieldSchema, value, updated);
      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) {
          next[name] = errorMsg;
        } else {
          delete next[name];
        }
        return next;
      });
    }

    if (onChange) {
      onChange(updated as T);
    }
  };

  // 全量表单校验
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    sections.forEach((sec) => {
      const secHidden = typeof sec.hidden === "function" ? sec.hidden(formData) : Boolean(sec.hidden);
      if (secHidden) return;

      sec.fields.forEach((field) => {
        const fieldHidden = typeof field.hidden === "function" ? field.hidden(formData) : Boolean(field.hidden);
        if (fieldHidden) return;

        const val = formData[field.name];
        const errorMsg = validateSingleField(field, val, formData);
        if (errorMsg) {
          newErrors[field.name] = errorMsg;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;

    const isValid = validateAll();
    if (!isValid) return;

    if (onSubmit) {
      await onSubmit(formData as T);
    }
  };

  // 重置表单为初始值
  const handleReset = () => {
    if (disabled || isLoading) return;
    const resetVals = {
      ...extractDefaultValues(sections),
      ...(initialValues || {})
    };
    setFormData(resetVals);
    setErrors({});
    if (onChange) {
      onChange(resetVals as T);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* 分块卡片列表渲染 */}
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => {
          const isSecHidden = typeof section.hidden === "function" ? section.hidden(formData) : Boolean(section.hidden);
          if (isSecHidden) return null;

          return (
            <FormSectionCard key={section.id} section={section} compact={compact}>
              {section.fields.map((field) => (
                <FormFieldRenderer
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  formValues={formData}
                  error={errors[field.name]}
                  disabled={disabled}
                  onChange={(val) => handleFieldChange(field.name, val, field)}
                />
              ))}
            </FormSectionCard>
          );
        })}
      </div>

      {/* 底部操作工具栏 */}
      {(onSubmit || showResetButton || footerExtra) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {showResetButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={disabled || isLoading}
                className="h-9 px-3.5 text-xs font-mono cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                {resetText}
              </Button>
            )}
            {footerExtra}
          </div>

          {onSubmit && (
            <Button
              type="submit"
              disabled={disabled || isLoading}
              className="h-9 px-5 text-xs font-bold shadow-md cursor-pointer ml-auto"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  保存中...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Save className="size-3.5" />
                  {submitText}
                </span>
              )}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
