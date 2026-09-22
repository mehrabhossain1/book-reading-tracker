type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** A single figure with its label — the tile used on Stats and in Admin. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  /** Secondary line under the label, e.g. "+3 this week". */
  hint?: string;
  icon: IconComponent;
}) {
  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
      {hint && <p className="text-muted-foreground/70 mt-1 text-[0.6875rem]">{hint}</p>}
    </div>
  );
}
