import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/clients/")({
  head: () => ({ meta: [{ title: "Clients | GESTOCK" }, { name: "description", content: "Clients dans GESTOCK." }] }),
  component: () => <NotReady title="Clients" />,
});
