import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/catalog";
import { must } from "@/lib/rpc";
import { useShop } from "@/lib/shop";

export function CategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { shop, access } = useShop();
  const qc = useQueryClient();
  const q = useQuery(categoriesQuery(shop.id));
  const data = q.data ?? [];
  const isLoading = q.isLoading;
  const [name, setName] = useState("");
  const [parent, setParent] = useState("none");
  const [busy, setBusy] = useState(false);
  const roots = data.filter((c) => !c.parent_id);

  async function add() {
    const n = name.trim();
    if (!n) { toast.error("Indiquez un nom de catégorie."); return; }
    if (n.length > 60) { toast.error("60 caractères maximum."); return; }
    setBusy(true);
    try {
      must(await supabase.from("categories").insert({ shop_id: shop.id, name: n, parent_id: parent === "none" ? null : parent }).select().single());
      setName("");
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie ajoutée.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    try {
      must(await supabase.from("categories").delete().eq("id", id).select());
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie supprimée.");
    } catch {
      toast.error("Cette catégorie contient des produits ou des sous-catégories. Réaffectez-les d'abord.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Catégories</DialogTitle>
          <DialogDescription>Deux niveaux possibles : une catégorie et ses sous-catégories.</DialogDescription>
        </DialogHeader>
        {access.writable && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Robes" onKeyDown={(e) => e.key === "Enter" && add()} />
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Catégorie principale</SelectItem>
                {roots.map((r) => <SelectItem key={r.id} value={r.id}>Dans {r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={add} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} Ajouter</Button>
          </div>
        )}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? <p className="py-4 text-sm text-muted-foreground">Chargement...</p> : roots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune catégorie pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {roots.map((r) => (
                <li key={r.id} className="py-2">
                  <Row name={r.name} onDelete={access.writable ? () => remove(r.id) : undefined} />
                  {data.filter((c) => c.parent_id === r.id).map((c) => (
                    <div key={c.id} className="pl-5"><Row name={c.name} muted onDelete={access.writable ? () => remove(c.id) : undefined} /></div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ name, muted, onDelete }: { name: string; muted?: boolean | undefined; onDelete?: (() => void) | undefined }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={muted ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{name}</span>
      {onDelete && (
        <button onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive" aria-label={`Supprimer ${name}`}>
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

export function categoryName(cats: { id: string; name: string; parent_id: string | null }[], id: string | null): string {
  if (!id) return "";
  const c = cats.find((x) => x.id === id);
  if (!c) return "";
  const p = c.parent_id ? cats.find((x) => x.id === c.parent_id) : null;
  return p ? `${p.name} › ${c.name}` : c.name;
}
