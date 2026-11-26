import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Package, Search, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge, DataTable, EmptyState, ErrorState, LoadingRows, PageHeader, Panel, StatCard, Td, Th } from "@/components/app/kit";
import { articlesQuery, stockLevel, type ArticleRow } from "@/lib/catalog";
import { useShop } from "@/lib/shop";
import { money, qty } from "@/lib/format";
import { unitShort } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/app/stock/")({
  head: () => ({ meta: [{ title: "Stock | GESTOCK" }, { name: "description", content: "Suivez les quantités disponibles et les alertes de stock." }] }),
  component: StockPage,
});
type Filter = "all" | "low" | "out" | "ok";
function StockPage() {
  const { shop } = useShop();
  const query = useQuery(articlesQuery(shop.id));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const articles = (query.data ?? []).filter((a) => !a.archived && a.is_stocked);
  const stats = useMemo(() => ({
    lines: articles.length,
    low: articles.filter((a) => stockLevel(a) === "low").length,
    out: articles.filter((a) => stockLevel(a) === "out").length,
    cost: articles.reduce((sum, a) => sum + a.stock_qty * a.avg_cost, 0),
  }), [articles]);
  const filtered = articles.filter((a) => {
    const state = stockLevel(a);
    const q = search.trim().toLowerCase();
    const matches = !q || a.product_name.toLowerCase().includes(q) || a.variant_name.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q) || (a.barcode ?? "").includes(q);
    return matches && (filter === "all" || state === filter);
  });
  return <>
    <PageHeader title="Stock" description="Quantités disponibles, niveaux d'alerte et valeur estimée au coût d'achat." actions={<><Button variant="outline" asChild><Link to="/app/produits">Voir le catalogue</Link></Button><Button asChild><Link to="/app/stock/approvisionnements/nouveau">Approvisionner</Link></Button></>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Références suivies" value={stats.lines} icon={Package} hint="Articles actifs avec suivi de stock" />
      <StatCard label="Stock faible" value={stats.low} icon={AlertTriangle} tone={stats.low ? "brand" : "default"} hint="Au seuil ou en dessous" />
      <StatCard label="Ruptures" value={stats.out} icon={TrendingDown} hint="Aucune quantité disponible" />
      <StatCard label="Valeur au coût d'achat" value={money(stats.cost)} icon={Boxes} hint="Calculée selon le coût moyen" />
    </div>
    <Panel>
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un article, une référence ou un code-barres" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="flex flex-wrap gap-2">
          {([["all","Tous"],["low","Stock faible"],["out","Rupture"],["ok","Disponible"]] as [Filter,string][]).map(([key,label]) => <Button key={key} size="sm" variant={filter===key?"default":"outline"} onClick={() => setFilter(key)}>{label}{key==="low"&&stats.low>0?" ("+stats.low+")":key==="out"&&stats.out>0?" ("+stats.out+")":""}</Button>)}
        </div>
      </div>
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : query.isLoading ? <LoadingRows /> : articles.length===0 ? <EmptyState icon={Boxes} title="Votre stock est vide" description="Ajoutez des produits avec suivi de stock pour voir leurs quantités ici." action={<Button asChild><Link to="/app/produits">Ajouter des produits</Link></Button>} /> : filtered.length===0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun article ne correspond à cette recherche.</p> :
      <DataTable head={<><Th>Article</Th><Th>Référence</Th><Th className="text-right">En stock</Th><Th className="text-right">Réservé</Th><Th className="text-right">Disponible</Th><Th className="text-right">Seuil</Th><Th className="text-right">État</Th></>}>
        {filtered.map((a: ArticleRow) => <tr key={a.id}>
          <Td><Link to="/app/produits/$id" params={{id:a.product_id}} className="font-medium hover:underline">{a.product_name}<span className="block text-xs text-muted-foreground">{a.variant_name || "Article standard"}</span></Link></Td>
          <Td className="text-muted-foreground">{a.sku || "—"}</Td><Td className="tnum text-right">{qty(a.stock_qty)} {unitShort(a.base_unit)}</Td><Td className="tnum text-right">{qty(a.engaged_qty)} {unitShort(a.base_unit)}</Td><Td className="tnum text-right font-semibold">{qty(a.available_qty)} {unitShort(a.base_unit)}</Td><Td className="tnum text-right">{qty(a.low_stock_threshold)} {unitShort(a.base_unit)}</Td>
          <Td className="text-right">{stockLevel(a)==="out"?<Badge tone="danger">Rupture</Badge>:stockLevel(a)==="low"?<Badge tone="warning">Faible</Badge>:<Badge tone="success">Disponible</Badge>}</Td>
        </tr>)}
      </DataTable>}
    </Panel>
  </>;
}
