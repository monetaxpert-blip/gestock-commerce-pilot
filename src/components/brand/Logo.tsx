import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path d="M9 11.5h14v3H9z" className="fill-brand-foreground" opacity="0.35" />
      <path d="M9 16.5h14v3H9z" className="fill-brand-foreground" opacity="0.65" />
      <path d="M9 21.5h9v3H9z" className="fill-brand-foreground" />
      <circle cx="22" cy="23" r="2" className="fill-brand-foreground" />
    </svg>
  );
}

export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-[1.15rem] font-semibold tracking-tight",
          tone === "light" ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        GESTOCK
      </span>
    </span>
  );
}
