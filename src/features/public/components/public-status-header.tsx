import { Link } from "@tanstack/react-router";
import { ActivityIcon, ArrowRightIcon } from "lucide-react";

export function PublicStatusHeader() {
  return (
    <header className="border-b border-white/45 bg-background/76 backdrop-blur-xl dark:border-white/8">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <ActivityIcon aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Public Status
            </p>
            <p className="truncate text-lg font-semibold tracking-[-0.03em]">smalux</p>
          </div>
        </div>
        <Link
          to="/admin"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/50 bg-white/60 px-4 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground dark:border-white/8 dark:bg-white/6"
        >
          后台
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
