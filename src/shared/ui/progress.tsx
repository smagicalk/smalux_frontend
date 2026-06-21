import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/shared/lib/utils";

type ProgressProps = ProgressPrimitive.ProgressProps & {
  value: number;
};

export function Progress({ className, value, ...props }: ProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <ProgressPrimitive.Root
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      value={normalizedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-full bg-primary transition-transform"
        style={{
          transform: `translateX(-${100 - normalizedValue}%)`
        }}
      />
    </ProgressPrimitive.Root>
  );
}