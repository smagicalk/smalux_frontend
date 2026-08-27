import {
  Type,
  KeyRound,
  AlignLeft,
  Mail,
  Link,
  Hash,
  SlidersHorizontal,
  ToggleLeft,
  Tag,
  List,
  Layers,
  Calendar,
  Clock,
  Palette,
  Star,
  CheckSquare,
  Radio,
  Code2,
  AlertTriangle,
  Minus,
  FolderPlus,
  Plus
} from "lucide-react";
import type { FormFieldType } from "@/shared/ui/schema-form";

export interface PaletteItem {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultColSpan: 12 | 6 | 4 | 3;
}

const PALETTE_CATEGORIES: {
  category: string;
  items: PaletteItem[];
}[] = [
  {
    category: "文本与输入 (Text & Inputs)",
    items: [
      { type: "text", label: "单行文本", description: "普通字符串输入", icon: Type, defaultColSpan: 6 },
      { type: "password", label: "密码私钥", description: "带明密文切换", icon: KeyRound, defaultColSpan: 6 },
      { type: "textarea", label: "多行文本", description: "长文本与说明输入", icon: AlignLeft, defaultColSpan: 12 },
      { type: "email", label: "电子邮箱", description: "邮箱格式校验", icon: Mail, defaultColSpan: 6 },
      { type: "url", label: "网址链接", description: "HTTP(S) 端点地址", icon: Link, defaultColSpan: 6 },
      { type: "number", label: "数字步进器", description: "带单位与加减按钮", icon: Hash, defaultColSpan: 6 }
    ]
  },
  {
    category: "开关与选择 (Selection)",
    items: [
      { type: "switch", label: "状态开关", description: "现代化布尔 Switch", icon: ToggleLeft, defaultColSpan: 12 },
      { type: "pill-select", label: "药丸标签", description: "高颜值分段标签单选", icon: Layers, defaultColSpan: 6 },
      { type: "select", label: "下拉菜单", description: "标准下拉菜单选择", icon: List, defaultColSpan: 6 },
      { type: "checkbox-group", label: "复选框组", description: "网格多项勾选", icon: CheckSquare, defaultColSpan: 12 },
      { type: "radio-group", label: "卡片单选", description: "卡片式图文单选", icon: Radio, defaultColSpan: 12 },
      { type: "tags", label: "标签多选", description: "回车快速添加 Tag", icon: Tag, defaultColSpan: 12 }
    ]
  },
  {
    category: "时间与日期 (Date & Time)",
    items: [
      { type: "date", label: "日期选择", description: "年月日快速挑选", icon: Calendar, defaultColSpan: 6 },
      { type: "time", label: "时间选择", description: "时分秒精准设定", icon: Clock, defaultColSpan: 6 },
      { type: "datetime", label: "日期时间", description: "完整时间戳输入", icon: Calendar, defaultColSpan: 12 }
    ]
  },
  {
    category: "度量与视觉 (Metrics & Colors)",
    items: [
      { type: "slider", label: "范围滑块", description: "百分比与数值连续拖动", icon: SlidersHorizontal, defaultColSpan: 12 },
      { type: "rate", label: "星级评分", description: "优先级与评星等级", icon: Star, defaultColSpan: 6 },
      { type: "color", label: "颜色拾取", description: "色板与 HEX 色彩选择", icon: Palette, defaultColSpan: 6 }
    ]
  },
  {
    category: "结构化与排版 (Structures & Layout)",
    items: [
      { type: "key-value", label: "键值对列表", description: "请求头/环境变量增删", icon: List, defaultColSpan: 12 },
      { type: "code", label: "代码脚本", description: "YAML/JSON/Shell 脚本", icon: Code2, defaultColSpan: 12 },
      { type: "alert", label: "提示警告条", description: "静态说明与警示指引", icon: AlertTriangle, defaultColSpan: 12 },
      { type: "divider", label: "分割线", description: "分界线与分段标题", icon: Minus, defaultColSpan: 12 }
    ]
  }
];

export interface DesignerPaletteProps {
  onAddField: (item: PaletteItem) => void;
  onAddSection: () => void;
}

export function DesignerPalette({ onAddField, onAddSection }: DesignerPaletteProps) {
  return (
    <div className="w-68 shrink-0 flex flex-col border-r border-border/80 bg-card/40 backdrop-blur-md">
      {/* 顶部标题栏 */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">控件物料库 (18+)</span>
        </div>
        <button
          type="button"
          onClick={onAddSection}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-mono font-medium transition-colors cursor-pointer"
          title="新建分块卡片"
        >
          <FolderPlus className="size-3" />
          <span>+ 分块</span>
        </button>
      </div>

      {/* 物料列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 font-mono">
              {cat.category}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({ source: "palette", item }));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onAddField(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-primary/40 text-left transition-all group cursor-grab active:cursor-grabbing shadow-2xs select-none"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-background border border-border/80 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                    <Plus className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
