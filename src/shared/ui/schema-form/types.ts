import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * 字段控件类型支持
 */
export type FormFieldType =
  | "text"
  | "password"
  | "email"
  | "url"
  | "number"
  | "textarea"
  | "switch"
  | "select"
  | "pill-select"
  | "multi-select"
  | "slider"
  | "key-value"
  | "tags"
  | "custom";

/**
 * 键值对项结构
 */
export interface KeyValuePair {
  id?: string;
  key: string;
  value: string;
  description?: string;
}

/**
 * 下拉/药丸单选项配置
 */
export interface SelectOption<T = string | number | boolean> {
  label: string;
  value: T;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  disabled?: boolean;
}

/**
 * 字段校验规则
 */
export interface FieldValidationRule<T = any, FormData = Record<string, any>> {
  required?: boolean;
  requiredMessage?: string;
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
  validate?: (value: T, formValues: FormData) => string | boolean | undefined | Promise<string | boolean | undefined>;
}

/**
 * 单个表单字段定义 Schema
 */
export interface FormFieldSchema<FormData = Record<string, any>> {
  /** 字段唯一键名（对应表单数据对象中的 key） */
  name: string;
  /** 控件类型 */
  type: FormFieldType;
  /** 字段标题 / Label */
  label: string;
  /** 辅助说明文案（展示在 Label 下方或 Tooltip） */
  description?: string;
  /** 字段专属图标 */
  icon?: LucideIcon;
  /** 输入占位提示符 */
  placeholder?: string;
  /** 默认初始值 */
  defaultValue?: any;
  /** 是否禁用 */
  disabled?: boolean | ((values: FormData) => boolean);
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否隐藏（动态联动） */
  hidden?: boolean | ((values: FormData) => boolean);
  /** 栅格列宽占比（1~12，默认 12 占满单行，6 为并排半宽，4 为三分之一宽） */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  // ─── 控件特有扩展属性 ───
  /** 单位后缀（如 ms, MB, %, 秒） */
  unit?: string;
  /** 步进增量（适用于 number 和 slider） */
  step?: number;
  /** 控件尺寸规格 / 高度模式 (sm: 32px / md: 36px / lg: 44px) */
  size?: "sm" | "md" | "lg";
  /** 自定义高度 (如 '80px', '120px') */
  customHeight?: string;
  /** 多行文本行数（适用于 textarea） */
  rows?: number;
  /** 提示徽章（展示在 Label 右侧） */
  badge?: {
    text: string;
    variant?: "primary" | "success" | "warning" | "danger" | "neutral" | "outline";
  };
  /** 字段校验规则 */
  validation?: FieldValidationRule<any, FormData>;
  /** 自定义渲染插槽（当 type: "custom" 时生效） */
  render?: (props: {
    value: any;
    onChange: (value: any) => void;
    values: FormData;
    error?: string;
    disabled?: boolean;
  }) => ReactNode;
}

/**
 * 表单分块 / 分组卡片 Schema
 */
export interface FormSectionSchema<FormData = Record<string, any>> {
  /** 分块唯一标识 */
  id: string;
  /** 分块标题 */
  title: string;
  /** 分块辅助说明 */
  description?: string;
  /** 分块卡片左上角主图标 */
  icon?: LucideIcon;
  /** 分块右上角状态徽章 */
  badge?: {
    text: string;
    variant?: "primary" | "success" | "warning" | "danger" | "neutral" | "outline";
  };
  /** 是否可折叠收起 */
  collapsible?: boolean;
  /** 默认是否折叠 */
  defaultCollapsed?: boolean;
  /** 分块是否隐藏（根据表单整体数据联动） */
  hidden?: boolean | ((values: FormData) => boolean);
  /** 包含的字段列表 */
  fields: FormFieldSchema<FormData>[];
}

/**
 * SchemaForm 根组件属性定义
 */
export interface SchemaFormProps<FormData extends Record<string, any> = Record<string, any>> {
  /** 表单分块列表 Schema */
  sections: FormSectionSchema<FormData>[];
  /** 初始默认值 */
  initialValues?: Partial<FormData>;
  /** 表单值变更回调（实时受控响应） */
  onChange?: (values: FormData) => void;
  /** 表单提交回调 */
  onSubmit?: (values: FormData) => void | Promise<void>;
  /** 是否处于提交中加载状态 */
  isLoading?: boolean;
  /** 提交按钮文本（默认 "保存配置"） */
  submitText?: string;
  /** 是否展示重置按钮 */
  showResetButton?: boolean;
  /** 重置按钮文本（默认 "恢复默认"） */
  resetText?: string;
  /** 额外的底部操作栏自定义渲染 */
  footerExtra?: ReactNode;
  /** 容器额外样式类名 */
  className?: string;
  /** 是否全局禁用所有控件 */
  disabled?: boolean;
  /** 紧凑模式（更小的间距） */
  compact?: boolean;
}
