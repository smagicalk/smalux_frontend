/** Loading skeleton shaped like the alert list. */
export function AlertSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-20 shimmer rounded-md border border-border" />
      ))}
    </ul>
  );
}
