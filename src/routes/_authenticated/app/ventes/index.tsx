import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShoppingBag, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";\nimport { Button } from "@/components/ui/button";
import { Badge, DataTable, EmptyState, ErrorState, LoadingRows, PageHeader, Panel, StatCard, Td, Th } from "@/components/app/kit";
import { customersQuery } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/rpc";
import { useShop } from "@/lib/shop";
import { money, dateTime } from "@/lib/format";

export const Route=createFileRoute("/_authenticated/app/ventes/")({head:()=>({meta:[{title:"Ventes | GESTOCK"},{name:"description",content:"Historique des ventes enregistrées dans votre boutique."}]}),component:SalesPage});
function SalesPage(){
 const {shop}=useShop();
 const salesQ=useQuery({queryKey:["sales",shop.id],queryFn:async()=>must(await supabase.from("sales").select("*").eq("shop_id",shop.id).order("created_at",{ascending:false}).limit(2000)),staleTime:15000});
 const clientsQ=useQuery(customersQuery(shop.id));
 const [search,setSearch]=useState("");
 const rows=salesQ.data??[];
 const clients=clientsQ.data??[];
 const clientName=(id:string|null)=>id?clients.find(c=>c.id===id)?.name??"Client":"Client de passage";
 const filtered=useMemo(()=>rows.filter(s=>[s.number,clientName(s.customer_id)].some(v=>v.toLowerCase().includes(search.trim().toLowerCase()))),[rows,search,clients]);
 const active=rows.filter(s=>s.status!=="cancelled");
 const total=active.reduce((n,s)=>n+Number(s.total),0),margin=active.reduce((n,s)=>n+Number(s.margin),0);
 return <>
 <PageHeader title="Ventes" description="Historique des ventes et état des règlements. Les ventes annulées restent visibles pour la traçabilité."/>
 <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Ventes enregistrées" value={rows.length} icon={ShoppingBag} hint="Toutes les opérations, annulations incluses"/><StatCard label="Total des ventes actives" value={money(total)} icon={Wallet} tone="brand" hint="Hors ventes annulées"/><StatCard label="Marge brute cumulée" value={money(margin)} icon={Wallet} hint="Marge enregistrée sur ventes actives"/></div>
 <Panel><div className="mb-4 relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Rechercher par numéro ou client" value={search} onChange={e=>setSearch(e.target.value)}/></div>
 {salesQ.error?<ErrorState error={salesQ.error} onRetry={()=>salesQ.refetch()}/>:salesQ.isLoading||clientsQ.isLoading?<LoadingRows/>:rows.length===0?<EmptyState icon={ShoppingBag} title="Aucune vente enregistrée" description="Vos ventes apparaîtront ici après leur enregistrement dans la caisse."/>:filtered.length===0?<p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat trouvé.</p>:
 <DataTable head={<><Th>Vente</Th><Th>Client</Th><Th>Date</Th><Th>État</Th><Th className="text-right">Montant</Th><Th className="text-right">Reste à payer</Th></>}>
 {filtered.map(s=><tr key={s.id}><Td><span className="font-medium">{s.number}</span><span className="block text-xs text-muted-foreground">Marge : {money(s.margin)}</span></Td><Td>{clientName(s.customer_id)}</Td><Td className="text-muted-foreground">{dateTime(s.created_at)}</Td><Td>{s.status==="cancelled"?<Badge tone="danger">Annulée</Badge>:Number(s.amount_due)>0?<Badge tone="warning">À régler</Badge>:<Badge tone="success">Payée</Badge>}</Td><Td className="tnum text-right font-medium">{money(s.total)}</Td><Td className="tnum text-right">{money(s.amount_due)}</Td></tr>)}
 </DataTable>}</Panel></>;
}
