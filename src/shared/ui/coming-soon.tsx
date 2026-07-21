import { PageHeader } from "./page-header";

/** Placeholder for routes whose pages are not implemented yet. Keeps the
 *  nav structure complete so the sidebar is navigable end-to-end. */
export function ComingSoon({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} />
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="text-sm font-medium">{title} 即将实现</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
