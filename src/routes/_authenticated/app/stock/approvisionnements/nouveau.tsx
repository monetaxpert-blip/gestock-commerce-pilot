import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/stock/approvisionnements/nouveau")({
  head: () => ({ meta: [{ title: "Nouvel approvisionnement | GESTOCK" }, { name: "description", content: "Nouvel approvisionnement dans GESTOCK." }] }),
  component: () => <NotReady title="Nouvel approvisionnement" />,
});
