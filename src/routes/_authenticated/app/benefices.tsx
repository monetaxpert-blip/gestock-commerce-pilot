import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/benefices")({
  head: () => ({ meta: [{ title: "Bénéfices | GESTOCK" }, { name: "description", content: "Bénéfices dans GESTOCK." }] }),
  component: () => <NotReady title="Bénéfices" />,
});
