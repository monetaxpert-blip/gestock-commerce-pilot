import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tone } from "@/lib/labels";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="truncate text-[1.7rem] font-semibold leading-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: {
  title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card shadow-soft", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default", trend }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: "default" | "brand" | "dark"; trend?: number | null;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition-shadow hover:shadow-lift",
        tone === "dark" && "border-transparent bg-sidebar text-sidebar-foreground",
        tone === "brand" && "border-transparent bg-brand text-brand-foreground",
        tone === "default" && "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-[0.8rem] font-medium", tone === "default" ? "text-muted-foreground" : "opacity-80")}>{label}</p>
        {Icon && <Icon className={cn("size-4", tone === "default" ? "text-muted-foreground" : "opacity-70")} />}
      </div>
      <p className="tnum mt-3 font-display text-[1.6rem] font-semibold leading-none tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend !== undefined && trend !== null && (
          <span
            className={cn(
              "tnum rounded-full px-1.5 py-0.5 font-medium",
              trend >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              tone !== "default" && "bg-background/15 text-current",
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1).replace(".", ",")} %
          </span>
        )}
        {hint && <span className={cn(tone === "default" ? "text-muted-foreground" : "opacity-75")}>{hint}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-foreground">
        <Icon className="size-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-medium">Chargement impossible</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{(error as Error)?.message ?? "Une erreur est survenue."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw /> Réessayer
        </Button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-1" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

const toneClass: Record<Tone, string> = {
  muted: "bg-muted text-muted-foreground",
  info: "bg-chart-4/15 text-foreground",
  brand: "bg-brand-soft text-brand-foreground",
  success: "bg-success/12 text-success",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/18 text-warning-foreground",
};

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.72rem] font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}

/** Conteneur de tableau responsive : défile horizontalement sur mobile. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5">{children}</div>;
}

export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[0.72rem] font-medium uppercase tracking-wider text-muted-foreground">{head}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </TableWrap>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-3 font-medium first:pl-0 last:pr-0", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3.5 align-middle first:pl-0 last:pr-0", className)}>{children}</td>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-xs text-destructive">{children}</p>;
}
