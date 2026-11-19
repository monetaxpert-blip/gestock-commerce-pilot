import type { ZodError } from "zod";

export type FormErrors<K extends string> = Partial<Record<K, string>>;

/** Transforme une erreur zod en messages par champ (premier message par champ). */
export function zodErrors<K extends string>(error: ZodError): FormErrors<K> {
  const out: FormErrors<K> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "") as K;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
