import { createFileRoute } from "@tanstack/react-router";
import { NotReady } from "@/components/app/NotReady";

export const Route = createFileRoute("/_authenticated/app/stock/")({
  head: () => ({ meta: [{ title: "Stock | GESTOCK" }, { name: "description", content: "Stock dans GESTOCK." }] }),
  component: () => <NotReady title="Stock" />,
});
