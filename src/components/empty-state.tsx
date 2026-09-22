import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * The one dashed "nothing here" panel, used for empty tabs, a missing book, a
 * failed load, an empty history and an empty search. Markup matches the
 * library's original empty state exactly, so it looks the same everywhere.
 *
 *   default — icon tile, title, body and an optional action
 *   compact — a single muted line, for inline slots like the history list
 */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  size = "default",
  className,
}: {
  icon?: IconComponent;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  size?: "default" | "compact";
  className?: string;
}) {
  if (size === "compact") {
    return (
      <p
        className={cn(
          "text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm",
          className,
        )}
      >
        {children}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-card/50 rounded-2xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      {title && <p className={cn("font-medium", Icon && "mt-4")}>{title}</p>}
      {children && (
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty">
          {children}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
