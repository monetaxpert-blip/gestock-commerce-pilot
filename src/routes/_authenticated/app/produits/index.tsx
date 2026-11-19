import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FolderTree, Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, DataTable, EmptyState, ErrorState, LoadingRows, PageHeader, Panel, Td, Th } from "@/components/app/kit";
import { CategoriesDialog, categoryName } from "@/components/app/CategoriesDialog";
import { articlesQuery, categoriesQuery, stockLevel, type ArticleRow } from "@/lib/catalog";
import { useShop } from "@/lib/shop";
import { money, qty } from "@/lib/format";
import { unitShort } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/app/produits/")({
  head: () => ({ meta: [{ title: "Produits | GESTOCK" }, { name: "description", content: "Catalogue de vos produits." }] }),
  component: ProductsPage,
});

type ProductGroup = { id: string; name: string; category_id: string | null; base_unit: string; is_stocked: boolean; archived: boolean; articles: ArticleRow[] };

function ProductsPage() {
  const { shop, access } = useShop();
  const arts = useQuery(articlesQuery(shop.id));
  const cats = useQuery(categoriesQuery(shop.id));
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<"active" | "archived">("active");
  const [catOpen, setCatOpen] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const a of arts.data ?? []) {
      let g = map.get(a.product_id);
      if (!g) {
        g = { id: a.product_id, name: a.product_name, category_id: a.category_id, base_unit: a.base_unit, is_stocked: a.is_stocked, archived: true, articles: [] };
        map.set(a.product_id, g);
      }
      g.articles.push(a);
      if (!a.archived) g.archived = false;
    }
    const t = term.trim().toLowerCase();
    const allCats = cats.data ?? [];
    return [...map.values()].filter((g) => {
      if (view === "active" ? g.archived : !g.archived) return false;
      if (cat !== "all") {
        const c = allCats.find((x) => x.id === g.category_id);
        if (g.category_id !== cat && c?.parent_id !== cat) return false;
      }
      if (!t) return true;
      return g.name.toLowerCase().includes(t) || g.articles.some((a) => a.sku.toLowerCase().includes(t) || a.variant_name.toLowerCase().includes(t) || (a.barcode ?? "").includes(t));
    });
  }, [arts.data, cats.data, term, cat, view]);

  const total = new Set((arts.data ?? []).map((a) => a.product_id)).size;

  return (
    <>
      <PageHeader
        title="Produits"
        description="Votre catalogue, avec les prix et le stock de chaque déclinaison."
        actions={
          <>
            <Button variant="outline" onClick={() => setCatOpen(true)}><FolderTree /> Catégories</Button>
            {access.writable && <Button asChild><Link to="/app/produits/nouveau"><Plus /> Nouveau produit</Link></Button>}
          </>
        }
      />
      <Panel>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nom, référence, code-barres..." className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{categoryName(cats.data ?? [], c.id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={(v) => setView(v as "active" | "archived")}>
            <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {arts.error ? <ErrorState error={arts.error} onRetry={() => arts.refetch()} /> : arts.isLoading ? <LoadingRows /> : total === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" description="Ajoutez votre premier produit pour commencer à vendre et suivre votre stock."
            action={access.writable ? <Button asChild><Link to="/app/produits/nouveau"><Plus /> Ajouter un produit</Link></Button> : undefined} />
        ) : groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun produit ne correspond à ces filtres.</p>
        ) : (
          <DataTable head={<><Th>Produit</Th><Th>Catégorie</Th><Th className="text-right">Prix de détail</Th><Th className="text-right">Disponible</Th><Th className="text-right">État</Th></>}>
            {groups.map((g) => {
              const prices = g.articles.map((a) => a.price_retail);
              const min = Math.min(...prices), max = Math.max(...prices);
              const avail = g.articles.reduce((s, a) => s + a.available_qty, 0);
              const levels = g.articles.map(stockLevel);
              const worst = levels.includes("out") ? "out" : levels.includes("low") ? "low" : levels[0];
              return (
                <tr key={g.id} className="group">
                  <Td>
                    <Link to="/app/produits/$id" params={{ id: g.id }} className="block">
                      <span className="font-medium group-hover:underline">{g.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {g.articles.length > 1 ? `${g.articles.length} déclinaisons` : g.articles[0]?.sku}
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted-foreground">{categoryName(cats.data ?? [], g.category_id) || "Sans catégorie"}</Td>
                  <Td className="tnum text-right">{min === max ? money(min) : `${money(min)} à ${money(max)}`}</Td>
                  <Td className="tnum text-right">{g.is_stocked ? `${qty(avail)} ${unitShort(g.base_unit)}` : "Non stocké"}</Td>
                  <Td className="text-right">
                    {g.archived ? <Badge>Archivé</Badge> : worst === "out" ? <Badge tone="danger">Rupture</Badge> : worst === "low" ? <Badge tone="warning">Stock faible</Badge> : worst === "none" ? <Badge>Service</Badge> : <Badge tone="success">En stock</Badge>}
                  </Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
      <CategoriesDialog open={catOpen} onOpenChange={setCatOpen} />
    </>
  );
}
