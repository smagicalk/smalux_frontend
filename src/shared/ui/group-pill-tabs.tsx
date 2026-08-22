import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface GroupPillItem {
  group: string;
  count?: number;
  hasWarn?: boolean;
}

export interface GroupPillTabsProps {
  groups: GroupPillItem[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  allLabel?: string;
  totalCount?: number;
  className?: string;
}

/**
 * Modern, horizontally scrollable group pill tabs with side fades, micro-chevrons,
 * mouse wheel support, and clean hidden scrollbars.
 * Bounded with `overflow-hidden` so arrows and gradient fades never bleed out of their container.
 */
export function GroupPillTabs({
  groups,
  selectedGroup,
  onGroupChange,
  allLabel = "全部分组",
  totalCount,
  className = ""
}: GroupPillTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, groups]);

  const scrollByAmount = (amount: number) => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const computedTotal = totalCount ?? groups.reduce((acc, g) => acc + (g.count ?? 0), 0);

  return (
    <div className={`relative group/pills overflow-hidden py-0.5 ${className}`}>
      {/* Left Arrow & Gradient Fade */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-2 flex items-center pr-3 bg-gradient-to-r from-card via-card/95 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(-220)}
            aria-label="向左滚动分组"
            className="size-6 rounded-full border border-border/90 bg-background/95 shadow-sm flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        <button
          type="button"
          onClick={() => onGroupChange("all")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
            selectedGroup === "all"
              ? "bg-primary text-primary-foreground font-bold border-transparent shadow-xs"
              : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>{allLabel}</span>
          {computedTotal > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                selectedGroup === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {computedTotal}
            </span>
          )}
        </button>

        {groups.map((g) => {
          const isAct = selectedGroup === g.group;
          return (
            <button
              key={g.group}
              type="button"
              onClick={() => onGroupChange(g.group)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                isAct
                  ? "bg-primary text-primary-foreground font-bold border-transparent shadow-xs"
                  : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {g.hasWarn && (
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
              <span>{g.group}</span>
              {g.count != null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isAct ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {g.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Arrow & Gradient Fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-2 flex items-center pl-3 bg-gradient-to-l from-card via-card/95 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(220)}
            aria-label="向右滚动分组"
            className="size-6 rounded-full border border-border/90 bg-background/95 shadow-sm flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
