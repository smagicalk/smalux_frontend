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
  FolderPlus,
  Plus
} from "lucide-react";
import type { FormFieldType } from "@/shared/ui/schema-form";

export interface PaletteItem {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultColSpan: 12 | 6 | 4;
}

const PALETTE_CATEGORIES: {
  category: string;
  items: PaletteItem[];
}[] = [
  {
    category: "文本与输入",
    items: [
      { type: "text", label: "单行文本", description: "普通字符串输入", icon: Type, defaultColSpan: 6 },
      { type: "password", label: "密码输入", description: "支持一键明文切换", icon: KeyRound, defaultColSpan: 6 },
      { type: "textarea", label: "多行文本", description: "长文本与说明输入", icon: AlignLeft, defaultColSpan: 12 },
      { type: "email", label: "电子邮箱", description: "自动格式校验", icon: Mail, defaultColSpan: 6 },
      { type: "url", label: "网址链接", description: "HTTP(S) 端点地址", icon: Link, defaultColSpan: 6 }
    ]
  },
  {
    category: "数值与度量",
    items: [
      { type: "number", label: "数字步进器", description: "带加减按钮与单位后缀", icon: Hash, defaultColSpan: 6 },
      { type: "slider", label: "范围滑块", description: "百分比与数值连续拖动", icon: SlidersHorizontal, defaultColSpan: 12 }
    ]
  },
  {
    category: "开关与选择",
    items: [
      { type: "switch", label: "开关切换", description: "现代化布尔 Switch", icon: ToggleLeft, defaultColSpan: 12 },
      { type: "pill-select", label: "药丸标签单选", description: "高颜值分段标签选择", icon: Layers, defaultColSpan: 6 },
      { type: "select", label: "下拉单选", description: "标准下拉菜单选择", icon: List, defaultColSpan: 6 },
      { type: "tags", label: "标签多选", description: "回车快速添加多个 Tag", icon: Tag, defaultColSpan: 12 }
    ]
  },
  {
    category: "复杂数据与键值",
    items: [
      { type: "key-value", label: "键值对列表", description: "请求头/环境变量增删改", icon: List, defaultColSpan: 12 }
    ]
  }
];

export interface DesignerPaletteProps {
  onAddField: (item: PaletteItem) => void;
  onAddSection: () => void;
}

export function DesignerPalette({ onAddField, onAddSection }: DesignerPaletteProps) {
  return (
    <div className="w-64 shrink-0 flex flex-col border-r border-border/80 bg-card/40 backdrop-blur-md">
      {/* 顶部标题栏 */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">控件物料库</span>
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
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAddField(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-primary/40 text-left transition-all group cursor-pointer shadow-2xs"
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
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
