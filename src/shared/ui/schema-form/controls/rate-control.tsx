import { Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface RateControlProps {
  field: FormFieldSchema;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function RateControl({ field, value = 0, onChange, disabled }: RateControlProps) {
  const max = field.maxRate || 5;
  const currentRate = Number(value) || 0;

  return (
    <div className="flex items-center gap-1.5 p-2 rounded-xl border border-border/80 bg-muted/20">
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= currentRate;

        return (
          <button
            key={starIndex}
            type="button"
            onClick={() => !disabled && onChange(starIndex === currentRate ? 0 : starIndex)}
            disabled={disabled}
            className={cn(
              "p-1 rounded-md transition-all cursor-pointer select-none",
              isFilled ? "text-amber-400 hover:scale-110" : "text-muted-foreground/40 hover:text-amber-300/80",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Star className={cn("size-5", isFilled ? "fill-amber-400" : "fill-transparent")} />
          </button>
        );
      })}

      <span className="text-xs font-mono font-bold text-foreground ml-2">
        {currentRate > 0 ? `${currentRate} / ${max} 级` : "未评级"}
      </span>
    </div>
  );
}
