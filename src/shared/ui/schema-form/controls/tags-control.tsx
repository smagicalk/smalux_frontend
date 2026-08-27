import { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface TagsControlProps {
  field: FormFieldSchema;
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}

export function TagsControl({ field, value = [], onChange, disabled }: TagsControlProps) {
  const [inputVal, setInputVal] = useState("");
  const tags: string[] = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed || disabled) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (tag: string) => {
    if (disabled) return;
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
      {/* 已选标签列表 */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-7">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground/60 font-mono">
            未添加任何标签
          </span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-primary/10 text-primary border border-primary/20"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={disabled}
                className="hover:text-primary-foreground hover:bg-primary/80 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* 输入与添加栏 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={field.placeholder || "输入标签后按回车添加..."}
          className={cn(
            "flex-1 h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-mono outline-none focus:border-primary text-foreground",
            disabled && "opacity-60 cursor-not-allowed bg-muted/20"
          )}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputVal.trim()}
          className="h-8 px-3 rounded-lg border border-border/80 bg-muted/60 hover:bg-muted text-xs font-mono text-foreground flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
        >
          <Plus className="size-3" />
          添加
        </button>
      </div>
    </div>
  );
}
