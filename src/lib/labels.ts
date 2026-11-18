export const UNITS = [
  { value: "piece", label: "Pièce", short: "pce" },
  { value: "paire", label: "Paire", short: "paire" },
  { value: "kg", label: "Kilogramme", short: "kg" },
  { value: "g", label: "Gramme", short: "g" },
  { value: "litre", label: "Litre", short: "L" },
  { value: "ml", label: "Millilitre", short: "ml" },
  { value: "metre", label: "Mètre", short: "m" },
  { value: "paquet", label: "Paquet", short: "paquet" },
  { value: "sachet", label: "Sachet", short: "sachet" },
  { value: "boite", label: "Boîte", short: "boîte" },
  { value: "bouteille", label: "Bouteille", short: "btl" },
  { value: "carton", label: "Carton", short: "carton" },
  { value: "sac", label: "Sac", short: "sac" },
] as const;

export const DECIMAL_UNITS = ["kg", "g", "litre", "ml", "metre"];

export function unitShort(unit: string | null | undefined): string {
  return UNITS.find((u) => u.value === unit)?.short ?? unit ?? "";
}

export const PRICE_TIERS = [
  { value: "retail", label: "Détail" },
  { value: "semi", label: "Demi-gros" },
  { value: "wholesale", label: "Gros" },
] as const;
export type PriceTier = (typeof PRICE_TIERS)[number]["value"];

export function tierLabel(t: string): string {
  return PRICE_TIERS.find((p) => p.value === t)?.label ?? t;
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "free_money", label: "Free Money" },
  { value: "card", label: "Carte bancaire" },
  { value: "transfer", label: "Virement" },
  { value: "other", label: "Autre" },
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export function methodLabel(m: string): string {
  return PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m;
}

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  en_attente: { label: "En attente", tone: "muted" },
  confirmee: { label: "Confirmée", tone: "info" },
  preparee: { label: "Préparée", tone: "brand" },
  livree: { label: "Livrée", tone: "success" },
  annulee: { label: "Annulée", tone: "danger" },
};

export type Tone = "muted" | "info" | "brand" | "success" | "danger" | "warning";

export const ADJUST_REASONS = [
  { value: "casse", label: "Casse", direction: "out" },
  { value: "perte", label: "Perte", direction: "out" },
  { value: "vol", label: "Vol", direction: "out" },
  { value: "peremption", label: "Produit périmé", direction: "out" },
  { value: "consommation", label: "Usage interne", direction: "out" },
  { value: "don", label: "Don ou échantillon", direction: "out" },
  { value: "retrouve", label: "Article retrouvé", direction: "in" },
  { value: "erreur_saisie", label: "Correction de saisie", direction: "both" },
  { value: "autre", label: "Autre motif", direction: "both" },
] as const;

export function reasonLabel(r: string | null): string {
  if (!r) return "";
  if (r === "annulation") return "Annulation de vente";
  return ADJUST_REASONS.find((a) => a.value === r)?.label ?? r;
}

export const MOVEMENT_TYPES: Record<string, string> = {
  initial: "Stock initial",
  purchase: "Approvisionnement",
  sale: "Vente",
  sale_cancel: "Annulation de vente",
  adjustment: "Ajustement",
};

export const SECTORS = [
  "Vêtements et mode",
  "Chaussures",
  "Cosmétiques et beauté",
  "Alimentation",
  "Électronique",
  "Quincaillerie",
  "Magasin généraliste",
  "Commerce de gros",
  "Autre",
];

export function articleLabel(productName: string, variantName?: string | null): string {
  return variantName ? `${productName} · ${variantName}` : productName;
}
