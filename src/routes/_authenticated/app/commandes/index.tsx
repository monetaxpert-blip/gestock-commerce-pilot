import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge, DataTable, EmptyState, ErrorState, LoadingRows, PageHeader, Panel, StatCard, Td, Th } from "@/components/app/kit";
import { customersQuery } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/rpc";
import { useShop } from "@/lib/shop";
import { money, dateTime, dateOnly } from "@/lib/format";

export const Route=createFileRoute("/_authenticated/app/commandes/")({head:()=>({meta:[{title:"Commandes | GESTOCK"},{name:"description",content:"Suivez les commandes clients et leurs échéances."}]}),component:OrdersPage});
function OrdersPage(){
 const {shop}=useShop();
 const q=useQuery({queryKey:["orders",shop.id],queryFn:async()=>must(await supabase.from("orders").select("*").eq("shop_id",shop.id).order("created_at",{ascending:false}).limit(2000)),staleTime:15000});
 const cq=useQuery(customersQuery(shop.id));
 const [term,setTerm]=useState("");
 const rows=q.data??[],customers=cq.data??[];
 const customer=(id:string)=>customers.find(c=>c.id===id)?.name??"Client";
 const filtered=useMemo(()=>rows.filter(o=>(o.number+" "+customer(o.customer_id)).toLowerCase().includes(term.trim().toLowerCase())),[rows,term,customers]);
 const open=rows.filter(o=>!["delivered","cancelled"].includes(o.status));
 const overdue=open.filter(o=>o.expected_date&&o.expected_date<new Date().toISOString().slice(0,10));
 const deposits=rows.reduce((sum,o)=>sum+Number(o.deposit_total),0);
 const label=(status:string)=>({draft:"Brouillon",confirmed:"Confirmée",prepared:"Prête",delivered:"Livrée",cancelled:"Annulée"} as Record<string,string>)[status]??status;
 const tone=(status:string)=>status==="cancelled"?"danger":status==="delivered"?"success":status==="prepared"?"brand":"warning";
 return <>
 <PageHeader title="Commandes" description="Suivez les commandes clients, les acomptes et les dates prévues."/>
 <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="À traiter" value={open.length} icon={ClipboardList} hint="Commandes non livrées ou annulées"/><StatCard label="En retard" value={overdue.length} icon={ClipboardList} tone={overdue.length?"brand":"default"} hint="Date prévue dépassée"/><StatCard label="Acomptes reçus" value={money(deposits)} icon={ClipboardList} hint="Total sur les commandes listées"/></div>
 <Panel><div className="mb-4 relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Rechercher par numéro ou client" value={term} onChange={e=>setTerm(e.target.value)}/></div>
 {q.error?<ErrorState error={q.error} onRetry={()=>q.refetch()}/>:q.isLoading||cq.isLoading?<LoadingRows/>:rows.length===0?<EmptyState icon={ClipboardList} title="Aucune commande" description="Les commandes de vos clients seront regroupées ici."/>:filtered.length===0?<p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat trouvé.</p>:
 <DataTable head={<><Th>Commande</Th><Th>Client</Th><Th>Créée le</Th><Th>Échéance</Th><Th>État</Th><Th className="text-right">Total</Th><Th className="text-right">Acompte</Th></>}>
 {filtered.map(o=><tr key={o.id}><Td><span className="font-medium">{o.number}</span></Td><Td>{customer(o.customer_id)}</Td><Td className="text-muted-foreground">{dateTime(o.created_at)}</Td><Td>{o.expected_date?dateOnly(o.expected_date):"—"}</Td><Td><Badge tone={tone(o.status)}>{label(o.status)}</Badge></Td><Td className="tnum text-right">{money(o.total)}</Td><Td className="tnum text-right">{money(o.deposit_total)}</Td></tr>)}
 </DataTable>}</Panel></>;
}
