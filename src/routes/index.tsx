import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, ArrowUpRight, Bell, Boxes, ChartNoAxesCombined, ChevronDown,
  ClipboardList, LayoutDashboard, Menu, Package, Settings, ShoppingCart,
  Users, X, type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: DashboardPage });

type Section = "dashboard" | "products" | "stock" | "sales" | "margins" | "orders" | "customers" | "settings";
type NavItem = { id: Section; label: string; icon: LucideIcon; description: string };
const nav: NavItem[] = [
  { id: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, description: "Le résumé de votre activité" },
  { id: "products", label: "Produits", icon: Package, description: "Votre catalogue et vos tarifs" },
  { id: "stock", label: "Gestion du stock", icon: Boxes, description: "Les quantités et mouvements" },
  { id: "sales", label: "Ventes", icon: ShoppingCart, description: "Les ventes et les règlements" },
  { id: "margins", label: "Bénéfices", icon: ChartNoAxesCombined, description: "Vos marges et performances" },
  { id: "orders", label: "Commandes", icon: ClipboardList, description: "Le suivi des commandes clients" },
  { id: "customers", label: "Clients", icon: Users, description: "Votre fichier clients" },
];
const metrics = [
  { label: "Chiffre d'affaires", hint: "Après vos premières ventes", icon: ShoppingCart },
  { label: "Ventes réalisées", hint: "Vos ventes apparaîtront ici", icon: ChartNoAxesCombined },
  { label: "Marge brute", hint: "Calculée avec vos coûts d'achat", icon: ArrowUpRight },
  { label: "Références en stock", hint: "Votre catalogue de produits", icon: Boxes },
];
const steps: { no: string; title: string; detail: string; to: Section }[] = [
  { no: "01", title: "Configurez votre boutique", detail: "Ajoutez les informations de votre commerce.", to: "settings" },
  { no: "02", title: "Ajoutez vos produits", detail: "Créez votre catalogue, vos prix et vos variantes.", to: "products" },
  { no: "03", title: "Renseignez votre stock initial", detail: "Indiquez les quantités disponibles pour démarrer.", to: "stock" },
  { no: "04", title: "Enregistrez votre première vente", detail: "Suivez ventes, paiements et marges au même endroit.", to: "sales" },
];
const modules: Record<Exclude<Section, "dashboard">, { eyebrow: string; title: string; description: string; empty: string; detail: string }> = {
  products: { eyebrow: "CATALOGUE", title: "Vos produits", description: "Centralisez vos articles, variantes, références et tarifs dans un catalogue unique.", empty: "Votre catalogue commence ici", detail: "Les produits que vous ajouterez apparaîtront dans cet espace. Vous pourrez ensuite suivre leur stock et leurs performances." },
  stock: { eyebrow: "INVENTAIRE", title: "Gestion du stock", description: "Gardez une vision claire des quantités disponibles et de chaque mouvement de stock.", empty: "Aucun mouvement pour le moment", detail: "Votre historique affichera les stocks initiaux, approvisionnements, ventes, retours et ajustements." },
  sales: { eyebrow: "ACTIVITÉ COMMERCIALE", title: "Vos ventes", description: "Retrouvez vos ventes, les montants encaissés et les éventuels soldes à recevoir.", empty: "Aucune vente enregistrée", detail: "Vos ventes validées et leurs règlements seront regroupés ici, avec un historique consultable." },
  margins: { eyebrow: "PILOTAGE", title: "Bénéfices & marges", description: "Comprenez ce que vos ventes vous rapportent grâce au coût d'achat conservé pour chaque opération.", empty: "Vos indicateurs apparaîtront ici", detail: "La marge brute sera calculée à partir des ventes validées et des coûts historiques. Le bénéfice net ne sera affiché que si les charges nécessaires sont renseignées." },
  orders: { eyebrow: "SUIVI CLIENT", title: "Commandes", description: "Suivez chaque commande, de sa confirmation jusqu'à sa livraison et son règlement.", empty: "Aucune commande en cours", detail: "Les commandes clients, acomptes, livraisons et soldes restants seront suivis dans cet espace." },
  customers: { eyebrow: "RELATION CLIENT", title: "Vos clients", description: "Retrouvez les informations utiles et l'historique commercial de vos clients.", empty: "Votre fichier clients est vide", detail: "Les clients associés à vos ventes et commandes seront regroupés ici. Une vente comptoir pourra toujours être enregistrée sans fiche client." },
  settings: { eyebrow: "ESPACE DE TRAVAIL", title: "Paramètres de la boutique", description: "Les informations et préférences qui définissent votre espace GESTOCK.", empty: "Votre boutique n'est pas encore configurée", detail: "La configuration du nom, de la devise et du fuseau horaire sera disponible après la mise en place de votre compte." },
};

function Brand() {
  return <div className="brand"><span className="brand-mark"><i /><i /><i /></span><span>GESTOCK</span></div>;
}

