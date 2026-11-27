import { useEffect, useState, type CSSProperties } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  HandCoins,
  Menu,
  X,
  Package,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GESTOCK | Sachez ce que vous avez, ce que vous vendez et ce que vous gagnez" },
      {
        name: "description",
        content:
          "Ne perdez plus le fil de votre boutique. Suivez vos produits, vos ventes, vos commandes et votre marge brute dans un seul espace de gestion.",
      },
      { property: "og:title", content: "GESTOCK | Votre boutique, enfin sous contrôle" },
      {
        property: "og:description",
        content:
          "Moins de cahiers dispersés, moins d'oublis : retrouvez les informations essentielles de votre boutique au même endroit.",
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
    number: "01",
    title: "Un catalogue toujours organisé",
    description:
      "Retrouvez vos produits, variantes, références et tarifs sans fouiller dans plusieurs cahiers ou fichiers.",
    detail: "Produits · Catégories · Tarifs",
  },
  {
    icon: Boxes,
    number: "02",
    title: "Un stock que vous pouvez suivre",
    description:
      "Visualisez les quantités disponibles, les entrées, les sorties et les articles à réapprovisionner.",
    detail: "Entrées · Sorties · Alertes",
  },
  {
    icon: Wallet,
    number: "03",
    title: "Des ventes mieux maîtrisées",
    description:
      "Enregistrez vos ventes, suivez les règlements et gardez une trace claire des montants encaissés.",
    detail: "Ventes · Remises · Paiements",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "Une marge plus facile à lire",
    description:
      "Comparez vos ventes au coût d'achat des articles pour suivre votre marge brute et mieux décider.",
    detail: "Chiffre d'affaires · Coûts · Marge brute",
  },
  {
    icon: ClipboardList,
    number: "05",
    title: "Des commandes sans oubli",
    description:
      "Suivez les commandes de vos clients, les acomptes reçus et les étapes jusqu'à la livraison.",
    detail: "Suivi · Acomptes · Livraison",
  },
  {
    icon: Users,
    number: "06",
    title: "Une meilleure connaissance client",
    description:
      "Retrouvez les coordonnées, l'historique des achats et les éventuels montants restant à régler.",
    detail: "Fiches clients · Historique · Soldes",
  },
];

const SAMPLE_BARS = [32, 48, 39, 61, 52, 73, 57, 82, 68, 92, 76, 100];

