import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, HandCoins, Package, Plus, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, EmptyState, ErrorState, PageHeader, Panel, StatCard } from "@/components/app/kit";
import { RevenueChart } from "@/components/app/charts";
import { useShop } from "@/lib/shop";
import { rpc } from "@/lib/rpc";
import { dateTime, money, qty } from "@/lib/format";
import { unitShort } from "@/lib/labels";

type Dashboard = {
  today: { net: number; margin: number; count: number };
  today_receipts: number;
  month: { net: number; margin: number; count: number };
  stock_value: number;
  retail_value: number;
  product_count: number;
  low_stock: { id: string; product_id: string; product_name: string; variant_name: string; base_unit: string; available_qty: number; low_stock_threshold: number }[];
  low_stock_count: number;
  out_of_stock_count: number;
  receivables: number;
  receivable_customers: number;
  open_orders: number;
  late_orders: number;
  advances: number;
  recent_sales: { id: string; number: string; total: number; amount_due: number; status: string; created_at: string; customer_name: string | null }[];
  series: { day: string; net: number; margin: number }[];
};

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Tableau de bord | GESTOCK" }, { name: "description", content: "Vue d'ensemble de votre activité." }] }),
  component: DashboardPage,
});

function greeting() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Africa/Dakar" }).format(new Date()));
  return h < 18 ? "Bonjour" : "Bonsoir";
}

function DashboardPage() {
  const { shop } = useShop();
  const q = useQuery({ queryKey: ["dashboard", shop.id], queryFn: () => rpc<Dashboard>("get_dashboard", { _shop: shop.id }), refetchInterval: 60_000 });
  const d = q.data;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Dakar" }).format(new Date())}
        title={`${greeting()}, voici votre boutique`}
        description="Les chiffres du jour et ce qui demande votre attention."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/app/produits/nouveau"><Plus /> Produit</Link></Button>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/app/ventes/caisse"><ShoppingCart /> Nouvelle vente</Link></Button>
          </>
        }
      />

      {q.error ? (
        <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>
      ) : !d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[122px] rounded-2xl" />)}</div>
      ) : d.product_count === 0 ? (
        <Panel>
          <EmptyState
            icon={Package}
            title="Commencez par ajouter vos produits"
            description="Créez vos articles avec leur prix et leur stock de départ. Vous pourrez ensuite vendre depuis la caisse."
            action={<Button asChild><Link to="/app/produits/nouveau"><Plus /> Ajouter un produit</Link></Button>}
          />
        </Panel>
      ) : (
        <div className="space-y-6 fade-up">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard tone="dark" label="Ventes du jour" icon={Wallet} value={money(d.today.net)} hint={`${d.today.count} vente${d.today.count > 1 ? "s" : ""}, encaissé ${money(d.today_receipts)}`} />
            <StatCard tone="brand" label="Bénéfice brut du jour" icon={TrendingUp} value={money(d.today.margin)} hint="Prix de vente moins coût d'achat" />
            <StatCard label="Chiffre d'affaires du mois" icon={TrendingUp} value={money(d.month.net)} hint={`Bénéfice brut ${money(d.month.margin)}`} />
            <StatCard label="Valeur du stock" icon={Boxes} value={money(d.stock_value)} hint={`${money(d.retail_value)} au prix de vente`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="Les 14 derniers jours" description="Chiffre d'affaires et bénéfice brut par jour"
              actions={<div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />CA</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Bénéfice</span></div>}>
              <RevenueChart data={d.series} />
            </Panel>
            <div className="grid gap-4">
              <AttentionCard to="/app/clients" icon={HandCoins} label="On vous doit" value={money(d.receivables)} hint={d.receivable_customers ? `${d.receivable_customers} client${d.receivable_customers > 1 ? "s" : ""} avec un reste à payer` : "Aucune créance en cours"} />
              <AttentionCard to="/app/commandes" icon={ClipboardList} label="Commandes en cours" value={String(d.open_orders)}
                hint={d.late_orders ? `${d.late_orders} en retard, ${money(d.advances)} d'acomptes reçus` : `${money(d.advances)} d'acomptes reçus`} alert={d.late_orders > 0} />
              <AttentionCard to="/app/stock" icon={AlertTriangle} label="Alertes de stock" value={String(d.low_stock_count + d.out_of_stock_count)}
                hint={`${d.out_of_stock_count} en rupture, ${d.low_stock_count} sous le seuil`} alert={d.out_of_stock_count > 0} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Dernières ventes" actions={<Link to="/app/ventes" className="text-xs font-medium text-muted-foreground hover:text-foreground">Tout voir</Link>} bodyClassName="px-5 pb-3 pt-3">
              {d.recent_sales.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune vente pour le moment.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {d.recent_sales.map((s) => (
                    <li key={s.id}>
                      <Link to="/app/ventes/$id" params={{ id: s.id }} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{s.number}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.customer_name ?? "Client de passage"} · {dateTime(s.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="tnum text-sm font-semibold">{money(s.total)}</p>
                          {s.status === "cancelled" ? <Badge tone="danger">Annulée</Badge> : s.amount_due > 0 ? <Badge tone="warning">Reste {money(s.amount_due)}</Badge> : <Badge tone="success">Payée</Badge>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="À réapprovisionner" actions={<Link to="/app/stock/approvisionnements/nouveau" className="text-xs font-medium text-muted-foreground hover:text-foreground">Approvisionner</Link>} bodyClassName="px-5 pb-3 pt-3">
              {d.low_stock.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Tout votre stock est au-dessus des seuils d'alerte.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {d.low_stock.map((a) => (
                    <li key={a.id}>
                      <Link to="/app/produits/$id" params={{ id: a.product_id }} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.product_name}{a.variant_name && <span className="text-muted-foreground"> · {a.variant_name}</span>}</p>
                          <p className="text-xs text-muted-foreground">Seuil {qty(a.low_stock_threshold)} {unitShort(a.base_unit)}</p>
                        </div>
                        <Badge tone={a.available_qty <= 0 ? "danger" : "warning"}>{qty(a.available_qty)} {unitShort(a.base_unit)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

function AttentionCard({ to, icon: Icon, label, value, hint, alert }: { to: string; icon: typeof Wallet; label: string; value: string; hint: string; alert?: boolean | undefined }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-lift">
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${alert ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="tnum font-display text-xl font-semibold">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}
