import { supabase } from "@/integrations/supabase/client";

type PgError = { message?: string; code?: string; details?: string } | null | undefined;

/** Transforme une erreur technique en message clair pour le commerçant. */
export function friendlyError(error: unknown): string {
  const e = error as PgError;
  const msg = e?.message ?? (error instanceof Error ? error.message : "");
  const code = e?.code ?? "";
  if (code.startsWith("GS")) return msg;
  if (code === "23505") return "Cette valeur existe déjà. Utilisez une autre valeur.";
  if (code === "23503") return "Cet élément est utilisé ailleurs et ne peut pas être supprimé.";
  if (code === "42501") return "Action non autorisée. Votre accès est peut-être en lecture seule.";
  if (code === "23514") return "Une valeur saisie n'est pas valide.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Connexion impossible. Vérifiez votre accès à Internet puis réessayez.";
  if (/JWT|session/i.test(msg)) return "Votre session a expiré. Reconnectez-vous.";
  return msg || "Une erreur inattendue est survenue. Réessayez.";
}

export class FriendlyError extends Error {}

/** Appelle une opération sécurisée côté base. Lève une erreur lisible en cas d'échec. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const call = supabase.rpc as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: PgError }>;
  const { data, error } = await call.call(supabase, fn, args);
  if (error) throw new FriendlyError(friendlyError(error));
  return data as T;
}

/** Vérifie le résultat d'une requête directe sur une table. */
export function must<T>(res: { data: T; error: PgError }): T {
  if (res.error) throw new FriendlyError(friendlyError(res.error));
  return res.data;
}

export function newOperationKey(): string {
  return crypto.randomUUID();
}
