import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BarChart3, Boxes, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Store, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { dateOnly } from "@/lib/format";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

const MAIN: NavItem[] = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/app/ventes/caisse", label: "Caisse", icon: ShoppingCart },
  { to: "/app/ventes", label: "Ventes", icon: Wallet },
  { to: "/app/produits", label: "Produits", icon: Package },
  { to: "/app/stock", label: "Stock", icon: Boxes },
  { to: "/app/commandes", label: "Commandes", icon: ClipboardList },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/benefices", label: "Bénéfices", icon: BarChart3 },
];
const ACCOUNT: NavItem[] = [
  { to: "/app/abonnement", label: "Abonnement", icon: CreditCard },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];
const MOBILE_BAR: NavItem[] = [MAIN[0]!, MAIN[2]!, MAIN[1]!, MAIN[3]!, MAIN[4]!];

function isActive(path: string, item: NavItem) {
  if (item.exact) return path === item.to || path === `${item.to}/`;
  if (item.to === "/app/ventes") return path.startsWith("/app/ventes") && !path.startsWith("/app/ventes/caisse");
  return path === item.to || path.startsWith(`${item.to}/`);
}

function NavLinks({ items, path, onNavigate }: { items: NavItem[]; path: string; onNavigate?: (() => void) | undefined }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(path, item);
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("size-[17px] transition-colors", active ? "text-sidebar-primary" : "opacity-80 group-hover:opacity-100")} />
              {item.label}
              {item.to === "/app/ventes/caisse" && (
                <span className="ml-auto rounded-md bg-sidebar-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-sidebar-primary-foreground">POS</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarBody({ path, onNavigate }: { path: string; onNavigate?: (() => void) | undefined }) {
  const { shop, access } = useShop();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Link to="/app" onClick={onNavigate}>
          <Logo tone="light" />
        </Link>
      </div>
      <div className="mx-3 mb-5 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
          <Store className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{shop.name}</p>
          <p className="truncate text-[0.72rem] text-sidebar-muted">
            {access.status === "trial" && `Essai, ${access.daysLeft} jour${access.daysLeft === 1 ? "" : "s"} restant${access.daysLeft === 1 ? "" : "s"}`}
            {access.status === "active" && (shop.subscription_ends_at ? `Abonné jusqu'au ${dateOnly(shop.subscription_ends_at)}` : "Abonnement actif")}
            {access.status === "expired" && "Lecture seule"}
            {access.status === "suspended" && "Compte suspendu"}
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Navigation principale">
        <NavLinks items={MAIN} path={path} onNavigate={onNavigate} />
        <p className="mb-2 mt-6 px-3 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-sidebar-muted/80">Compte</p>
        <NavLinks items={ACCOUNT} path={path} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.88rem] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-[17px]" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { access } = useShop();

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <SidebarBody path={path} />
      </aside>

      <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 hover:bg-accent" aria-label="Ouvrir le menu">
          <Menu className="size-5" />
        </button>
        <Link to="/app"><Logo /></Link>
        <Link to="/app/ventes/caisse" className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">
          Vendre
        </Link>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody path={path} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {!access.writable && (
        <div className="no-print border-b border-warning/40 bg-warning/15 px-4 py-2.5 text-center text-sm text-warning-foreground">
          Votre espace est en lecture seule. Vos données sont conservées.{" "}
          <Link to="/app/abonnement" className="font-semibold underline underline-offset-2">Activer l'abonnement</Link>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigation rapide">
        <ul className="grid grid-cols-5">
          {MOBILE_BAR.map((item) => {
            const active = isActive(path, item);
            const Icon = item.icon;
            const pos = item.to === "/app/ventes/caisse";
            return (
              <li key={item.to}>
                <Link to={item.to} className="flex flex-col items-center gap-1 py-2 text-[0.68rem] font-medium">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl transition-colors",
                      pos ? "size-10 -mt-4 bg-brand text-brand-foreground shadow-lift" : "size-7",
                      !pos && (active ? "text-foreground" : "text-muted-foreground"),
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>{item.label === "Tableau de bord" ? "Accueil" : item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
