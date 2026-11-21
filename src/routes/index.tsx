import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Check,
  ClipboardList,
  HandCoins,
  Package,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GESTOCK | Gérez votre stock, vos ventes et vos marges" },
      {
        name: "description",
        content:
          "La gestion commerciale pensée pour les boutiques et commerces : produits, stock, ventes, commandes, clients et suivi de la marge. Essayez GESTOCK pendant 14 jours.",
      },
      { property: "og:title", content: "GESTOCK | Votre commerce, mieux maîtrisé" },
      {
        property: "og:description",
        content:
          "Suivez vos stocks, enregistrez vos ventes et gardez une vision claire de vos marges avec GESTOCK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Package,
    title: "Vos produits, bien organisés",
    description:
      "Centralisez vos références, variantes, unités et tarifs pour retrouver rapidement chaque article.",
  },
  {
    icon: Boxes,
    title: "Un stock toujours suivi",
    description:
      "Visualisez les quantités disponibles et retrouvez les entrées, les sorties et les ajustements.",
  },
  {
    icon: Wallet,
    title: "Des ventes mieux maîtrisées",
    description:
      "Enregistrez vos ventes, appliquez vos remises et suivez les règlements, même partiels.",
  },
  {
    icon: TrendingUp,
    title: "Une marge plus lisible",
    description:
      "Suivez votre chiffre d'affaires, vos coûts d'achat et votre marge brute pour mieux décider.",
  },
  {
    icon: ClipboardList,
    title: "Des commandes bien suivies",
    description:
      "Gardez chaque commande sous contrôle, des acomptes à la préparation jusqu'à la livraison.",
  },
  {
    icon: HandCoins,
    title: "Des clients mieux suivis",
    description:
      "Retrouvez l'historique des achats, les paiements reçus et les montants restant à régler.",
  },
];

function Landing() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="hero-halo pointer-events-none absolute inset-0" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:py-6">
          <Logo />
          <nav aria-label="Navigation principale" className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer mon compte
              </Link>
            </Button>
          </nav>
        </header>

        <main>
          <section className="relative mx-auto max-w-5xl px-5 pb-20 pt-14 text-center sm:pb-24 sm:pt-20 fade-up">
            <p className="mx-auto inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
              La gestion commerciale pensée pour les commerces d'ici
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Le stock sous contrôle.
              <br />
              <span className="text-brand">Les ventes en vue.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              GESTOCK rassemble vos produits, vos stocks, vos ventes, vos commandes et vos clients dans un seul espace.
              Suivez votre activité et gardez une vision claire de votre marge, sans multiplier les cahiers et les fichiers.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 w-full glow-brand sm:w-auto" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Démarrer mes 14 jours d'essai <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto" asChild>
                <a href="#fonctionnalites">Découvrir GESTOCK</a>
              </Button>
            </div>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" /> 14 jours pour essayer
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" /> Sans carte bancaire
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" /> En FCFA
              </li>
            </ul>
          </section>
        </main>
      </div>

      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-16 sm:pb-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Tout au même endroit</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Les essentiels de votre commerce, réunis dans un seul outil.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Moins de suivi manuel. Une information plus claire pour agir au bon moment.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10">
                <Icon aria-hidden="true" className="size-5 text-brand" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <h3 className="text-sm font-semibold">Un espace dédié à votre boutique</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Vos informations de gestion restent séparées de celles des autres commerces. Vous travaillez dans votre propre espace.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="hero-halo pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Passez à une gestion plus claire</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Et si vous gardiez enfin le contrôle sur votre activité ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Essayez GESTOCK pendant 14 jours et découvrez une façon plus simple de suivre votre commerce.
            </p>
            <Button size="lg" className="mt-7 h-12 glow-brand" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer ma boutique gratuitement <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GESTOCK. Tous droits réservés.
      </footer>
    </div>
  );
}
