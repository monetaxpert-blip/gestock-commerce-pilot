import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, ClipboardList, HandCoins, Package, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GESTOCK | Gestion commerciale pour commerçants" },
      { name: "description", content: "Produits, stock, ventes, bénéfices, commandes et clients dans un seul espace. Essai gratuit de 14 jours." },
      { property: "og:title", content: "GESTOCK | Gestion commerciale pour commerçants" },
      { property: "og:description", content: "Suivez votre stock, vos ventes et votre vrai bénéfice. 14 jours d'essai gratuit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Package, t: "Produits", d: "Déclinaisons, unités, cartons et trois niveaux de prix." },
  { icon: Boxes, t: "Stock", d: "Chaque entrée et sortie tracée, au coût moyen pondéré." },
  { icon: Wallet, t: "Ventes", d: "Remises, paiements multiples, Wave et Orange Money." },
  { icon: TrendingUp, t: "Bénéfices", d: "Bénéfice brut calculé au vrai coût d'achat." },
  { icon: ClipboardList, t: "Commandes", d: "Acomptes, préparation et livraison en vente." },
  { icon: HandCoins, t: "Clients", d: "Historique et restes à payer de chaque client." },
];

function Landing() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="hero-halo pointer-events-none absolute inset-0" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/auth">Se connecter</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Essai gratuit</Link></Button>
          </div>
        </header>
        <section className="relative mx-auto max-w-4xl px-5 pb-20 pt-16 text-center sm:pt-24 fade-up">
          <p className="mx-auto inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Pensé pour les commerçants, en FCFA</p>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Votre commerce, <span className="text-brand">enfin clair.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            GESTOCK réunit vos produits, votre stock, vos ventes, vos commandes et vos clients. Vous savez à tout moment ce que vous avez gagné.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12 glow-brand" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Commencer l'essai de 14 jours <ArrowRight /></Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sans carte bancaire. Vos données restent consultables après l'essai.</p>
        </section>
      </div>
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-lift">
              <Icon className="size-5 text-brand" />
              <h2 className="mt-4 text-lg font-semibold">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 shrink-0 text-success" />
          Chaque boutique dispose de son propre espace. Aucune autre boutique ne peut lire vos données.
        </div>
      </section>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} GESTOCK</footer>
    </div>
  );
}
