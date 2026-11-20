import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/ventes/")({
  head: () => ({ meta: [{ title: "Ventes | GESTOCK" }, { name: "description", content: "Ventes dans GESTOCK." }] }),
  component: () => <NotReady title="Ventes" />,
});
