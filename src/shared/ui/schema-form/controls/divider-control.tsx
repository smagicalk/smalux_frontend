import type { FormFieldSchema } from "../types";

export interface DividerControlProps {
  field: FormFieldSchema;
}

export function DividerControl({ field }: DividerControlProps) {
  if (!field.label) {
    return <div className="w-full h-px bg-border/80 my-2" />;
  }

  return (
    <div className="relative flex items-center py-2">
      <div className="flex-grow border-t border-border/80" />
      <span className="flex-shrink mx-3 text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
        {field.label}
      </span>
      <div className="flex-grow border-t border-border/80" />
    </div>
  );
}
