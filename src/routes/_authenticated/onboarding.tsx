import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/brand/Logo";
import { rpc } from "@/lib/rpc";
import { SECTORS } from "@/lib/labels";
import { shopQuery } from "@/lib/shop-query";
import { zodErrors, type FormErrors } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/onboarding")({
  beforeLoad: async ({ context }) => {
    const shop = await context.queryClient.fetchQuery(shopQuery);
    if (shop) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Créer ma boutique | GESTOCK" },
      { name: "description", content: "Configurez votre boutique et démarrez vos 14 jours d'essai gratuit." },
      { property: "og:title", content: "Créer ma boutique | GESTOCK" },
      { property: "og:description", content: "Configurez votre boutique GESTOCK." },
    ],
  }),
  component: Onboarding,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  sector: z.string().min(1, "Choisissez une activité"),
  city: z.string().trim().max(80),
  phone: z.string().trim().max(30).regex(/^(\+?[0-9\s]{8,20})?$/, "Numéro invalide"),
  address: z.string().trim().max(200),
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors<"name" | "sector" | "city" | "phone" | "address">>({});
  const [form, setForm] = useState({ name: "", sector: "", city: "Dakar", phone: "", address: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    setBusy(true);
    try {
      await rpc("create_shop", {
        _name: parsed.data.name,
        _phone: parsed.data.phone,
        _city: parsed.data.city,
        _sector: parsed.data.sector,
        _address: parsed.data.address,
      });
      await qc.invalidateQueries({ queryKey: ["shop"] });
      toast.success("Votre boutique est prête. Votre essai de 14 jours commence aujourd'hui.");
      navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Logo />
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await supabase.auth.signOut();
            qc.clear();
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut /> Se déconnecter
        </Button>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-5 pb-16 pt-4 lg:grid-cols-[1fr_1.1fr] lg:pt-10">
        <section className="fade-up">
          <p className="text-sm font-medium text-success">Étape unique</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">Présentez-nous votre boutique</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Ces informations apparaissent sur vos reçus. Vous pourrez les modifier plus tard dans les paramètres.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "14 jours d'essai complet, sans carte bancaire",
              "Vos données restent privées et séparées des autres boutiques",
              "Après l'essai, vos données restent consultables",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft">
                  <Check className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8" noValidate>
          <div className="space-y-1.5">
            <Label>Nom de la boutique</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Boutique Keur Awa" autoFocus />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Activité principale</Label>
            <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
              <SelectTrigger><SelectValue placeholder="Choisissez votre activité" /></SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sector && <p className="text-xs text-destructive">{errors.sector}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone de la boutique</Label>
              <Input value={form.phone} inputMode="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="33 800 00 00" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Marché Sandaga, allée 4" />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Créer ma boutique
          </Button>
        </form>
      </main>
    </div>
  );
}
