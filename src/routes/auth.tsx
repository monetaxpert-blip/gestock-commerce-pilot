import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { GoogleButton } from "@/components/app/GoogleButton";
import { friendlyError } from "@/lib/rpc";
import { signInWithApple } from "@/lib/google-auth";
import { zodErrors, type FormErrors } from "@/lib/validation";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? (s["mode"] as Mode) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion | GESTOCK" },
      { name: "description", content: "Connectez-vous à votre espace GESTOCK ou créez votre boutique avec 14 jours d'essai gratuit." },
      { property: "og:title", content: "Connexion | GESTOCK" },
      { property: "og:description", content: "Accédez à votre espace de gestion commerciale." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  identifier: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(1, "Saisissez votre mot de passe"),
});
const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Indiquez votre nom").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

function translateAuthError(message: string): string {
  if (/Invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/Email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse e-mail grâce au lien reçu.";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cette adresse e-mail.";
  if (/Password should be|weak/i.test(message)) return "Mot de passe trop faible. Choisissez-en un plus long ou moins courant.";
  if (/rate limit/i.test(message)) return "Trop de tentatives. Patientez quelques minutes.";
  return friendlyError({ message });
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors<"fullName" | "phone" | "email" | "identifier" | "password">>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", identifier: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/app", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErrors({});
    if (mode === "forgot") {
      const parsed = z.string().trim().email("Adresse e-mail invalide").safeParse(form.email);
      if (!parsed.success) return setErrors({ email: parsed.error.issues[0]?.message ?? "Adresse e-mail invalide" });
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error(translateAuthError(error.message));
      setSentTo(parsed.data);
      return;
    }
    const schema = mode === "signin" ? signInSchema : signUpSchema;
    const parsed = schema.safeParse(mode === "signin" ? { identifier: form.identifier, password: form.password } : form);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.identifier.trim().toLowerCase(), password: form.password });
      setBusy(false);
      if (error) return toast.error(translateAuthError(error.message));
      navigate({ to: "/app", replace: true });
    } else {
      const d = parsed.data as z.infer<typeof signUpSchema>;
      const { data, error } = await supabase.auth.signUp({
        email: d.email.trim().toLowerCase(),
        password: d.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: d.fullName, phone: d.phone?.trim() || null },
        },
      });
      setBusy(false);
      if (error) return toast.error(translateAuthError(error.message));
      if (data.session) {
        toast.success("Votre compte GESTOCK est créé.");
        navigate({ to: "/app", replace: true });
        return;
      }
      setSentTo(d.email.trim().toLowerCase());
      toast.success("Consultez votre boîte e-mail si une confirmation est demandée.");
    }
  }

  const titles: Record<Mode, { h: string; p: string }> = {
    signin: { h: "Bon retour", p: "Connectez-vous pour retrouver votre boutique." },
    signup: { h: "Créez votre compte", p: "14 jours d'essai gratuit, sans carte bancaire." },
    forgot: { h: "Mot de passe oublié", p: "Recevez un lien pour choisir un nouveau mot de passe." },
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="hero-halo pointer-events-none absolute inset-0" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <Link to="/" className="relative">
          <Logo />
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold leading-[1.08]">
            Chaque article compté.
            <br />
            <span className="text-brand">Chaque franc expliqué.</span>
          </p>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Votre stock se met à jour à chaque vente, votre bénéfice se calcule au vrai coût d'achat et vos clients
            savent ce qu'ils vous doivent.
          </p>
        </div>
        <ul className="relative grid grid-cols-3 gap-4 text-sm">
          {[
            ["14 jours", "d'essai gratuit"],
            ["FCFA", "sans arrondi caché"],
            ["Isolé", "un espace par boutique"],
          ].map(([a, b]) => (
            <li key={a} className="rounded-xl border border-border bg-card/60 p-4">
              <p className="font-display text-lg font-semibold text-foreground">{a}</p>
              <p className="text-muted-foreground">{b}</p>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex min-w-0 items-center justify-center px-4 py-7 sm:px-8 sm:py-10">
        <div className="w-full min-w-0 max-w-[440px] fade-up">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {sentTo ? (
            <div className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand-foreground">
                <MailCheck className="size-5" />
              </div>
              <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Un lien a été envoyé à <span className="font-medium text-foreground">{sentTo}</span>.{" "}
                {mode === "forgot"
                  ? "Ouvrez-le pour choisir un nouveau mot de passe."
                  : "Ouvrez-le pour confirmer votre adresse, puis connectez-vous."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Pensez à regarder dans les courriers indésirables.</p>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => {
                  setSentTo(null);
                  setMode("signin");
                }}
              >
                Revenir à la connexion
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-foreground"><span className="size-1.5 rounded-full bg-brand" /> Votre commerce, mieux organisé</div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{titles[mode].h}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{titles[mode].p}</p>

              {mode !== "forgot" && (
                <div className="mt-7 space-y-5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <GoogleButton />
                    <button type="button" onClick={async () => {
                      if (busy) return;
                      setBusy(true);
                      const result = await signInWithApple();
                      if (result.error) {
                        setBusy(false);
                        toast.error(result.error.message || "La connexion avec Apple a échoué. Réessayez.");
                      }
                    }} disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60">
                      <Apple className="size-[18px]" /> Continuer avec Apple
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    ou avec vos identifiants
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
                {mode === "signup" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nom complet" error={errors.fullName}>
                      <Input value={form.fullName} onChange={set("fullName")} autoComplete="name" placeholder="Awa Ndiaye" />
                    </Field>
                    <Field label="Téléphone (facultatif)" error={errors.phone}>
                      <Input value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" placeholder="77 123 45 67" />
                    </Field>
                  </div>
                )}
                {mode === "signin" ? (
                  <>
                    <Field label="Adresse e-mail" error={errors.identifier}>
                      <Input type="email" inputMode="email" value={form.identifier} onChange={set("identifier")} autoComplete="username" placeholder="vous@exemple.com" />
                    </Field>
                  </>
                ) : (
                  <Field label="Adresse e-mail" error={errors.email}>
                    <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" placeholder="vous@exemple.com" />
                  </Field>
                )}
                {mode !== "forgot" && (
                  <Field
                    label="Mot de passe"
                    error={errors.password}
                    aside={
                      mode === "signin" ? (
                        <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                          Mot de passe oublié ?
                        </button>
                      ) : null
                    }
                  >
                    <Input
                      type="password"
                      value={form.password}
                      onChange={set("password")}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      placeholder={mode === "signup" ? "8 caractères minimum" : ""}
                    />
                  </Field>
                )}
                <Button type="submit" className="h-11 w-full text-[0.95rem]" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Pas encore de compte ?{" "}
                    <button onClick={() => setMode("signup")} className="font-medium text-foreground underline-offset-4 hover:underline">
                      Essayer gratuitement
                    </button>
                  </>
                ) : mode === "signup" ? (
                  <>
                    Déjà inscrit ?{" "}
                    <button onClick={() => setMode("signin")} className="font-medium text-foreground underline-offset-4 hover:underline">
                      Se connecter
                    </button>
                  </>
                ) : (
                  <button onClick={() => setMode("signin")} className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <ArrowLeft className="size-4" /> Retour à la connexion
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, error, aside, children }: { label: string; error?: string | undefined; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[0.8rem] font-medium">{label}</Label>
        {aside}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
