import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/commandes/")({
  head: () => ({ meta: [{ title: "Commandes | GESTOCK" }, { name: "description", content: "Commandes dans GESTOCK." }] }),
  component: () => <NotReady title="Commandes" />,
});
