import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { articlesQuery, customersQuery, stockLevel, type ArticleRow, type Customer } from "@/lib/catalog";
import { money, qty } from "@/lib/format";
import { PRICE_TIERS, unitShort } from "@/lib/labels";
import { useShop } from "@/lib/shop";
import { must } from "@/lib/rpc";
import { zodErrors, type FormErrors } from "@/lib/validation";
import { FieldError } from "@/components/app/kit";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizeSenegalPhone(value: string): string {
  const compact = value.replace(/[^\d+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length === 9 && /^[37]/.test(digits)) return `+221${digits}`;
  if (digits.length === 12 && digits.startsWith("221")) return `+${digits}`;
  return compact;
}

export function filterArticles(list: ArticleRow[], term: string) {
  const t = normalize(term.trim());
  if (!t) return list;
  return list.filter((a) => normalize(`${a.product_name} ${a.variant_name} ${a.sku} ${a.barcode ?? ""}`).includes(t));
}

/** Recherche d'article avec liste déroulante. Entrée sur une référence ou un code-barres exact ajoute directement. */
export function ArticleSearch({ onPick, stockedOnly = false, autoFocus = false, placeholder = "Rechercher un produit, une référence..." }: {
  onPick: (a: ArticleRow) => void; stockedOnly?: boolean | undefined; autoFocus?: boolean | undefined; placeholder?: string | undefined;
}) {
  const { shop } = useShop();
  const { data, isLoading, error } = useQuery(articlesQuery(shop.id));
  const [term, setTerm] = useState("");
  const [focus, setFocus] = useState(false);
  const list = useMemo(() => (data ?? []).filter((a) => !a.archived && (!stockedOnly || a.is_stocked)), [data, stockedOnly]);
  const results = useMemo(() => filterArticles(list, term).slice(0, 30), [list, term]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = term.trim().toLowerCase();
    if (!t) return;
    const exact = list.find((a) => a.sku.toLowerCase() === t || (a.barcode ?? "").toLowerCase() === t);
    const pick = exact ?? (results.length === 1 ? results[0] : undefined);
    if (pick) {
      onPick(pick);
      setTerm("");
      setFocus(false);
    } else if (results.length === 0) toast.error("Aucun article ne correspond à cette recherche.");
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        className="h-11 pl-9"
        aria-label="Rechercher un article"
      />
      {focus && (
        <div className="absolute inset-x-0 top-12 z-40 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lift">
          {isLoading && <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Chargement...</p>}
          {error && <p className="p-3 text-sm text-destructive">{(error as Error).message}</p>}
          {!isLoading && !error && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">{list.length === 0 ? "Aucun produit. Créez d'abord vos produits." : "Aucun résultat."}</p>
          )}
          {results.map((a) => {
            const lvl = stockLevel(a);
            return (
              <button
                type="button"
                key={a.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(a);
                  setTerm("");
                  setFocus(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.product_name}{a.variant_name && <span className="text-muted-foreground"> · {a.variant_name}</span>}</span>
                  <span className="block text-xs text-muted-foreground">{a.sku}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block text-sm font-medium">{money(a.price_retail)}</span>
                  {a.is_stocked ? (
                    <span className={cn("tnum block text-xs", lvl === "out" ? "text-destructive" : lvl === "low" ? "text-warning-foreground" : "text-muted-foreground")}>
                      {qty(a.available_qty)} {unitShort(a.base_unit)} dispo
                    </span>
                  ) : (
                    <span className="block text-xs text-muted-foreground">Non stocké</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
}

/** Sélection d'un client avec création rapide. */
export function CustomerPicker({ value, onChange, allowNone = true }: {
  value: Customer | null; onChange: (c: Customer | null) => void; allowNone?: boolean | undefined;
}) {
  const { shop } = useShop();
  const { data } = useQuery(customersQuery(shop.id));
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const active = (data ?? []).filter((c) => !c.archived_at);
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="h-11 w-full justify-between font-normal">
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value ? `${value.name} · ${value.phone}` : allowNone ? "Client de passage" : "Choisir un client"}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Nom ou téléphone..." />
            <CommandList>
              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={() => { setOpen(false); setCreating(true); }}>
                  <UserPlus /> Nouveau client
                </CommandItem>
                {allowNone && (
                  <CommandItem onSelect={() => { onChange(null); setOpen(false); }}>
                    <Check className={cn(value ? "opacity-0" : "opacity-100")} /> Client de passage
                  </CommandItem>
                )}
                {active.map((c) => (
                  <CommandItem key={c.id} value={`${c.name} ${c.phone}`} onSelect={() => { onChange(c); setOpen(false); }}>
                    <Check className={cn(value?.id === c.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <CustomerFormDialog open={creating} onOpenChange={setCreating} onSaved={(c) => onChange(c)} />
    </>
  );
}

const customerSchema = z.object({
  name: z.string().trim().min(1, "Indiquez le nom").max(120),
  phone: z.string().trim().regex(/^\+?[0-9\s]{6,20}$/, "Numéro invalide"),
  email: z.union([z.literal(""), z.string().trim().email("E-mail invalide").max(255)]),
  address: z.string().trim().max(200),
  price_tier: z.enum(["retail", "semi", "wholesale"]),
  note: z.string().trim().max(500),
});
type CustomerForm = z.infer<typeof customerSchema>;

export function CustomerFormDialog({ open, onOpenChange, onSaved, customer }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSaved?: ((c: Customer) => void) | undefined; customer?: Customer | undefined;
}) {
  const { shop } = useShop();
  const qc = useQueryClient();
  const empty: CustomerForm = { name: "", phone: "", email: "", address: "", price_tier: "retail", note: "" };
  const [form, setForm] = useState<CustomerForm>(empty);
  const [errors, setErrors] = useState<FormErrors<keyof CustomerForm>>({});
  const [busy, setBusy] = useState(false);
  const [initFor, setInitFor] = useState<string | null>(null);
  const key = open ? (customer?.id ?? "new") : null;
  if (key !== initFor) {
    setInitFor(key);
    setErrors({});
    setForm(customer ? {
      name: customer.name, phone: customer.phone, email: customer.email ?? "", address: customer.address ?? "",
      price_tier: customer.price_tier as CustomerForm["price_tier"], note: customer.note ?? "",
    } : empty);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = customerSchema.safeParse(form);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    setBusy(true);
    try {
      const normalizedPhone = normalizeSenegalPhone(parsed.data.phone);
      const existingCustomers = must(await supabase.from("customers").select("id,phone").eq("shop_id", shop.id));
      const duplicatePhone = existingCustomers.some((c) => c.id !== customer?.id && normalizeSenegalPhone(c.phone) === normalizedPhone);
      if (duplicatePhone) {
        toast.error("Un client utilise déjà ce numéro de téléphone.");
        return;
      }
      const payload = {
        name: parsed.data.name, phone: normalizedPhone, email: parsed.data.email || null,
        address: parsed.data.address || null, price_tier: parsed.data.price_tier, note: parsed.data.note || null,
      };
      const saved = customer
        ? must(await supabase.from("customers").update(payload).eq("id", customer.id).select().single())
        : must(await supabase.from("customers").insert({ ...payload, shop_id: shop.id }).select().single());
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(customer ? "Client mis à jour." : "Client ajouté.");
      if (saved) onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(/existe déjà/.test(msg) ? "Un client utilise déjà ce numéro de téléphone." : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>Le téléphone identifie le client de façon unique dans votre boutique.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} inputMode="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="77 123 45 67" />
              <FieldError>{errors.phone}</FieldError>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tarif appliqué</Label>
              <Select value={form.price_tier} onValueChange={(v) => setForm({ ...form, price_tier: v as CustomerForm["price_tier"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICE_TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <FieldError>{errors.email}</FieldError>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} {customer ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