function DashboardPage() {
  const [active, setActive] = useState<Section>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const current = nav.find((item) => item.id === active);
  const go = (section: Section) => { setActive(section); setMenuOpen(false); };
  return (
    <div className="app-shell">
      {menuOpen && <button className="scrim" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand-row"><Brand /><button className="mobile-close" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
          <div className="shop-switch"><span className="shop-avatar">G</span><span className="shop-label"><b>Mon commerce</b><small>Espace principal</small></span><ChevronDown size={15} /></div>
        </div>
        <p className="nav-label">MENU PRINCIPAL</p>
        <nav className="nav-list" aria-label="Navigation principale">
          {nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`nav-link ${active === item.id ? "selected" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span></button>; })}
        </nav>
        <div className="sidebar-foot">
          <button onClick={() => go("settings")} className={`nav-link ${active === "settings" ? "selected" : ""}`}><Settings size={18} /><span>Paramètres</span></button>
          <div className="help-card"><span className="help-icon">?</span><span><b>Besoin d'aide ?</b><small>Votre commerce, simplement.</small></span></div>
          <div className="account-row"><span className="account-avatar">MC</span><span><b>Mon compte</b><small>Administrateur</small></span><ChevronDown size={15} /></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb-wrap"><button className="mobile-menu" aria-label="Ouvrir le menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>GESTOCK</span><i>/</i><b>{active === "dashboard" ? "Vue d'ensemble" : current?.label ?? "Paramètres"}</b></div></div>
          <div className="top-actions"><span className="currency">FCFA <i>·</i> Dakar</span><button className="bell" aria-label="Notifications"><Bell size={18} /><i /></button><span className="top-divider" /><span className="top-avatar">MC</span></div>
        </header>
        <div className="page-wrap">
          {active === "dashboard" ? <Overview onNavigate={go} /> : <Module section={active} />}
          <footer className="footer"><b>GESTOCK</b><span>La gestion de votre commerce, en toute simplicité.</span><span>© 2026 GESTOCK</span></footer>
        </div>
      </main>
    </div>
  );
}

function Overview({ onNavigate }: { onNavigate: (section: Section) => void }) {
  return <>
    <div className="welcome"><div><p className="eyebrow">VOTRE ESPACE DE GESTION</p><h1>Bonjour et bienvenue<span>.</span></h1><p className="subtitle">Tout ce qu'il faut pour garder votre commerce sous contrôle.</p></div><span className="ready-pill"><i /> Espace prêt à configurer</span></div>
    <section className="metrics">
      {metrics.map((m) => { const Icon = m.icon; return <article className="metric" key={m.label}><div className="metric-head"><span>{m.label}</span><i><Icon size={17} /></i></div><strong>—</strong><small>{m.hint}</small></article>; })}
    </section>
    <div className="dashboard-columns">
      <section className="panel setup-panel">
        <div className="panel-title"><div><p className="eyebrow">POUR BIEN DÉMARRER</p><h2>Construisons votre espace</h2><p>Quelques étapes pour commencer à piloter votre activité.</p></div><div className="progress-count"><b>0/4</b><small>étapes</small></div></div>
        <div className="progress-track"><span /></div>
        <div className="step-list">{steps.map((step, index) => <button className="step" key={step.no} onClick={() => onNavigate(step.to)}><span className="step-no">{step.no}</span><span className="step-text"><b>{step.title}</b><small>{step.detail}</small></span><span className="step-arrow">{index === 0 ? <ArrowUpRight size={17} /> : <ArrowRight size={17} />}</span></button>)}</div>
      </section>
      <section className="panel activity-panel">
        <div className="panel-title compact"><div><p className="eyebrow">GESTOCK EN UN COUP D'ŒIL</p><h2>Votre activité</h2></div><span className="panel-tag">APERÇU</span></div>
        <div className="activity-empty"><div className="mini-chart"><span /><span /><span /><i /></div><b>Votre activité prendra forme ici</b><p>Vos ventes, vos marges et les mouvements de stock seront réunis dans un tableau de bord clair.</p></div>
        <div className="info-note"><i>i</i><span>Aucune donnée fictive : vos indicateurs se rempliront avec vos opérations réelles.</span></div>
      </section>
    </div>
    <section className="quick-section"><div className="quick-heading"><div><p className="eyebrow">VOS OUTILS</p><h2>Accès rapide</h2></div><span>Les essentiels de votre commerce</span></div><div className="quick-grid">
      <Quick label="Produits" detail="Gérer votre catalogue" icon={Package} tone="green" onClick={() => onNavigate("products")} />
      <Quick label="Stock" detail="Suivre vos quantités" icon={Boxes} tone="blue" onClick={() => onNavigate("stock")} />
      <Quick label="Ventes" detail="Consulter vos ventes" icon={ShoppingCart} tone="orange" onClick={() => onNavigate("sales")} />
      <Quick label="Clients" detail="Retrouver vos clients" icon={Users} tone="purple" onClick={() => onNavigate("customers")} />
    </div></section>
  </>;
}

function Quick({ label, detail, icon: Icon, tone, onClick }: { label: string; detail: string; icon: LucideIcon; tone: string; onClick: () => void }) {
  return <button className="quick-card" onClick={onClick}><i className={`quick-icon ${tone}`}><Icon size={19} /></i><span><b>{label}</b><small>{detail}</small></span><ArrowUpRight size={16} /></button>;
}

function Module({ section }: { section: Exclude<Section, "dashboard"> }) {
  const data = modules[section];
  const Icon = nav.find((item) => item.id === section)?.icon ?? Package;
  return <div className="module-page"><div className="module-head"><div><p className="eyebrow">{data.eyebrow}</p><h1>{data.title}<span>.</span></h1><p className="subtitle">{data.description}</p></div><i><Icon size={24} /></i></div><section className="panel empty-panel"><div className="empty-art"><span><Icon size={30} /></span><i /><i /><i /></div><h2>{data.empty}</h2><p>{data.detail}</p><small className="building"><i /> Espace en cours de construction</small></section></div>;
}
