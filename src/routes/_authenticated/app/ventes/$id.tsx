import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/ventes/$id")({
  head: () => ({ meta: [{ title: "Détail de la vente | GESTOCK" }, { name: "description", content: "Détail de la vente dans GESTOCK." }] }),
  component: () => <NotReady title="Détail de la vente" />,
});
