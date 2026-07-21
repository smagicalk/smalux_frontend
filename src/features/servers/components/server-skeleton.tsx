/** Placeholder grid shown while the server list loads. Mirrors the real
 *  ServerRow shape — header, resource trio, sparkline slot, secondary strip —
 *  so the layout doesn't jump when rows resolve. */
export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/** A single shimmering row shaped like a resolved ServerRow. */
function SkeletonRow() {
  return (
    <div className="glass cornered relative flex flex-col gap-2 overflow-hidden rounded-md border border-border p-3 pl-4">
      <span className="absolute inset-y-0 left-0 w-1 bg-muted/60" />
      {/* header: dot + name + badges + region */}
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-muted/60" />
        <span className="h-3.5 w-28 rounded shimmer bg-muted/40" />
        <span className="h-4 w-9 rounded bg-muted/40" />
        <span className="ml-auto h-3 w-12 rounded bg-muted/30" />
      </div>
      {/* resource trio + sparkline slot */}
      <div className="flex items-stretch gap-3">
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex flex-col gap-1">
              <span className="h-2.5 w-8 rounded bg-muted/40" />
              <span className="h-3.5 w-16 rounded bg-muted/40" />
              <span className="h-1.5 w-full rounded-full bg-muted/30" />
            </div>
          ))}
        </div>
        <div className="hidden w-28 shrink-0 flex-col justify-center gap-1 sm:flex">
          <span className="h-2.5 w-16 rounded bg-muted/30" />
          <span className="h-7 w-full rounded bg-muted/30" />
        </div>
      </div>
      {/* secondary stat strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {Array.from({ length: 5 }).map((_, j) => (
          <span key={j} className="h-2.5 w-14 rounded bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
