import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/produits/nouveau")({
  head: () => ({ meta: [{ title: "Nouveau produit | GESTOCK" }, { name: "description", content: "Nouveau produit dans GESTOCK." }] }),
  component: () => <NotReady title="Nouveau produit" />,
});
