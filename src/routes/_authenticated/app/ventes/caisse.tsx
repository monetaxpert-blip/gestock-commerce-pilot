import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/ventes/caisse")({
  head: () => ({ meta: [{ title: "Caisse | GESTOCK" }, { name: "description", content: "Caisse dans GESTOCK." }] }),
  component: () => <NotReady title="Caisse" />,
});
