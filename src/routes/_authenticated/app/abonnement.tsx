import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, CalendarClock, ShieldCheck } from "lucide-react";
import { PageHeader, Panel, StatCard, Badge } from "@/components/app/kit";
import { useShop } from "@/lib/shop";
import { dateOnly } from "@/lib/format";

export const Route=createFileRoute("/_authenticated/app/abonnement")({head:()=>({meta:[{title:"Abonnement | GESTOCK"},{name:"description",content:"Consultez la période d'essai et le statut de votre accès GESTOCK."}]}),component:SubscriptionPage});
function SubscriptionPage(){
 const {shop,access}=useShop();
 const plan=shop.plan==="trial"?"Essai gratuit":shop.plan==="active"?"Abonnement actif":"Accès suspendu";
 const end=shop.plan==="trial"?shop.trial_ends_at:shop.subscription_ends_at;
 const badge=access.status==="trial"?"Essai en cours":access.status==="active"?"Actif":access.status==="expired"?"Expiré":"Suspendu";
 return <>
 <PageHeader title="Abonnement" description="Consultez votre période d'essai et l'état de votre accès à GESTOCK."/>
 <div className="mb-5 grid gap-3 sm:grid-cols-2"><StatCard label="Formule actuelle" value={plan} icon={CreditCard} tone="brand" hint="Statut de votre espace"/><StatCard label="État de l'accès" value={badge} icon={ShieldCheck} hint={access.writable?"Modifications autorisées":"Espace en lecture seule"}/></div>
 <Panel title="Détails de votre accès">
  <div className="divide-y divide-border">
   <div className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-muted-foreground">Boutique</span><span className="font-medium">{shop.name}</span></div>
   <div className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-muted-foreground">Formule</span><Badge tone={access.status==="active"?"success":access.status==="trial"?"brand":"warning"}>{plan}</Badge></div>
   <div className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-muted-foreground">{shop.plan==="trial"?"Fin de la période d'essai":"Fin de validité"}</span><span className="font-medium">{end?dateOnly(end):"Non définie"}</span></div>
   {access.daysLeft!==null&&<div className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-muted-foreground">Temps restant</span><span className="font-medium">{access.daysLeft} jour(s)</span></div>}
  </div>
 </Panel>
 <Panel className="mt-5"><div className="flex gap-3"><CalendarClock className="size-5 shrink-0 text-muted-foreground"/><div><h2 className="font-semibold">Gestion du paiement</h2><p className="mt-1 text-sm text-muted-foreground">Le paiement et le renouvellement en ligne ne sont pas encore activés dans cette version. Aucun paiement ne peut être effectué depuis cet écran. Si votre période d'essai est terminée, votre espace reste consultable en lecture seule.</p></div></div></Panel>
 </>;
}
