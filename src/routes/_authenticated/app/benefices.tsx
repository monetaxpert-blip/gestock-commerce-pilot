import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Wallet, CalendarDays, Percent } from "lucide-react";
import { PageHeader, Panel, StatCard, ErrorState } from "@/components/app/kit";
import { RevenueChart } from "@/components/app/charts";
import { useShop } from "@/lib/shop";
import { rpc } from "@/lib/rpc";
import { money } from "@/lib/format";

type Report = { today:{net:number;margin:number;count:number};month:{net:number;margin:number;count:number};series:{day:string;net:number;margin:number}[] };
export const Route = createFileRoute("/_authenticated/app/benefices")({
 head:()=>({meta:[{title:"Bénéfices | GESTOCK"},{name:"description",content:"Suivez l'évolution de votre chiffre d'affaires et de votre marge brute estimée."}]}),
 component:ProfitPage,
});
function ProfitPage(){
 const {shop}=useShop();
 const q=useQuery({queryKey:["dashboard",shop.id],queryFn:()=>rpc<Report>("get_dashboard",{_shop:shop.id}),refetchInterval:60_000});
 const d=q.data;
 const lastDays=d?.series??[];
 const sumNet=lastDays.reduce((s,x)=>s+x.net,0);
 const sumMargin=lastDays.reduce((s,x)=>s+x.margin,0);
 const ratio=sumNet>0?sumMargin/sumNet*100:0;
 return <>
  <PageHeader title="Bénéfices" description="Une lecture de vos ventes et de votre marge brute estimée. Les chiffres dépendent des opérations enregistrées."/>
  {q.error?<Panel><ErrorState error={q.error} onRetry={()=>q.refetch()}/></Panel>:d&&<>
   <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard label="Marge brute du mois" value={money(d.month.margin)} icon={TrendingUp} tone="brand" hint="Ventes moins coût des articles"/>
    <StatCard label="Chiffre d'affaires du mois" value={money(d.month.net)} icon={Wallet} hint={d.month.count+" vente(s) enregistrée(s)"}/>
    <StatCard label="Marge brute aujourd'hui" value={money(d.today.margin)} icon={CalendarDays} hint={d.today.count+" vente(s) aujourd'hui"}/>
    <StatCard label="Marge sur CA, 14 jours" value={ratio.toLocaleString("fr-FR",{maximumFractionDigits:1})+" %"} icon={Percent} hint="Calcul sur les données du graphique"/>
   </div>
   <Panel title="Évolution sur les 14 derniers jours" description="Chiffre d'affaires et marge brute estimée par jour">
    <RevenueChart data={lastDays}/>
   </Panel>
   <Panel title="Synthèse des 14 derniers jours" description="Somme des valeurs affichées sur la période" className="mt-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <div><p className="text-sm text-muted-foreground">Chiffre d'affaires</p><p className="mt-1 text-xl font-semibold">{money(sumNet)}</p></div>
      <div><p className="text-sm text-muted-foreground">Marge brute estimée</p><p className="mt-1 text-xl font-semibold">{money(sumMargin)}</p></div>
      <div><p className="text-sm text-muted-foreground">Taux de marge brute / CA</p><p className="mt-1 text-xl font-semibold">{ratio.toLocaleString("fr-FR",{maximumFractionDigits:1})} %</p></div>
    </div>
   </Panel>
   <p className="mt-3 text-xs text-muted-foreground">La marge brute n'est pas le bénéfice net : elle ne tient pas compte des charges générales, impôts, frais financiers ni autres dépenses non enregistrées dans le coût des articles.</p>
  </>}
 </>;
}
