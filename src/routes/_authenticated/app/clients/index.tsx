import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, UserRound, Plus, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerFormDialog } from "@/components/app/pickers";
import { Badge, DataTable, EmptyState, ErrorState, LoadingRows, PageHeader, Panel, Td, Th } from "@/components/app/kit";
import { customersQuery } from "@/lib/catalog";
import { useShop } from "@/lib/shop";
import type { Customer } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/app/clients/")({
  head: () => ({ meta: [{ title: "Clients | GESTOCK" }, { name: "description", content: "Retrouvez vos contacts clients et leurs informations." }] }),
  component: ClientsPage,
});
function ClientsPage() {
  const { shop, access } = useShop();
  const q = useQuery(customersQuery(shop.id));
  const [term, setTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>(undefined);
  const clients = q.data ?? [];
  const filtered = useMemo(() => clients.filter(c => !c.archived_at && [c.name,c.phone,c.email ?? ""].some(v => v.toLowerCase().includes(term.trim().toLowerCase()))), [clients,term]);
  return <>
    <PageHeader title="Clients" description="Retrouvez vos contacts et les informations utiles pour vos échanges." actions={access.writable ? <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}><Plus /> Nouveau client</Button> : undefined} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <Panel className="p-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-soft p-2 text-brand-foreground"><Users className="size-5"/></span><div><p className="text-sm text-muted-foreground">Clients enregistrés</p><p className="text-2xl font-semibold">{clients.filter(c=>!c.archived_at).length}</p></div></div></Panel>
      <Panel className="p-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-muted p-2"><UserRound className="size-5"/></span><div><p className="text-sm text-muted-foreground">Résultats</p><p className="text-2xl font-semibold">{filtered.length}</p></div></div></Panel>
    </div>
    <Panel>
      <div className="mb-4 relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Rechercher par nom, téléphone ou e-mail" value={term} onChange={e=>setTerm(e.target.value)}/></div>
      {q.error ? <ErrorState error={q.error} onRetry={()=>q.refetch()}/> : q.isLoading ? <LoadingRows/> : clients.length===0 ? <EmptyState icon={Users} title="Aucun client enregistré" description="Les clients ajoutés lors de vos ventes apparaîtront ici."/> : filtered.length===0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun client trouvé pour cette recherche.</p> :
      <DataTable head={<><Th>Client</Th><Th>Téléphone</Th><Th>E-mail</Th><Th>Tarif</Th><Th>Contact</Th><Th className="text-right">Actions</Th></>}>
        {filtered.map(c=><tr key={c.id}><Td><span className="font-medium">{c.name}</span>{c.address&&<span className="block text-xs text-muted-foreground">{c.address}</span>}</Td><Td>{c.phone||"—"}</Td><Td>{c.email||"—"}</Td><Td><Badge>{c.price_tier==="wholesale"?"Grossiste":c.price_tier==="semi"?"Semi-gros":"Détail"}</Badge></Td><Td>{c.phone?<a href={"tel:"+c.phone} className="font-medium text-primary hover:underline">Appeler</a>:"—"}</Td><Td className="text-right">{access.writable ? <Button size="sm" variant="outline" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil /> Modifier</Button> : "—"}</Td></tr>)}
      </DataTable>}
    </Panel>
    <CustomerFormDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }} customer={editing} />
  </>;
}
