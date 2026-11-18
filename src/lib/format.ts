const moneyFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
const pctFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `${moneyFmt.format(Math.round(Number.isFinite(n) ? n : 0))} FCFA`;
}

export function moneyShort(value: number | string | null | undefined): string {
  return moneyFmt.format(Math.round(Number(value ?? 0)));
}

export function qty(value: number | string | null | undefined): string {
  return qtyFmt.format(Number(value ?? 0));
}

export function percent(value: number): string {
  return `${pctFmt.format(value)} %`;
}

export function variation(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const TZ = "Africa/Dakar";

export function dateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

export function dateOnly(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }).format(d);
}

export function dayLabel(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

/** Date du jour (AAAA-MM-JJ) dans le fuseau de la boutique. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isSameDayDakar(value: string): boolean {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(value)) === todayISO();
}

/** Convertit une saisie utilisateur ("12 500", "12,5") en nombre, ou null si invalide. */
export function parseNumber(input: string): number | null {
  const cleaned = input.replace(/[\s\u202f\u00a0]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
