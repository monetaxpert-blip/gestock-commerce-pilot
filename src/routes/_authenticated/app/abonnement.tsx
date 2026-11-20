import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement | GESTOCK" }, { name: "description", content: "Abonnement dans GESTOCK." }] }),
  component: () => <NotReady title="Abonnement" />,
});
