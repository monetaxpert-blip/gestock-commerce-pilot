import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/parametres")({
  head: () => ({ meta: [{ title: "Paramètres | GESTOCK" }, { name: "description", content: "Paramètres dans GESTOCK." }] }),
  component: () => <NotReady title="Paramètres" />,
});
