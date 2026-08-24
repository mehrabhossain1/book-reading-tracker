import { cn } from "@/lib/utils";

/**
 * One header for every app screen, so title placement and the action slot are
 * identical across mobile, tablet and desktop.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
