import { useRef } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

interface ScrollableBadgeInputStripProps {
  dropdownButtonLabel: string;
  dropdownTitle: string;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  allKnownItems: string[];
  selectedItems: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  inputValue: string;
  onInputChange: (val: string) => void;
  placeholder: string;
  itemPrefix?: string;
  theme?: "primary" | "teal";
  emptyDropdownText?: string;
  icon: React.ReactNode;
}

export function ScrollableBadgeInputStrip({
  dropdownButtonLabel,
  dropdownTitle,
  isDropdownOpen,
  onToggleDropdown,
  dropdownRef,
  allKnownItems,
  selectedItems,
  onAddItem,
  onRemoveItem,
  inputValue,
  onInputChange,
  placeholder,
  itemPrefix = "",
  theme = "primary",
  emptyDropdownText = "已添加所有项目",
  icon
}: ScrollableBadgeInputStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Scroll active element into view ensuring cursor / focus is NEVER obscured
  const scrollItemIntoView = (el: HTMLElement | null) => {
    if (!el || !scrollRef.current) return;
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        onAddItem(inputValue);
        setTimeout(() => {
          if (inputRef.current) {
            scrollItemIntoView(inputRef.current);
          }
        }, 40);
      }
    } else if (e.key === "ArrowLeft") {
      // If cursor is at start of input, focus the previous badge
      if (e.currentTarget.selectionStart === 0 && selectedItems.length > 0) {
        e.preventDefault();
        const lastIdx = selectedItems.length - 1;
        const lastBadge = badgeRefs.current[lastIdx];
        if (lastBadge) {
          lastBadge.focus();
          scrollItemIntoView(lastBadge);
        }
      }
    } else if (e.key === "Backspace" && inputValue === "" && selectedItems.length > 0) {
      // Backspace on empty input removes the last item and keeps focus in view
      e.preventDefault();
      const lastItem = selectedItems[selectedItems.length - 1];
      onRemoveItem(lastItem);
    }
  };

  const handleBadgeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        const prevBadge = badgeRefs.current[index - 1];
        if (prevBadge) {
          prevBadge.focus();
          scrollItemIntoView(prevBadge);
        }
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < selectedItems.length - 1) {
        const nextBadge = badgeRefs.current[index + 1];
        if (nextBadge) {
          nextBadge.focus();
          scrollItemIntoView(nextBadge);
        }
      } else {
        // Return focus to input
        if (inputRef.current) {
          inputRef.current.focus();
          scrollItemIntoView(inputRef.current);
        }
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const itemToRemove = selectedItems[index];
      onRemoveItem(itemToRemove);
      setTimeout(() => {
        if (index > 0) {
          badgeRefs.current[index - 1]?.focus();
        } else if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 20);
    }
  };

  const isTeal = theme === "teal";

  return (
    <div className="flex items-center gap-1.5 h-10 p-1.5 rounded-lg border border-border/80 bg-muted/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all relative select-none">
      {/* Pinned Left Dropdown */}
      <div className="shrink-0 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={onToggleDropdown}
          className={`h-7 px-2.5 rounded-md text-xs border flex items-center gap-1.5 font-medium transition-all shadow-2xs cursor-pointer select-none ${
            isDropdownOpen
              ? isTeal
                ? "bg-teal-500/15 text-teal-400 border-teal-500/50 ring-1 ring-teal-500/20"
                : "bg-primary/15 text-primary border-primary/50 ring-1 ring-primary/20"
              : isTeal
              ? "bg-muted/80 hover:bg-muted text-foreground border-border/80 hover:border-teal-500/40"
              : "bg-muted/80 hover:bg-muted text-foreground border-border/80 hover:border-primary/40"
          }`}
        >
          {icon}
          <span>{dropdownButtonLabel}</span>
          <ChevronDown
            className={`size-3 text-muted-foreground transition-transform duration-200 ${
              isDropdownOpen ? (isTeal ? "rotate-180 text-teal-400" : "rotate-180 text-primary") : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-52 max-h-60 overflow-y-auto rounded-xl border border-border/90 bg-popover/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between border-b border-border/40 mb-1">
              <span>{dropdownTitle}</span>
              <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded-full">{allKnownItems.length}</span>
            </div>
            {allKnownItems.filter((i) => !selectedItems.includes(i)).length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyDropdownText}</div>
            ) : (
              allKnownItems
                .filter((i) => !selectedItems.includes(i))
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onAddItem(item);
                      setTimeout(() => {
                        if (inputRef.current) {
                          scrollItemIntoView(inputRef.current);
                        }
                      }, 40);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                      isTeal
                        ? "font-mono text-foreground hover:bg-teal-500/15 hover:text-teal-300"
                        : "text-foreground hover:bg-primary/15 hover:text-primary font-medium"
                    }`}
                  >
                    <span>
                      {itemPrefix}
                      {item}
                    </span>
                    <Plus
                      className={`size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ${
                        isTeal ? "group-hover:text-teal-400" : "group-hover:text-primary"
                      }`}
                    />
                  </button>
                ))
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border/60 shrink-0" />

      {/* Scrollable Container with NO visible ugly scrollbar and Cursor Tracking */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 min-w-0 flex-nowrap no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {selectedItems.map((item, idx) => (
          <div
            key={item}
            ref={(el) => {
              badgeRefs.current[idx] = el;
            }}
            tabIndex={0}
            onFocus={(e) => scrollItemIntoView(e.currentTarget)}
            onKeyDown={(e) => handleBadgeKeyDown(e, idx)}
            className="outline-none focus:ring-1 focus:ring-primary rounded-md shrink-0 transition-all cursor-default"
          >
            <Badge
              variant="neutral"
              className={`gap-1 pl-2 pr-1 py-0.5 text-xs font-normal rounded-md whitespace-nowrap ${
                isTeal
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/25 font-mono"
                  : "bg-primary/10 text-primary border-primary/25"
              }`}
            >
              <span>
                {itemPrefix}
                {item}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item);
                }}
                className={`size-3.5 rounded-full flex items-center justify-center cursor-pointer ${
                  isTeal
                    ? "hover:bg-teal-500/20 text-teal-400/70 hover:text-teal-300"
                    : "hover:bg-primary/20 text-primary/70 hover:text-primary"
                }`}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          </div>
        ))}

        <input
          ref={inputRef}
          value={inputValue}
          onFocus={(e) => scrollItemIntoView(e.currentTarget)}
          onClick={(e) => scrollItemIntoView(e.currentTarget)}
          onChange={(e) => {
            onInputChange(e.target.value);
            scrollItemIntoView(inputRef.current);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={`flex-1 min-w-[120px] bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground px-1 h-6 shrink-0 ${
            isTeal ? "font-mono" : ""
          }`}
        />
      </div>
    </div>
  );
}


