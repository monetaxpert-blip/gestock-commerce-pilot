import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Store, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, ErrorState } from "@/components/app/kit";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { toast } from "sonner";

export const Route=createFileRoute("/_authenticated/app/parametres")({head:()=>({meta:[{title:"Paramètres | GESTOCK"},{name:"description",content:"Configurez les informations de votre commerce et vos préférences."}]}),component:SettingsPage});
function SettingsPage(){
 const {shop,access}=useShop();
 const qc=useQueryClient();
 const [name,setName]=useState(shop.name);
 const [phone,setPhone]=useState(shop.phone??"");
 const [address,setAddress]=useState(shop.address??"");
 const [city,setCity]=useState(shop.city??"");
 const [sector,setSector]=useState(shop.sector??"");
 const [footer,setFooter]=useState(shop.receipt_footer??"");
 const [negative,setNegative]=useState(shop.allow_negative_stock);
 const mutation=useMutation({mutationFn:async()=>{
  if(!name.trim())throw new Error("Le nom de la boutique est obligatoire.");
  if(phone.trim()&&(!/^\+?[0-9\s]{8,20}$/.test(phone.trim())||!/[0-9]/.test(phone)))throw new Error("Le téléphone doit contenir uniquement des chiffres, des espaces et éventuellement le préfixe +.");
  const {error}=await supabase.from("shops").update({name:name.trim(),phone:phone.trim()||null,address:address.trim()||null,city:city.trim()||null,sector:sector.trim()||null,receipt_footer:footer.trim()||null,allow_negative_stock:negative}).eq("id",shop.id);
  if(error)throw error;
 },onSuccess:async()=>{await qc.invalidateQueries({queryKey:["shop"]});toast.success("Paramètres enregistrés.");},onError:(e)=>toast.error((e as Error).message||"Enregistrement impossible.")});
 return <>
  <PageHeader title="Paramètres" description="Les informations de votre commerce et les règles de gestion de votre stock."/>
  {!access.writable&&<Panel className="mb-4"><p className="text-sm text-muted-foreground">Votre espace est actuellement en lecture seule. Vous pouvez consulter ces paramètres, mais les modifier nécessite un abonnement actif.</p></Panel>}
  <div className="grid gap-5 xl:grid-cols-2">
   <Panel title="Informations du commerce" description="Ces informations peuvent servir dans vos documents et reçus.">
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
     <div><label className="mb-1.5 block text-sm font-medium">Nom de la boutique *</label><Input value={name} onChange={e=>setName(e.target.value)} required disabled={!access.writable}/></div>
     <div><label className="mb-1.5 block text-sm font-medium">Téléphone</label><Input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+221…" disabled={!access.writable}/></div>
     <div><label className="mb-1.5 block text-sm font-medium">Adresse</label><Input value={address} onChange={e=>setAddress(e.target.value)} disabled={!access.writable}/></div>
     <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium">Ville</label><Input value={city} onChange={e=>setCity(e.target.value)} placeholder="Dakar" disabled={!access.writable}/></div><div><label className="mb-1.5 block text-sm font-medium">Secteur d'activité</label><Input value={sector} onChange={e=>setSector(e.target.value)} disabled={!access.writable}/></div></div>
     <div><label className="mb-1.5 block text-sm font-medium">Message au bas des reçus</label><Input value={footer} onChange={e=>setFooter(e.target.value)} placeholder="Merci pour votre confiance." disabled={!access.writable}/></div>
     <Button type="submit" disabled={!access.writable||mutation.isPending}><Save/> {mutation.isPending?"Enregistrement…":"Enregistrer les informations"}</Button>
     {mutation.error&&<ErrorState error={mutation.error}/>}
    </form>
   </Panel>
   <Panel title="Préférences de stock" description="Choisissez si une vente peut enregistrer une quantité négative.">
    <div className="rounded-xl border border-border p-4">
     <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={negative} onChange={e=>setNegative(e.target.checked)} disabled={!access.writable}/><span><span className="block text-sm font-medium">Autoriser les ventes en stock négatif</span><span className="mt-1 block text-xs text-muted-foreground">Si activé, une vente peut être enregistrée même si la quantité disponible est insuffisante. Cela peut entraîner un stock négatif à régulariser.</span></span></label>
    </div>
    <div className="mt-4 flex gap-3 rounded-xl bg-muted/60 p-4"><ShieldCheck className="size-5 shrink-0 text-muted-foreground"/><p className="text-sm text-muted-foreground">Les données de cette boutique sont isolées dans son espace. Les modifications s'appliquent uniquement à votre commerce.</p></div>
    <Button className="mt-4" onClick={()=>mutation.mutate()} disabled={!access.writable||mutation.isPending}><Save/> Enregistrer les préférences</Button>
   </Panel>
  </div>
 </>;
}
