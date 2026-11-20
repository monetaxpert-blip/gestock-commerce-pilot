import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/produits/$id")({
  head: () => ({ meta: [{ title: "Fiche produit | GESTOCK" }, { name: "description", content: "Fiche produit dans GESTOCK." }] }),
  component: () => <NotReady title="Fiche produit" />,
});