function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // OAuth providers may return users to the public root URL. If a session
  // already exists, bypass the marketing page and route by shop ownership.
  useEffect(() => {
    let active = true;
    let routing = false;

    const routeAuthenticatedUser = async () => {
      if (routing) return;
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;
      routing = true;

      const { data: shop, error } = await supabase.from("shops").select("id").maybeSingle();
      if (!active) return;
      if (error) {
        routing = false;
        navigate({ to: "/app", replace: true });
        return;
      }
      navigate({ to: shop ? "/app" : "/onboarding", replace: true });
    };

    void routeAuthenticatedUser();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void routeAuthenticatedUser();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => {
      // iOS Safari can report a desktop-sized layout viewport even on an iPhone.
      const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
      const mobile = media.matches || window.innerWidth <= 1100 || window.screen.width <= 1100 || touchDevice;
      setIsMobileViewport(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-shell dark min-h-screen bg-background text-foreground">
      <div className="landing-hero-wrap">
        <div className="landing-orb landing-orb-one" aria-hidden="true" />
        <div className="landing-orb landing-orb-two" aria-hidden="true" />
        <div className="landing-grid" aria-hidden="true" />

        <header className="landing-header" style={{ position: "relative", zIndex: 100 }}>
          <div className="landing-header-inner" style={isMobileViewport ? { display: "flex", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", width: "calc(100% - 28px)", minHeight: 68, gap: 8 } : undefined}>
            <Link to="/" aria-label="GESTOCK, accueil" className="landing-brand">
              <Logo />
            </Link>
            <nav className={`landing-nav-links${mobileMenuOpen ? " is-open" : ""}`} aria-label="Navigation principale" style={isMobileViewport ? { display: mobileMenuOpen ? "flex" : "none", position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, width: "100%", maxWidth: "100%", flexDirection: "column", alignItems: "stretch", gap: 0, padding: 16, borderRadius: 16, background: "#142420", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 18px 40px rgba(0,0,0,.35)", zIndex: 200 } : undefined}>
              <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
              <a href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>Questions fréquentes</a>
            </nav>
            <button
              type="button"
              className="landing-mobile-menu-toggle"
              style={isMobileViewport ? { display: "inline-flex", flex: "0 0 40px", width: 40, height: 40, alignItems: "center", justifyContent: "center" } : { display: "none" }}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <div className="landing-header-actions" style={isMobileViewport ? { display: "flex", flex: "0 0 auto", marginLeft: "auto", alignItems: "center", gap: 6 } : undefined}>
              <Button variant="ghost" className="landing-login" style={isMobileViewport ? { display: "none" } : undefined} asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button className="landing-nav-cta" style={isMobileViewport ? { width: 104, maxWidth: 104, minWidth: 0, minHeight: 38, padding: "5px 7px", whiteSpace: "normal", textAlign: "center", lineHeight: 1.15, fontSize: 10 } : undefined} asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Essayer gratuitement <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <section className="landing-hero">
            <div className="landing-hero-copy" data-reveal>
              <div className="landing-eyebrow">
                <span className="landing-eyebrow-dot" />
                PILOTEZ VOTRE BOUTIQUE AVEC DES CHIFFRES CLAIRS
              </div>
              <h1>
                Votre boutique tourne.
                <span> Vos chiffres doivent suivre.</span>
              </h1>
              <p className="landing-hero-description">
                Stock, ventes, commandes et clients : arrêtez de chercher vos informations dans plusieurs endroits. GESTOCK réunit l'essentiel de votre activité pour vous permettre de décider avec une vue claire, au quotidien.
              </p>
              <div className="landing-hero-actions">
                <Button size="lg" className="landing-primary-cta" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Démarrer mon essai gratuit <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <a className="landing-text-link" href="#fonctionnalites">
                  Découvrir GESTOCK <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="landing-trust-points">
                <span><CheckCircle2 aria-hidden="true" /> 14 jours d'essai gratuit</span>
                <span><CheckCircle2 aria-hidden="true" /> Conçu pour votre boutique</span>
                <span><CheckCircle2 aria-hidden="true" /> En français et en FCFA</span>
              </div>
            </div>

            <div className="landing-hero-visual" data-reveal>
              <div className="landing-visual-glow" aria-hidden="true" />
              <DashboardPreview />
              <div className="landing-float-card landing-float-stock">
                <span className="landing-float-icon"><Boxes aria-hidden="true" /></span>
                <span><strong>Stock suivi</strong><small>Entrées et sorties centralisées</small></span>
                <CheckCircle2 className="landing-float-check" aria-hidden="true" />
              </div>
              <div className="landing-float-card landing-float-margin">
                <span className="landing-float-icon landing-float-icon-gold"><TrendingUp aria-hidden="true" /></span>
                <span><strong>Marge plus lisible</strong><small>Ventes comparées aux coûts</small></span>
              </div>
            </div>
          </section>

          <div className="landing-value-strip" data-reveal>
            <p>Une gestion claire, du stock jusqu'à la vente.</p>
            <div className="landing-marquee-viewport">
              <div className="landing-marquee-track">
              <span><Package aria-hidden="true" /> Produits</span>
              <span><Boxes aria-hidden="true" /> Stock</span>
              <span><ShoppingBag aria-hidden="true" /> Ventes</span>
              <span><TrendingUp aria-hidden="true" /> Marges</span>
              <span><Users aria-hidden="true" /> Clients</span>
              <span><Package aria-hidden="true" /> Produits</span>
              <span><Boxes aria-hidden="true" /> Stock</span>
              <span><ShoppingBag aria-hidden="true" /> Ventes</span>
              <span><TrendingUp aria-hidden="true" /> Marges</span>
              <span><Users aria-hidden="true" /> Clients</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="landing-section landing-problem-section" data-reveal>
        <div className="landing-section-intro">
          <p className="landing-kicker">LES QUESTIONS QUI COMPTENT AU QUOTIDIEN</p>
          <h2>
            Moins de suppositions.
            <span>Plus de visibilité sur votre activité.</span>
          </h2>
          <p>
            En un coup d'œil, retrouvez les quantités disponibles, les ventes enregistrées et la marge brute estimée. Les informations sont regroupées dans votre espace, sans jongler entre cahiers et fichiers.
          </p>
        </div>
        <div className="landing-benefit-viewport" onPointerDown={(e) => { if (e.pointerType !== "mouse") return; const viewport = e.currentTarget; const track = viewport.querySelector(".landing-benefit-track"); if (track) track.style.animationPlayState = "paused"; viewport.dataset.dragStartX = String(e.clientX); viewport.dataset.scrollStart = String(viewport.scrollLeft); viewport.setPointerCapture(e.pointerId); viewport.style.cursor = "grabbing"; }} onPointerMove={(e) => { const viewport = e.currentTarget; if (e.pointerType !== "mouse" && viewport.dataset.dragStartX === undefined) return; if (viewport.dataset.dragStartX !== undefined) viewport.scrollLeft = Number(viewport.dataset.scrollStart || 0) - (e.clientX - Number(viewport.dataset.dragStartX)); }} onPointerUp={(e) => { const viewport = e.currentTarget; delete viewport.dataset.dragStartX; delete viewport.dataset.scrollStart; viewport.style.cursor = ""; const track = viewport.querySelector(".landing-benefit-track"); if (track) { track.style.animationPlayState = "paused"; window.setTimeout(() => { track.style.animationPlayState = ""; }, 1200); } }} onPointerCancel={(e) => { const viewport = e.currentTarget; delete viewport.dataset.dragStartX; delete viewport.dataset.scrollStart; viewport.style.cursor = ""; const track = viewport.querySelector(".landing-benefit-track"); if (track) track.style.animationPlayState = ""; }} onTouchStart={(e) => { const track = e.currentTarget.querySelector(".landing-benefit-track"); if (track) track.style.animationPlayState = "paused"; }} onTouchEnd={(e) => { const track = e.currentTarget.querySelector(".landing-benefit-track"); if (track) { track.style.animationPlayState = "paused"; window.setTimeout(() => { track.style.animationPlayState = ""; }, 1800); } }}>
          <div className="landing-benefit-track">
            {[0, 1].map((copy) => (
              <div className="landing-benefit-grid" key={copy} aria-hidden={copy === 1}>
                <article className="landing-benefit-card">
                  <div className="landing-benefit-index">01 / STOCK</div>
                  <div className="landing-benefit-icon"><Boxes aria-hidden="true" /></div>
                  <h3>Anticipez les ruptures.</h3>
                  <p>Suivez les quantités disponibles et repérez les articles qui approchent de leur seuil de réapprovisionnement.</p>
                </article>
                <article className="landing-benefit-card landing-benefit-card-featured">
                  <div className="landing-benefit-index">02 / VENTES</div>
                  <div className="landing-benefit-icon"><ShoppingBag aria-hidden="true" /></div>
                  <h3>Gardez une trace de chaque vente.</h3>
                  <p>Enregistrez vos ventes et règlements pour savoir ce qui a été encaissé et ce qui reste à recevoir.</p>
                </article>
                <article className="landing-benefit-card">
                  <div className="landing-benefit-index">03 / MARGE</div>
                  <div className="landing-benefit-icon"><TrendingUp aria-hidden="true" /></div>
                  <h3>Voyez ce que vos ventes rapportent.</h3>
                  <p>Le chiffre d'affaires ne dit pas tout. Comparez les ventes au coût des produits pour suivre votre marge brute estimée.</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="landing-section landing-features-section">
        <div className="landing-section-heading" data-reveal>
          <div>
            <p className="landing-kicker">LES FONCTIONNALITÉS</p>
            <h2>Les outils essentiels de votre commerce. <span>Réunis au même endroit.</span></h2>
          </div>
          <p>
            Produits, quantités, ventes, commandes et clients : vos informations sont organisées dans un espace unique.
          </p>
        </div>
        <div className="landing-feature-viewport" onPointerDown={(e) => { if (e.pointerType !== "mouse") return; const viewport = e.currentTarget; const track = viewport.querySelector(".landing-feature-track"); if (track) track.style.animationPlayState = "paused"; viewport.dataset.dragStartX = String(e.clientX); viewport.dataset.scrollStart = String(viewport.scrollLeft); viewport.setPointerCapture(e.pointerId); viewport.style.cursor = "grabbing"; }} onPointerMove={(e) => { const viewport = e.currentTarget; if (e.pointerType !== "mouse" && viewport.dataset.dragStartX === undefined) return; if (viewport.dataset.dragStartX !== undefined) viewport.scrollLeft = Number(viewport.dataset.scrollStart || 0) - (e.clientX - Number(viewport.dataset.dragStartX)); }} onPointerUp={(e) => { const viewport = e.currentTarget; delete viewport.dataset.dragStartX; delete viewport.dataset.scrollStart; viewport.style.cursor = ""; const track = viewport.querySelector(".landing-feature-track"); if (track) { track.style.animationPlayState = "paused"; window.setTimeout(() => { track.style.animationPlayState = ""; }, 1200); } }} onPointerCancel={(e) => { const viewport = e.currentTarget; delete viewport.dataset.dragStartX; delete viewport.dataset.scrollStart; viewport.style.cursor = ""; const track = viewport.querySelector(".landing-feature-track"); if (track) track.style.animationPlayState = ""; }} onTouchStart={(e) => { const track = e.currentTarget.querySelector(".landing-feature-track"); if (track) track.style.animationPlayState = "paused"; }} onTouchEnd={(e) => { const track = e.currentTarget.querySelector(".landing-feature-track"); if (track) { track.style.animationPlayState = "paused"; window.setTimeout(() => { track.style.animationPlayState = ""; }, 1800); } }}>
          <div className="landing-feature-track">
            {[0, 1].map((copy) => (
              <div className="landing-feature-grid" key={copy} aria-hidden={copy === 1}>
                {FEATURES.map(({ icon: Icon, number, title, description, detail }) => (
            <article className="landing-feature-card" key={number} data-reveal>
              <div className="landing-feature-topline">
                <span className="landing-feature-icon"><Icon aria-hidden="true" /></span>
                <span className="landing-feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="landing-feature-detail">{detail}</div>
            </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="landing-section landing-workflow-section">
        <div className="landing-workflow-copy" data-reveal>
          <p className="landing-kicker">UNE PRISE EN MAIN SANS DÉTOUR</p>
          <h2>Mettez votre boutique en place. <span>Suivez-la au quotidien.</span></h2>
          <p>
            Créez votre espace, renseignez vos articles et commencez à enregistrer vos opérations. GESTOCK rassemble ensuite vos repères de gestion au fil de votre activité.
          </p>
          <Button size="lg" className="landing-primary-cta" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Créer mon espace <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="landing-steps" data-reveal>
          <article className="landing-step">
            <span className="landing-step-number">1</span>
            <div><h3>Créer mon espace gratuit</h3><p>Renseignez les informations de votre boutique et préparez votre environnement de travail.</p></div>
          </article>
          <article className="landing-step">
            <span className="landing-step-number">2</span>
            <div><h3>Ajoutez vos produits</h3><p>Organisez votre catalogue, vos prix et les quantités disponibles.</p></div>
          </article>
          <article className="landing-step">
            <span className="landing-step-number">3</span>
            <div><h3>Suivez vos stocks et vos ventes</h3><p>Enregistrez vos ventes et consultez vos stocks, vos règlements et votre marge brute.</p></div>
          </article>
        </div>
      </section>

      <section className="landing-section landing-security-section" data-reveal>
        <div className="landing-security-icon"><ShieldCheck aria-hidden="true" /></div>
        <div className="landing-security-content">
          <p className="landing-kicker">VOTRE ESPACE, VOTRE ACTIVITÉ</p>
          <h2>Vos données de boutique ne sont pas celles des autres.</h2>
          <p>GESTOCK est conçu autour d'un espace distinct pour chaque commerce, afin que chacun retrouve son propre environnement de gestion.</p>
          <div className="landing-security-note"><Check aria-hidden="true" /> Un espace indépendant par boutique</div>
        </div>
      </section>

      <section className="landing-faq-section" id="faq">
        <div className="landing-faq-heading" data-reveal>
          <p className="landing-kicker">QUESTIONS FRÉQUENTES</p>
          <h2>Vous hésitez encore ? <span>Voici les réponses.</span></h2>
        </div>
        <div className="landing-faq-list" data-reveal>
          <details>
            <summary>À qui s'adresse GESTOCK ? <ChevronDown aria-hidden="true" /></summary>
            <p>GESTOCK s'adresse aux commerçants et petites boutiques qui souhaitent mieux organiser leurs produits, suivre leurs stocks, enregistrer leurs ventes et garder une vision de leur marge.</p>
          </details>
          <details>
            <summary>Que comprend la période d'essai ? <ChevronDown aria-hidden="true" /></summary>
            <p>Vous disposez de 14 jours pour découvrir l'application et prendre en main ses fonctionnalités de gestion.</p>
          </details>
          <details>
            <summary>Les montants sont-ils affichés en FCFA ? <ChevronDown aria-hidden="true" /></summary>
            <p>Oui. L'interface est conçue pour un usage en français avec des montants présentés en francs CFA (FCFA).</p>
          </details>
          <details>
            <summary>GESTOCK remplace-t-il mon comptable ? <ChevronDown aria-hidden="true" /></summary>
            <p>Non. GESTOCK est un outil de gestion commerciale pour suivre les produits, les stocks, les ventes et la marge brute. Il ne remplace pas une comptabilité complète ni les conseils d'un professionnel.</p>
          </details>
        </div>
      </section>

      <section className="landing-final-cta" data-reveal>
        <div className="landing-final-cta-orb" aria-hidden="true" />
        <p className="landing-kicker">LE PROCHAIN PAS EST SIMPLE</p>
        <h2>Faites le point sur votre boutique, chaque jour.</h2>
        <p>Essayez GESTOCK pendant 14 jours et retrouvez vos stocks, ventes et marges brutes estimées dans un espace organisé.</p>
        <Button size="lg" className="landing-primary-cta landing-final-button" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            Je commence gratuitement <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <span className="landing-final-note">14 jours d'essai · En français · En FCFA</span>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div><Logo /><p>Stock, ventes et clients : tout au même endroit.</p></div>
          <div className="landing-footer-links">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#comment-ca-marche">Comment ça marche</a>
            <a href="#faq">FAQ</a>
            <Link to="/auth">Connexion</Link>
          </div>
          <p className="landing-copyright">© {new Date().getFullYear()} GESTOCK. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="landing-dashboard-wrap">
      <div className="landing-dashboard-window">
        <div className="landing-dashboard-topbar">
          <div className="landing-window-dots"><i /><i /><i /></div>
          <span>APERÇU DE L'INTERFACE</span>
          <span className="landing-dashboard-status"><i /> Démonstration</span>
        </div>
        <div className="landing-dashboard-body">
          <aside className="landing-dashboard-sidebar">
            <div className="landing-mini-brand"><span>G</span><b>GESTOCK</b></div>
            <div className="landing-sidebar-label">MENU</div>
            <div className="landing-sidebar-item active"><TrendingUp /> Vue d'ensemble</div>
            <div className="landing-sidebar-item"><Package /> Produits</div>
            <div className="landing-sidebar-item"><Boxes /> Stock</div>
            <div className="landing-sidebar-item"><ShoppingBag /> Ventes</div>
            <div className="landing-sidebar-item"><ClipboardList /> Commandes</div>
            <div className="landing-sidebar-item"><Users /> Clients</div>
            <div className="landing-sidebar-bottom"><span className="landing-avatar">B</span><span><b>Ma boutique</b><small>Espace commerçant</small></span></div>
          </aside>
          <div className="landing-dashboard-main">
            <div className="landing-dashboard-heading">
              <div><small>VOTRE ACTIVITÉ</small><h3>Vue d'ensemble</h3><p>Retrouvez les repères essentiels de votre boutique.</p></div>
              <span className="landing-period">Exemple d'affichage <ChevronDown /></span>
            </div>
            <div className="landing-kpi-grid">
              <div className="landing-kpi"><span>Chiffre d'affaires</span><strong>1 245 000 <small>FCFA</small></strong><em><ArrowUpRight /> Exemple</em></div>
              <div className="landing-kpi"><span>Marge brute</span><strong>328 500 <small>FCFA</small></strong><em><TrendingUp /> Exemple</em></div>
              <div className="landing-kpi"><span>Articles en stock</span><strong>248</strong><em><Boxes /> Exemple</em></div>
            </div>
            <div className="landing-dashboard-panels">
              <div className="landing-chart-panel">
                <div className="landing-panel-heading"><div><b>Évolution des ventes</b><small>Illustration de la visualisation</small></div><span>12 périodes</span></div>
                <div className="landing-chart">
                  {SAMPLE_BARS.map((height, index) => <span key={index} style={{ "--bar-height": `${height}%`, "--bar-index": index } as CSSProperties}><i /></span>)}
                </div>
                <div className="landing-chart-labels"><span>Début</span><span>Évolution</span><span>Fin</span></div>
              </div>
              <div className="landing-stock-panel">
                <div className="landing-panel-heading"><div><b>Suivi du stock</b><small>Exemples d'articles</small></div><Boxes /></div>
                <div className="landing-stock-row"><span className="landing-stock-thumb thumb-one">S</span><span><b>Savon liquide</b><small>Référence produit</small></span><strong>En stock</strong></div>
                <div className="landing-stock-row"><span className="landing-stock-thumb thumb-two">R</span><span><b>Riz parfumé</b><small>Référence produit</small></span><strong>En stock</strong></div>
                <div className="landing-stock-row"><span className="landing-stock-thumb thumb-three">H</span><span><b>Huile végétale</b><small>Référence produit</small></span><strong className="stock-low">À surveiller</strong></div>
              </div>
            </div>
            <p className="landing-demo-disclaimer">Données fictives utilisées uniquement pour illustrer l'interface.</p>
          </div>
        </div>
      </div>
      <div className="landing-dashboard-shadow" aria-hidden="true" />
    </div>
  );
}
